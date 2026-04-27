import type { Context } from "hono"
import path from "path"
import fs from "fs"
import { Log } from "../util/log"
import { getBasePath, validateRelativePath, validatePath, getRelativePath } from "./utils"
import type { CreateDirectoryResult } from "./types"

const log = Log.create({ service: "mkdir" })

/**
 * 创建文件夹
 */
export async function handleCreateDirectory(c: Context) {
  const basePath = getBasePath()

  // 从请求体获取路径
  const body = await c.req.json()
  const relativePath = body.path as string | null

  if (!relativePath) {
    return c.json({ error: "Missing 'path' in request body" }, 400)
  }

  const fullPath = await validateRelativePath(c, relativePath)
  if (!fullPath) {
    return c.json({ error: "Absolute paths are not allowed. Use a relative path." }, 400)
  }

  // 安全检查确保路径在工作目录内
  if (!validatePath(basePath, fullPath)) {
    return c.json({ error: "Invalid path: path escapes project directory" }, 400)
  }

  // 创建目录
  try {
    await fs.promises.mkdir(fullPath, { recursive: true })

    // 计算返回的相对路径
    const returnPath = getRelativePath(basePath, fullPath)

    log.info("directory created", { path: returnPath })

    return c.json({
      success: true,
      path: returnPath,
    } as CreateDirectoryResult)
  } catch (err) {
    log.error("create directory failed", { error: err })
    const message = err instanceof Error ? err.message : "Unknown error"

    // 检查是否是路径已存在
    try {
      const stat = await fs.promises.stat(fullPath)
      if (stat.isDirectory()) {
        return c.json({ error: "Directory already exists" }, 409)
      } else {
        return c.json({ error: "Path exists but is not a directory" }, 409)
      }
    } catch {
      // 其他错误
    }

    return c.json({ error: message }, 500)
  }
}