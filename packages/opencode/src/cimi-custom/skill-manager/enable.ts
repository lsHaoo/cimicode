import { Skill } from "@/skill"
import { Config } from "@/config"
import { Log } from "@/util"
import { AppRuntime } from "@/effect/app-runtime"

const log = Log.create({ service: "skill-manager" })

async function disposeInstanceForReload() {
  const { Instance } = await import("@/project/instance")
  await Instance.disposeAll()
}

export async function enable(skillName: string) {
  try {
    const skillInfo = await AppRuntime.runPromise(Skill.Service.use((svc) => svc.get(skillName)))
    if (!skillInfo) {
      return {
        success: false as const,
        message: `Skill '${skillName}' not found`,
        skillName,
        enabled: false,
      }
    }

    const config = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.get()))
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
      await AppRuntime.runPromise(
        Config.Service.use((cfg) =>
          cfg.updateGlobal({
            permission: {
              ...config.permission,
              skill: newPermission,
            },
          })
        ),
      )
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
