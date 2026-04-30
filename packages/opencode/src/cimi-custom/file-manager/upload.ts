import type { Context } from "hono"
import path from "path"
import fs from "fs"
import os from "os"
import { Log } from "@/util"
import { getBasePath, validateRelativePath, resolveFullPath, validatePath, getRelativePath } from "./utils"
import type { UploadResponse } from "./types"
import { Config } from "@/config"
import { AppRuntime } from "@/effect/app-runtime"

const log = Log.create({ service: "upload" })

// 最大文件大小 500MB
const MAX_SIZE = 500 * 1024 * 1024

// YST 解密超时时间（毫秒）
const YST_DECRYPT_TIMEOUT = 10000

/**
 * 验证 YST URL 是否安全（防止 SSRF 攻击）
 * @param urlString 要验证的 URL
 * @returns 是否安全
 */
function isSafeYstUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // 只允许 http 和 https 协议
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false
    }

    const hostname = url.hostname.toLowerCase()

    // 1. 允许 localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true
    }

    // 2. 允许私网地址：10.x.x.x, 192.168.x.x, 172.16-31.x.x
    if (hostname.startsWith("10.")) {
      return true
    }
    if (hostname.startsWith("192.168.")) {
      return true
    }
    if (hostname.startsWith("172.")) {
      const parts = hostname.split(".")
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10)
        if (secondOctet >= 16 && secondOctet <= 31) {
          return true
        }
      }
    }

    // 3. 允许以 .internal 结尾的内部域名
    if (hostname.endsWith(".internal")) {
      return true
    }

    // 4. 阻止云元数据端点（防止 SSRF 攻击）
    const blockedHostnames = [
      "169.254.169.254", // AWS、GCP、Azure、阿里云的元数据端点
      "metadata.google.internal", // GCP 元数据服务
    ]
    if (blockedHostnames.includes(hostname)) {
      log.warn("Blocked cloud metadata endpoint", { hostname, url: urlString })
      return false
    }

    // 其他域名/ IP 拒绝
    return false
  } catch {
    return false
  }
}

// YST 解密服务默认 URL
const DEFAULT_YST_URL = "http://10.128.246.22:8081/sec-server/s/rs/uni"

/**
 * 获取 YST 解密服务 URL
 */
async function getYstUrl(): Promise<string> {
  // 1. 优先读取环境变量
  const envYstUrl = process.env.CXMT_YST_URL
  const trimmed = envYstUrl?.trim()
  if (trimmed) {
    return trimmed
  }

  // 2. Fallback 到 Config
  const config = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.get()))
  if (config.ystUrl) {
    return config.ystUrl
  }

  // 3. 使用默认值
  return DEFAULT_YST_URL
}

/**
 * 使用 YST 服务解密文件
 * @param fileBuffer 文件内容缓冲区
 * @returns 解密后的缓冲区和解密标志
 */
async function decryptWithYst(fileBuffer: Buffer): Promise<{ buffer: Buffer; returnFlag: string }> {
  const ystUrl = await getYstUrl()

  // 如果没有配置 YST URL，跳过解密
  if (!ystUrl) {
    log.debug("YST URL not configured, skipping decryption")
    return { buffer: fileBuffer, returnFlag: "2" }
  }

  // 安全验证：检查 YST URL 是否安全（防止 SSRF 攻击）
  if (!isSafeYstUrl(ystUrl)) {
    log.error("YST URL is not safe", { url: ystUrl })
    throw new Error("YST URL 不安全")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), YST_DECRYPT_TIMEOUT)

  try {
    const response = await fetch(ystUrl, {
      method: "POST",
      headers: {
        "method~name": "fileDecryptionRest",
        "data~fileOffset": "0",
        "Content-Type": "application/octet-stream",
        "data~counSize": fileBuffer.length.toString(),
      },
      body: fileBuffer,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`YST decryption failed: ${response.status} ${response.statusText}`)
    }

    const returnFlag = response.headers.get("data~returnFlag") || ""

    // returnFlag 包含 "0"：解密成功，返回解密后的数据
    if (returnFlag.includes("0")) {
      const decryptedBuffer = Buffer.from(await response.arrayBuffer())
      log.info("YST decryption successful", { originalSize: fileBuffer.length, decryptedSize: decryptedBuffer.length })
      return { buffer: decryptedBuffer, returnFlag }
    }

    // returnFlag 包含 "2"：不需要解密，使用原始文件
    if (returnFlag.includes("2")) {
      log.info("YST decryption not needed, using original file")
      return { buffer: fileBuffer, returnFlag }
    }

    // 其他情况：解密失败
    throw new Error(`YST decryption failed with returnFlag: ${returnFlag}`)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      log.error("YST decryption timeout", { timeout: YST_DECRYPT_TIMEOUT })
      throw new Error(`YST decryption timeout after ${YST_DECRYPT_TIMEOUT}ms`)
    }
    log.error("YST decryption error", { error })
    throw error
  }
}

