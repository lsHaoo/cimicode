import * as Log from "@opencode-ai/core/util/log"
import { Global } from "@opencode-ai/core/global"
import path from "path"
import fs from "fs/promises"

const log = Log.create({ service: "skill-manager" })

function getSkillInstallDir(): string {
  return path.join(Global.Path.config, "skills")
}

async function disposeInstanceForReload() {
  const { disposeAllInstances } = await import("@/project/instance-runtime")
  await disposeAllInstances()
}

type UninstallErrorType = "not_found" | "delete_failed"

export async function uninstall(skillName: string) {
  try {
    const installDir = getSkillInstallDir()
    const skillDir = path.join(installDir, skillName)

    const skillMdPath = path.join(skillDir, "SKILL.md")
    const exists = await fs.access(skillMdPath).then(() => true).catch(() => false)

    if (!exists) {
      return {
        success: false as const,
        message: `Skill '${skillName}' is not installed`,
        skillName,
        errorType: "not_found" as UninstallErrorType,
      }
    }

    log.info("uninstalling skill", { skillName })

    await fs.rm(skillDir, { recursive: true, force: true })
    await disposeInstanceForReload()

    log.info("skill uninstalled successfully", { skillName })

    return {
      success: true as const,
      message: `Skill '${skillName}' uninstalled successfully`,
      skillName,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    log.error("failed to uninstall skill", {
      skillName,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      errorType: "delete_failed" as UninstallErrorType,
    })

    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Failed to uninstall skill",
      skillName,
      errorType: "delete_failed" as UninstallErrorType,
    }
  }
}
