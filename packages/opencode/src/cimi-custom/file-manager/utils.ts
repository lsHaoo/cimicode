import path from "path"
import { Instance } from "../../project/instance"
import { Log } from "../util/log"
import type { HandlerContext } from "./types"

const log = Log.create({ service: "file-manager" })

/**
 * 获取工作目录路径
 */
export function getBasePath(): string {
  return process.env.WORK_DIR || Instance.directory
}

/**
 * 规范化路径：统一使用正斜杠，兼容 Windows 和 Linux
 */
export function normalizePath(relativePath: string): string {
  return path.normalize(relativePath).replace(/\\/g, "/")
}

/**
 * 检查是否为绝对路径
 */
export function isAbsolutePath(relativePath: string): boolean {
  return relativePath.startsWith("/")
}

/**
 * 计算完整路径
 */
export function resolveFullPath(basePath: string, relativePath: string): string {
  const normalized = normalizePath(relativePath)
  return path.resolve(basePath, normalized)
}

/**
 * 安全检查：确保路径在工作目录内
 */
export function validatePath(basePath: string, fullPath: string): boolean {
  return fullPath.startsWith(basePath)
}

/**
 * 验证相对路径并返回完整路径
 * @param c Hono Context
 * @param relativePath 相对路径
 * @returns 完整路径，如果验证失败返回 null
 */
export async function validateRelativePath(c: HandlerContext, relativePath: string): Promise<string | null> {
  const basePath = getBasePath()

  // 检查必要参数
  if (!relativePath) {
    return null
  }

  // 安全检查：不允许绝对路径
  if (isAbsolutePath(relativePath)) {
    log.warn("Absolute path denied", { path: relativePath })
    return null
  }

  // 计算完整路径
  const fullPath = resolveFullPath(basePath, relativePath)

  // 安全检查：确保路径在工作目录内
  if (!validatePath(basePath, fullPath)) {
    log.warn("Path escapes work directory", { relativePath, fullPath })
    return null
  }

  return fullPath
}

/**
 * 从完整路径计算相对路径
 */
export function getRelativePath(basePath: string, fullPath: string): string {
  return path.relative(basePath, fullPath).replace(/\\/g, "/")
}