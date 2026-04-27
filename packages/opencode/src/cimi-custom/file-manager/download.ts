import type { Context } from "hono"
import path from "path"
import fs from "fs"
import { Log } from "../util/log"
import { getBasePath, validateRelativePath, validatePath } from "./utils"

const log = Log.create({ service: "download" })

/**
 * 处理文件下载
 */
export async function handleDownload(c: Context) {
  const basePath = getBasePath()

  // 从查询参数获取路径
  const relativePath = c.req.query("path") as string | null

  if (!relativePath) {
    return c.json({ error: "Missing 'path' query parameter" }, 400)
  }

  const fullPath = await validateRelativePath(c, relativePath)
  if (!fullPath) {
    return c.json({ error: "Absolute paths are not allowed. Use a relative path." }, 400)
  }

  // 安全检查确保路径在工作目录内
  if (!validatePath(basePath, fullPath)) {
    return c.json({ error: "Invalid path: path escapes project directory" }, 400)
  }

  // 检查文件是否存在
  try {
    await fs.promises.access(fullPath, fs.constants.R_OK)
  } catch {
    return c.json({ error: "File not found" }, 404)
  }

  // 获取文件信息
  const stat = await fs.promises.stat(fullPath)

  if (stat.isDirectory()) {
    return c.json({ error: "Cannot download a directory" }, 400)
  }

  const fileName = path.basename(fullPath)

  // 流式读取文件并返回
  const fileStream = fs.createReadStream(fullPath)

  // 设置响应头
  c.header("Content-Type", "application/octet-stream")
  c.header("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`)
  c.header("Content-Length", stat.size.toString())

  // 返回流式响应
  return c.body(fileStream as any)
}