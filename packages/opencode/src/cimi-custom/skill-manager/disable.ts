import { Skill } from "../../skill"
import { Config } from "@/config/config"
import { Log } from "@/util/log"

const log = Log.create({ service: "skill-manager" })

// Helper: dispose instance to trigger reload
async function disposeInstanceForReload() {
  const { Instance } = await import("../../project/instance")
  await Instance.disposeAll()
}

/**
 * 禁用 skill
 */
export async function disable(skillName: string) {
  try {
    const skillInfo = await Skill.get(skillName)
    if (!skillInfo) {
      return {
        success: false as const,
        message: `Skill '${skillName}' not found`,
        skillName,
        enabled: false,
      }
    }

    const config = await Config.get()
    const skillPermission = config.permission?.skill ?? "allow"

    let newPermission
    if (typeof skillPermission === "string") {
      newPermission = { [skillName]: "deny" }
    } else {
      newPermission = { ...skillPermission, [skillName]: "deny" as const }
    }

    await Config.updateGlobal({
      permission: {
        ...config.permission,
        skill: newPermission,
      },
    })
    await disposeInstanceForReload()

    return {
      success: true as const,
      message: `Skill '${skillName}' disabled`,
      skillName,
      enabled: false,
    }
  } catch (error) {
    log.error("failed to disable skill", { skillName, error })
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Failed to disable skill",
      skillName,
      enabled: false,
    }
  }
}