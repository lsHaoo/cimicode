import type { Context } from "hono"

/**
 * 上传结果
 */
export interface UploadResult {
  success: true
  path: string
  size: number
}

export interface UploadError {
  success: false
  path: string
  error: string
}

export type UploadResponse = UploadResult | UploadError

/**
 * 目录项类型
 */
export interface DirectoryItem {
  name: string
  type: "file" | "directory"
  size: number
  modifiedTime: string
  path: string
}

/**
 * 列出目录结果
 */
export interface ListResult {
  success: true
  path: string
  items: DirectoryItem[]
}

/**
 * 创建目录结果
 */
export interface CreateDirectoryResult {
  success: true
  path: string
}

/**
 * Handler 上下文
 */
export type HandlerContext = Context