// 上传结果构造器
const Result = {
  success: (path: string, size: number): UploadResponse => ({
    success: true,
    path,
    size,
  }),
  error: (message: string): UploadResponse => ({
    success: false,
    path: "",
    error: message,
  }),
}

/**
 * 处理文件上传
 * - 支持跨平台路径（兼容 / 和 \）
 * - 如果 path 是目录，自动使用文件名追加到目录后
 * - 限制最大 500MB
 */
export async function handleUpload(c: Context): Promise<UploadResponse> {
  const basePath = getBasePath()

  try {
    const contentType = c.req.header("content-type") || ""

    // 解析 multipart/form-data
    if (!contentType.includes("multipart/form-data")) {
      return Result.error("Content-Type must be multipart/form-data")
    }

    const formData = await c.req.formData()
    const file = formData.get("file") as File | null
    let targetPath = formData.get("path") as string | null

    if (!file) {
      return Result.error("No file provided")
    }

    if (!(file instanceof File)) {
      return Result.error("Invalid file field")
    }

    // 检查文件大小
    if (file.size > MAX_SIZE) {
      return Result.error(`File size exceeds maximum allowed size (${MAX_SIZE / 1024 / 1024}MB)`)
    }

    // 规范化路径
    let relativePath = targetPath || file.name

    const fullPath = await validateRelativePath(c, relativePath)
    if (!fullPath) {
      return Result.error("Absolute paths are not allowed. Use a relative path.")
    }

    // 检查目标路径是否已存在且为目录
    try {
      const stat = await fs.promises.stat(fullPath)
      if (stat.isDirectory()) {
        // 如果是目录，使用原文件名追加到目录后
        const fileName = file.name
        const newRelativePath = path.join(relativePath, fileName).replace(/\\/g, "/")
        const newFullPath = path.resolve(basePath, newRelativePath)
        log.info(`Target is directory, using ${newFullPath}`)
        targetPath = newFullPath
      }
    } catch {
      // 文件不存在，正常处理
    }

    // 确定最终的完整路径
    let finalFullPath: string
    if (targetPath) {
      // 如果 targetPath 已经是绝对路径，直接使用
      if (path.isAbsolute(targetPath)) {
        finalFullPath = targetPath
      } else {
        // 否则是相对路径，基于 basePath 解析
        finalFullPath = resolveFullPath(basePath, targetPath)
      }
    } else {
      finalFullPath = fullPath
    }
    // 安全检查：确保最终路径在工作目录内
    if (!validatePath(basePath, finalFullPath)) {
      return Result.error("Invalid path: path escapes project directory")
    }

    // 确保目标目录存在
    const dir = path.dirname(finalFullPath)
    await fs.promises.mkdir(dir, { recursive: true })

    // 写入临时文件
    const tempDir = os.tmpdir()
    const tempFile = path.join(tempDir, `.upload-${Date.now()}-${Math.random().toString(36).slice(2)}`)

    try {
      // 流式写入临时文件
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      // 使用 YST 服务解密文件（如需要）
      const { buffer: decryptedBuffer } = await decryptWithYst(fileBuffer)

      await fs.promises.writeFile(tempFile, decryptedBuffer)

      // 原子重命名到目标路径 (跨驱动器需要先复制再删除)
      try {
        await fs.promises.rename(tempFile, finalFullPath)
      } catch (renameError: any) {
        // 如果是跨驱动器错误 (EXDEV)，使用复制+删除的方式
        const errorMsg = renameError?.message || renameError?.toString?.() || ''
        log.info(`Rename failed (${errorMsg}), trying copyFile to ${finalFullPath}`)
        if (errorMsg.includes('EXDEV') || errorMsg.includes('cross-device')) {
          await fs.promises.copyFile(tempFile, finalFullPath)
          await fs.promises.unlink(tempFile)
        } else {
          throw renameError
        }
      }

      // 计算相对返回路径
      const returnPath = getRelativePath(basePath, finalFullPath)
      log.info("upload success", { path: returnPath, size: decryptedBuffer.length })

      return Result.success(returnPath, decryptedBuffer.length)
    } catch (writeError) {
      // 清理临时文件
      try {
        await fs.promises.unlink(tempFile)
      } catch {
        // 忽略删除失败
      }
      throw writeError
    }
  } catch (err) {
    log.error("upload failed", { error: err })
    const message = err instanceof Error ? err.message : "Unknown error"
    return Result.error(message)
  }
}