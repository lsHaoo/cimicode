import { Skill } from "../../skill"
import { Config } from "@/config/config"
import { PermissionNext } from "@/permission/next"

/**
 * 获取 skill 状态
 */
export async function getStatus(skillName: string) {
  // 使用 Skill.get() 检查是否存在（复用 skill 服务的发现逻辑）
  const skillInfo = await Skill.get(skillName)
  const exists = !!skillInfo

  // 检查是否启用
  let enabled = false
  if (exists) {
    try {
      const config = await Config.get()
      if (config.permission?.skill) {
        // 将 Config.Permission 转换为 Ruleset
        const ruleset = PermissionNext.fromConfig({ skill: config.permission.skill })
        // 评估 skill 权限
        const rule = PermissionNext.evaluate("skill", skillName, ruleset)
        enabled = rule.action !== "deny"
      } else {
        // 没有配置，默认启用
        enabled = true
      }
    } catch {
      // 出错时默认启用
      enabled = true
    }
  }

  return { exists, enabled }
}