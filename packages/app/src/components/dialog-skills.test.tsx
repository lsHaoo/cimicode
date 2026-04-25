import { describe, expect, test } from "bun:test"
import type { SkillAsset } from "@/utils/skills"
import {
  skillsAction,
  skillsMissing,
  skillsNote,
  skillsReadId,
  skillsSearch,
  skillsSelect,
  skillsSync,
  skillsText,
} from "./dialog-skills-state"

function skill(id: string, name: string): SkillAsset {
  return {
    id,
    name,
    description: `${name} desc`,
    avatar: "",
    cats: ["\u4ee3\u7801\u751f\u6210"],
    ver: 1,
  }
}

describe("skills view", () => {
  test("commits search text and keeps list selection aligned with marketplace results", () => {
    const first = [skill("1", "Alpha"), skill("3", "Gamma")]
    const next = [skill("2", "Beta")]

    expect(skillsSearch(" beta ", "")).toEqual({
      next: "beta",
      same: false,
    })
    expect(
      skillsSelect({
        tab: "market",
        mine: [],
        market: first,
        pick: "",
      }),
    ).toBe("1")
    expect(skillsSync(next, "1")).toBe("2")
  })

  test("shows my skills empty state and keeps local selection behavior", () => {
    const alpha = skill("1", "Alpha")
    expect(
      skillsNote({
        tab: "mine",
        mine: [],
        list: [],
      }),
    ).toBe(skillsText.none)
    expect(
      skillsSelect({
        tab: "mine",
        mine: [alpha],
        market: [],
        pick: "",
      }),
    ).toBe("1")
  })

  test("derives my skills action and missing state from status", () => {
    const alpha = skill("1", "Alpha")

    expect(skillsMissing("mine", { exists: false, enabled: false })).toBe(true)
    expect(skillsAction({ tab: "mine", current: alpha })).toBeUndefined()
    expect(
      skillsAction({
        tab: "mine",
        current: alpha,
        state: { exists: false, enabled: false },
      }),
    ).toBeUndefined()
    expect(
      skillsAction({
        tab: "mine",
        current: alpha,
        state: { exists: true, enabled: false },
      }),
    ).toEqual({
      op: "uninstall",
      text: "\u5378\u8f7d",
      variant: "ghost",
      disabled: false,
    })
    expect(
      skillsAction({
        tab: "mine",
        current: alpha,
        state: { exists: true, enabled: true },
        busy: true,
      }),
    ).toEqual({
      op: "uninstall",
      text: "\u5378\u8f7d",
      variant: "ghost",
      disabled: true,
    })
  })

  test("derives marketplace install state from status and detail", () => {
    const alpha = {
      ...skill("1", "Alpha"),
      download: "https://cdn.example.com/alpha.zip",
    }

    expect(
      skillsAction({
        tab: "market",
        current: alpha,
      }),
    ).toEqual({
      op: "install",
      text: "\u5b89\u88c5",
      variant: "primary",
      disabled: true,
    })
    expect(
      skillsAction({
        tab: "market",
        current: alpha,
        state: { exists: false, enabled: false },
      }),
    ).toEqual({
      op: "install",
      text: "\u5b89\u88c5",
      variant: "primary",
      disabled: false,
    })
    expect(
      skillsAction({
        tab: "market",
        current: alpha,
        state: { exists: true, enabled: true },
      }),
    ).toEqual({
      op: "install",
      text: "\u5df2\u5b89\u88c5",
      variant: "ghost",
      disabled: true,
    })
    expect(
      skillsAction({
        tab: "market",
        current: skill("2", "Beta"),
        state: { exists: false, enabled: false },
      }),
    ).toEqual({
      op: "install",
      text: "\u5b89\u88c5",
      variant: "primary",
      disabled: true,
    })
  })

  test("does not read marketplace detail for local skill ids", () => {
    const market = [skill("1", "Alpha"), skill("2", "Beta")]

    expect(
      skillsReadId({
        tab: "mine",
        pick: "/home/ws/.config/opencode/skills/alpha/SKILL.md",
        market,
      }),
    ).toBeUndefined()
    expect(
      skillsReadId({
        tab: "market",
        pick: "/home/ws/.config/opencode/skills/alpha/SKILL.md",
        market,
      }),
    ).toBeUndefined()
    expect(
      skillsReadId({
        tab: "market",
        pick: "2",
        market,
      }),
    ).toBe("2")
  })
})
