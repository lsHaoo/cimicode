// 导出所有 handler 供路由使用
export { getStatus } from "./status"
export { install } from "./install"
export { uninstall } from "./uninstall"
export { enable } from "./enable"
export { disable } from "./disable"

// 导出类型
export type {
  Status,
  InstallResult,
  UninstallResult,
  EnableResult,
  DisableResult,
} from "./types"

// 导出 Zod schema
export { Status, InstallResult, UninstallResult, EnableResult, DisableResult } from "./types"