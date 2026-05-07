import { Skill } from "@/skill"
import { Config } from "@/config/config"
import * as Log from "@opencode-ai/core/util/log"
import { AppRuntime } from "@/effect/app-runtime"

const log = Log.create({ service: "skill-manager" })

async function disposeInstanceForReload() {
  const { disposeAllInstances } = await import("@/project/instance-runtime")
  await disposeAllInstances()
}

export async function disable(skillName: string) {
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

    let newPermission: Record<string, "allow" | "ask" | "deny">
    if (typeof skillPermission === "string") {
      newPermission = { [skillName]: "deny" }
    } else {
      newPermission = { ...skillPermission, [skillName]: "deny" }
    }

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
