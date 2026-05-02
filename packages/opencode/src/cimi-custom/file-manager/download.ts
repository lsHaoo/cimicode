import type { Context } from "hono"
import path from "path"
import fs from "fs"
import { execSync } from "child_process"
import * as Log from "@opencode-ai/core/util/log"
import { getBasePath, validateRelativePath, validatePath } from "./utils"
import { ZipWriter, BlobWriter, BlobReader } from "@zip.js/zip.js"

const log = Log.create({ service: "download" })

const DEFAULT_SIZE_LIMIT = 300 // MB

function getSizeLimit(): number {
  const envLimit = process.env.FOLDER_DOWNLOAD_SIZE_LIMIT
  if (envLimit) {
    const parsed = parseInt(envLimit, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return DEFAULT_SIZE_LIMIT
}

async function getFolderSize(folderPath: string): Promise<number> {
  try {
    const output = execSync(`du -sb "${folderPath}"`, { encoding: "utf8", windowsHide: true })
    const size = parseInt(output.split("\t")[0], 10)
    return isNaN(size) ? 0 : size
  } catch {
    return 0
  }
}

async function getAllFiles(dirPath: string, basePath: string): Promise<{ relativePath: string; fullPath: string; isDirectory: boolean }[]> {
  const items: { relativePath: string; fullPath: string; isDirectory: boolean }[] = []

  async function walk(currentPath: string, relativeToBase: string) {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      const relativePath = path.join(relativeToBase, entry.name)

      if (entry.isDirectory()) {
        items.push({ relativePath, fullPath, isDirectory: true })
        await walk(fullPath, relativePath)
      } else {
        items.push({ relativePath, fullPath, isDirectory: false })
      }
    }
  }

  await walk(dirPath, basePath)
  return items
}

export async function handleDownload(c: Context) {
  const basePath = getBasePath()

  const relativePath = c.req.query("path") as string | null

  if (!relativePath) {
    return c.json({ error: "Missing 'path' query parameter" }, 400)
  }

  const fullPath = await validateRelativePath(c, relativePath)
  if (!fullPath) {
    return c.json({ error: "Absolute paths are not allowed. Use a relative path." }, 400)
  }

  if (!validatePath(basePath, fullPath)) {
    return c.json({ error: "Invalid path: path escapes project directory" }, 400)
  }

  try {
    await fs.promises.access(fullPath, fs.constants.R_OK)
  } catch {
    return c.json({ error: "Not found" }, 404)
  }

  const stat = await fs.promises.stat(fullPath)

  if (stat.isDirectory()) {
    return handleDownloadFolder(c, fullPath, relativePath)
  }

  const fileName = path.basename(fullPath)
  const fileStream = fs.createReadStream(fullPath)

  c.header("Content-Type", "application/octet-stream")
  c.header("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`)
  c.header("Content-Length", stat.size.toString())

  return c.body(fileStream as any)
}

async function handleDownloadFolder(c: Context, fullPath: string, relativePath: string) {
  const sizeLimitBytes = getSizeLimit() * 1024 * 1024
  const folderSize = await getFolderSize(fullPath)

  if (folderSize > sizeLimitBytes) {
    const sizeMB = Math.round(folderSize / (1024 * 1024))
    const limitMB = getSizeLimit()
    log.warn("folder size exceeds limit", { fullPath, sizeMB, limitMB })
    return c.json(
      {
        error: `Folder size (${sizeMB}MB) exceeds the limit (${limitMB}MB). Set FOLDER_DOWNLOAD_SIZE_LIMIT environment variable to adjust.`,
      },
      400
    )
  }

  try {
    const items = await getAllFiles(fullPath, relativePath)
    const folderName = path.basename(fullPath) || relativePath

    const zipWriter = new ZipWriter(new BlobWriter())

    for (const item of items) {
      if (item.isDirectory) {
        await zipWriter.add(item.relativePath.replace(/\\/g, "/") + "/")
      } else {
        const fileContent = await fs.promises.readFile(item.fullPath)
        const blob = new Blob([fileContent])
        await zipWriter.add(item.relativePath.replace(/\\/g, "/"), new BlobReader(blob))
      }
    }

    const zipBlob = await zipWriter.close()
    const arrayBuffer = await zipBlob.arrayBuffer()

    c.header("Content-Type", "application/zip")
    c.header("Content-Disposition", `attachment; filename="${encodeURIComponent(folderName)}.zip"`)
    c.header("Content-Length", arrayBuffer.byteLength.toString())

    return c.body(new Uint8Array(arrayBuffer) as any)
  } catch (error) {
    log.error("failed to create zip", { fullPath, error: error instanceof Error ? error.message : String(error) })
    return c.json({ error: "Failed to create zip archive" }, 500)
  }
}
