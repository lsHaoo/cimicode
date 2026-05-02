import type { Context } from "hono"
import fs from "fs/promises"
import * as Log from "@opencode-ai/core/util/log"
import { getBasePath, validateRelativePath, validatePath } from "./utils"

const log = Log.create({ service: "delete" })

/**
 * 处理文件/文件夹删除
 */
export async function handleDelete(c: Context) {
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
    await fs.access(fullPath, fs.constants.R_OK)
  } catch {
    return c.json({ error: "File or directory not found" }, 404)
  }

  try {
    const stat = await fs.stat(fullPath)

    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true })
      log.info("directory deleted", { fullPath })
    } else {
      await fs.unlink(fullPath)
      log.info("file deleted", { fullPath })
    }

    return c.json({ success: true, path: relativePath })
  } catch (error) {
    log.error("failed to delete", { fullPath, error: error instanceof Error ? error.message : String(error) })
    return c.json({ error: "Failed to delete" }, 500)
  }
}