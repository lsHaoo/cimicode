import { Skill } from "@/skill"
import { Config } from "@/config"
import { Permission } from "@/permission"
import { AppRuntime } from "@/effect/app-runtime"

export async function getStatus(skillName: string) {
  const skillInfo = await AppRuntime.runPromise(Skill.Service.use((svc) => svc.get(skillName)))
  const exists = !!skillInfo

  let enabled = false
  if (exists) {
    try {
      const config = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.get()))
      if (config.permission?.skill) {
        const ruleset = Permission.fromConfig({ skill: config.permission.skill })
        const rule = Permission.evaluate("skill", skillName, ruleset)
        enabled = rule.action !== "deny"
      } else {
        enabled = true
      }
    } catch {
      enabled = true
    }
  }

  return { exists, enabled }
}
