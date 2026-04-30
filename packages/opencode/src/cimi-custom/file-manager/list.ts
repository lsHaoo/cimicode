import type { Context } from "hono"
import path from "path"
import fs from "fs"
import { Log } from "@/util"
import { getBasePath, validateRelativePath, validatePath, getRelativePath } from "./utils"
import type { ListResult, DirectoryItem } from "./types"

const log = Log.create({ service: "list" })

/**
 * 列出目录下的所有文件和文件夹
 */
export async function handleList(c: Context) {
  const basePath = getBasePath()

  // 从查询参数获取路径（可选，默认是根目录）
  const relativePath = c.req.query("path") as string | null || "."

  const fullPath = await validateRelativePath(c, relativePath)
  if (!fullPath) {
    return c.json({ error: "Absolute paths are not allowed. Use a relative path." }, 400)
  }

  // 安全检查确保路径在工作目录内
  if (!validatePath(basePath, fullPath)) {
    return c.json({ error: "Invalid path: path escapes project directory" }, 400)
  }

  // 检查路径是否存在且为目录
  try {
    const stat = await fs.promises.stat(fullPath)
    if (!stat.isDirectory()) {
      return c.json({ error: "Path is not a directory" }, 400)
    }
  } catch {
    return c.json({ error: "Directory not found" }, 404)
  }

  // 读取目录内容
  try {
    const entries = await fs.promises.readdir(fullPath, { withFileTypes: true })

    const items = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(fullPath, entry.name)
      const entryStat = await fs.promises.stat(entryPath)

      // 计算相对路径
      const entryRelativePath = getRelativePath(basePath, entryPath)

      return {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        size: entry.isDirectory() ? 0 : entryStat.size,
        modifiedTime: entryStat.mtime.toISOString(),
        path: entryRelativePath,
      } as DirectoryItem
    }))

    // 按类型排序：目录在前，文件在后，同类型按名称排序
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    const normalizedPath = relativePath === "." ? "" : relativePath

    return c.json({
      success: true,
      path: normalizedPath,
      items,
    } as ListResult)
  } catch (err) {
    log.error("list directory failed", { error: err })
    return c.json({ error: "Failed to list directory" }, 500)
  }
}