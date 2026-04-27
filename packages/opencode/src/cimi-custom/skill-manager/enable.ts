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
 * 启用 skill
 */
export async function enable(skillName: string) {
  try {
    // 使用 Skill.get() 检查是否存在
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
    if (typeof skillPermission === "string" && skillPermission === "deny") {
      newPermission = { [skillName]: "allow" }
    } else if (typeof skillPermission === "string") {
      newPermission = skillPermission
    } else {
      newPermission = { ...skillPermission, [skillName]: "allow" as const }
      if (newPermission[skillName] === "deny") {
        delete newPermission[skillName]
      }
    }

    if (newPermission !== skillPermission) {
      await Config.updateGlobal({
        permission: {
          ...config.permission,
          skill: newPermission,
        },
      })
      await disposeInstanceForReload()
    }

    return {
      success: true as const,
      message: `Skill '${skillName}' enabled`,
      skillName,
      enabled: true,
    }
  } catch (error) {
    log.error("failed to enable skill", { skillName, error })
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "Failed to enable skill",
      skillName,
      enabled: false,
    }
  }
}