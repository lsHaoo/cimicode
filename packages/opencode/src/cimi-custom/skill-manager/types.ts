import z from "zod"

export const Status = z.object({
  exists: z.boolean().describe("该 skill 是否存在"),
  enabled: z.boolean().describe("该 skill 是否处于启用状态"),
})
export type Status = z.infer<typeof Status>

export type InstallErrorType = "download_failed" | "invalid_package" | "extraction_failed"

export const InstallResult = z.object({
  success: z.boolean(),
  message: z.string(),
  skillName: z.string().optional(),
  errorType: z.enum(["download_failed", "invalid_package", "extraction_failed"]).optional(),
})
export type InstallResult = z.infer<typeof InstallResult>

export type UninstallErrorType = "not_found" | "delete_failed"

export const UninstallResult = z.object({
  success: z.boolean(),
  message: z.string(),
  skillName: z.string().optional(),
  errorType: z.enum(["not_found", "delete_failed"]).optional(),
})
export type UninstallResult = z.infer<typeof UninstallResult>

export const EnableResult = z.object({
  success: z.boolean(),
  message: z.string(),
  skillName: z.string(),
  enabled: z.boolean(),
})
export type EnableResult = z.infer<typeof EnableResult>

export const DisableResult = z.object({
  success: z.boolean(),
  message: z.string(),
  skillName: z.string(),
  enabled: z.boolean(),
})
export type DisableResult = z.infer<typeof DisableResult>

export const ToggleResult = z.object({
  success: z.boolean(),
  message: z.string(),
  skillName: z.string(),
  enabled: z.boolean(),
})
export type ToggleResult = z.infer<typeof ToggleResult>