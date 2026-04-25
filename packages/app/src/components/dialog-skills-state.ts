import { type SkillAsset, type SkillState, skillPickId } from "@/utils/skills"

export type SkillTab = "mine" | "market"
export type SkillAction = {
  op: "install" | "uninstall"
  text: string
  variant: "primary" | "ghost"
  disabled: boolean
}

export const skillsText = {
  none: "\u6682\u65e0\u5df2\u5b89\u88c5\u6280\u80fd",
  idle: "\u8bf7\u9009\u62e9\u6280\u80fd",
  empty: "\u6682\u65e0\u6280\u80fd",
  load: "\u52a0\u8f7d\u4e2d...",
}

export function skillsSearch(draft: string, query: string) {
  const next = draft.trim()
  return {
    next,
    same: next === query,
  }
}

export function skillsSelect(input: {
  tab: SkillTab
  mine: SkillAsset[]
  market: SkillAsset[]
  pick?: string
}) {
  return skillPickId(input.tab === "mine" ? input.mine : input.market, input.pick)
}

export function skillsSync(list: SkillAsset[], pick?: string) {
  return skillPickId(list, pick)
}

export function skillsReadId(input: {
  tab: SkillTab
  pick?: string
  market: SkillAsset[]
}) {
  if (input.tab !== "market" || !input.pick) return
  return input.market.find((item) => item.id === input.pick)?.id
}

export function skillsNote(input: {
  tab: SkillTab
  current?: SkillAsset
  mine: SkillAsset[]
  list: SkillAsset[]
  load?: boolean
  mineLoad?: boolean
}) {
  if (input.current) return skillsText.idle
  if (input.tab === "market" && input.load) return skillsText.load
  if (input.tab === "mine" && input.mineLoad) return skillsText.load
  if (input.tab === "mine" && input.mine.length === 0) return skillsText.none
  if (input.tab === "market" && input.list.length === 0) return skillsText.empty
  return skillsText.idle
}

export function skillsMissing(tab: SkillTab, state?: SkillState) {
  return tab === "mine" && state?.exists === false
}

export function skillsAction(input: {
  tab: SkillTab
  current?: Pick<SkillAsset, "download">
  state?: SkillState
  busy?: boolean
}) {
  if (!input.current) return

  if (input.tab === "mine") {
    if (input.state?.exists !== true) return
    // Temporary frontend fallback until server-side enable/disable is fixed.
    return {
      op: "uninstall",
      text: "\u5378\u8f7d",
      variant: "ghost",
      disabled: !!input.busy,
    } satisfies SkillAction
  }

  return {
    op: "install",
    text: input.state?.exists ? "\u5df2\u5b89\u88c5" : "\u5b89\u88c5",
    variant: input.state?.exists ? "ghost" : "primary",
    disabled: !!input.busy || input.state?.exists === true || !(input.state && !input.state.exists && input.current.download),
  } satisfies SkillAction
}
