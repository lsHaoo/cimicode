import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Markdown } from "@opencode-ai/ui/markdown"
import { Tag } from "@opencode-ai/ui/tag"
import { TextField } from "@opencode-ai/ui/text-field"
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useServer } from "@/context/server"
import { cimiToken } from "@/utils/cimi"
import {
  type SkillAsset,
  type SkillPage,
  type SkillState,
  skillInstall,
  skillJoin,
  skillLocal,
  skillMarket,
  skillRead,
  skillStatus,
  skillUninstall,
} from "@/utils/skills"
import {
  type SkillTab,
  skillsAction,
  skillsMissing,
  skillsNote,
  skillsReadId,
  skillsSearch,
  skillsSelect,
  skillsSync,
  skillsText,
} from "./dialog-skills-state"

export type SkillsViewProps = {
  onClose?: () => void
  load?: (keyword: string) => Promise<SkillPage>
}

const empty: SkillAsset[] = []

type Mark = SkillState & {
  name: string
}

function chip(list: string[]) {
  const next = list.map((item) => item.trim()).filter(Boolean)
  if (!next.length) return ""
  return next.join(" / ")
}

function avatar(skill: Pick<SkillAsset, "avatar" | "name">) {
  if (skill.avatar) {
    return <img src={skill.avatar} alt={skill.name} class="size-11 rounded-full object-cover shrink-0 bg-surface-base" />
  }

  return (
    <div class="size-11 rounded-full shrink-0 bg-surface-panel border border-border-weak-base flex items-center justify-center text-14-medium text-text-strong">
      {skill.name.slice(0, 1).toUpperCase() || "S"}
    </div>
  )
}

export function SkillsView(props: SkillsViewProps) {
  const server = useServer()
  const [tab, setTab] = createSignal<SkillTab>("market")
  const [draft, setDraft] = createSignal("")
  const [query, setQuery] = createSignal("")
  const [pick, setPick] = createSignal("")
  const [busy, setBusy] = createStore({
    install: false,
    uninstall: false,
  })

  const load = (keyword: string) => {
    if (props.load) return props.load(keyword)
    return skillMarket({
      keyword,
      token: cimiToken(),
    })
  }

  const [page, act] = createResource(query, load)
  const [local, localAct] = createResource(
    () => server.current?.http.url,
    (url) => {
      if (!url) return Promise.resolve(empty)
      return skillLocal({ base: url })
    },
  )
  const mine = createMemo(() => local() ?? empty, empty)
  const market = createMemo(() => page()?.list ?? empty, empty)
  const list = createMemo(
    () => (tab() === "mine" ? mine() : market()),
    empty,
  )
  const current = createMemo(() => list().find((item) => item.id === pick()))
  const [info] = createResource(
    () =>
      skillsReadId({
        tab: tab(),
        pick: pick(),
        market: market(),
      }),
    (id) => {
      if (!id) return
      return skillRead({ id, token: cimiToken() })
    },
  )
  const [mark, markAct] = createResource(
    () => {
      const url = server.current?.http.url
      const skill = current()
      const name = skill?.name.trim()
      if (!url || !name) return
      return {
        base: url,
        name,
      }
    },
    async (item) => {
      const state = await skillStatus(item)
      if (!state) return
      return {
        name: item.name,
        exists: state.exists,
        enabled: state.enabled,
      } satisfies Mark
    },
  )
  const view = createMemo(() => {
    const item = current()
    if (!item) return
    if (tab() !== "market") return item
    const next = info()
    if (!next || next.id !== item.id) return item
    return skillJoin([item], [next])[0] ?? item
  })
  const state = createMemo(() => {
    const skill = current()
    const name = skill?.name.trim()
    const next = mark()
    if (!name || !next || next.name !== name) return
    return {
      exists: next.exists,
      enabled: next.enabled,
    } satisfies SkillState
  })
  const body = createMemo(() => view()?.content?.trim())
  const kind = createMemo(() => chip(view()?.cats ?? []))
  const action = createMemo(() =>
    skillsAction({
      tab: tab(),
      current: view(),
      state: state(),
      busy: tab() === "market" ? busy.install : busy.uninstall,
    }),
  )
  const missing = createMemo(() => skillsMissing(tab(), state()))
  const detail = createMemo(() => {
    return skillsNote({
      tab: tab(),
      current: view(),
      mine: mine(),
      list: list(),
      load: page.loading,
      mineLoad: local.loading,
    })
  })
  const fetch = () => {
    const next = skillsSearch(draft(), query())
    if (next.same) {
      act.refetch()
      return
    }
    setQuery(next.next)
  }
  const choose = (value: SkillTab) => {
    setTab(value)
    setPick(
      skillsSelect({
        tab: value,
        mine: mine(),
        market: market(),
        pick: pick(),
      }),
    )
  }
  const install = async () => {
    const url = server.current?.http.url
    const skill = view()
    const name = skill?.name.trim()
    const download = skill?.download?.trim()
    if (!url || !name || !download) return

    setBusy("install", true)
    const next = await skillInstall({
      base: url,
      name,
      url: download,
      token: cimiToken(),
      down: import.meta.env.VITE_CIMI_SKILL_DOWNLOAD_BASE,
    })
    if (next.ok) await Promise.all([markAct.refetch(), localAct.refetch()])
    setBusy("install", false)
  }
  const uninstall = async () => {
    const url = server.current?.http.url
    const skill = current()
    const name = skill?.name.trim()
    if (!url || !name) return

    setBusy("uninstall", true)
    // Temporary frontend fallback until server-side enable/disable is fixed.
    const next = await skillUninstall({ base: url, name, token: cimiToken() })
    if (next.ok) await Promise.all([markAct.refetch(), localAct.refetch()])
    setBusy("uninstall", false)
  }
  const press = async () => {
    const next = action()
    if (!next || next.disabled) return
    if (next.op === "install") {
      await install()
      return
    }
    await uninstall()
  }

  createEffect(() => {
    const next = skillsSync(list(), pick())
    if (next !== pick()) setPick(next)
  })

  return (
    <>
      <div class="skills-fullscreen-wrapper">
        <div class="skills-header">
        <div class="flex items-end gap-6 min-w-0">
          <div class="text-16-medium text-text-strong shrink-0 pb-2 border-b-2 border-transparent">Skills</div>
          <div class="flex items-end gap-4 min-w-0">
            <button
              type="button"
              data-skill-tab="mine"
              class="text-14-medium pb-2 border-b-2 transition-colors"
              classList={{
                "text-text-strong border-border-strong-base": tab() === "mine",
                "text-text-weak border-transparent": tab() !== "mine",
              }}
              onClick={() => choose("mine")}
            >
              我的技能
            </button>
            <button
              type="button"
              data-skill-tab="market"
              class="text-14-medium pb-2 border-b-2 transition-colors"
              classList={{
                "text-text-strong border-border-strong-base": tab() === "market",
                "text-text-weak border-transparent": tab() !== "market",
              }}
              onClick={() => choose("market")}
            >
              技能广场
            </button>
          </div>
        </div>
        <IconButton
          icon="close"
          variant="ghost"
          aria-label="Close skills"
          class="skills-close-button"
          onClick={() => props.onClose?.()}
        />
      </div>

        <div class="skills-content">
          <div class="skills-shell">
            <div class="skills-side">
            <Show when={tab() === "market"}>
              <div class="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-border-weak-base">
                <TextField
                  value={draft()}
                  onChange={setDraft}
                  onKeyDown={(event: KeyboardEvent) => {
                    if (event.key !== "Enter" || event.isComposing) return
                    event.preventDefault()
                    fetch()
                  }}
                  placeholder="按名称搜索技能"
                  class="h-9"
                />
                <Button size="small" class="h-9 px-3 shrink-0" data-component="skills-search" onClick={fetch}>
                  搜索
                </Button>
              </div>
            </Show>

            <div class="skills-list">
              <Show when={tab() === "market" && page.loading && list().length === 0}>
                <div class="skills-empty">加载中...</div>
              </Show>
              <Show when={tab() === "mine" && local.loading && mine().length === 0}>
                <div class="skills-empty">加载中...</div>
              </Show>
              <Show when={tab() === "mine" && !local.loading && mine().length === 0}>
                <div class="skills-empty">{skillsText.none}</div>
              </Show>
              <Show when={list().length > 0}>
                <div class="flex flex-col gap-3 p-4">
                  <For each={list()}>
                    {(skill) => (
                      <button
                        type="button"
                        data-skill-item={skill.id}
                        class="skills-item"
                        classList={{
                          "border-border-strong-base bg-surface-panel": pick() === skill.id,
                          "border-border-weak-base": pick() !== skill.id,
                        }}
                        onClick={() => setPick(skill.id)}
                      >
                        <div class="flex items-start gap-3">
                          {avatar(skill)}
                          <div class="min-w-0 flex-1 text-left">
                            <div class="text-14-medium text-text-strong truncate">{skill.name || "未命名技能"}</div>
                            <div class="text-12-regular text-text-weak line-clamp-2 mt-1">
                              {skill.description || "暂无简介"}
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>

            <div class="skills-main">
              <Show
                when={view()}
                fallback={
                  <div class="skills-detail-empty">
                    <div class="text-16-medium text-text-strong">{detail()}</div>
                  </div>
                }
              >
                {(skill) => (
                  <div class="h-full flex flex-col">
                  <div class="skills-main-head">
                    <div class="min-w-0 flex items-center gap-3">
                      {avatar(skill())}
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 min-w-0">
                          <div class="text-18-medium text-text-strong truncate">{skill().name || "未命名技能"}</div>
                          <Show when={tab() === "market" && kind()}>
                            {(text) => <div class="text-12-regular text-text-weak shrink-0">{text()}</div>}
                          </Show>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                      <Show when={missing()}>
                        <Tag>不存在</Tag>
                      </Show>
                      <Show when={action()}>
                        {(item) => (
                          <Button
                            size="small"
                            variant={item().variant}
                            class="h-8 px-4"
                            disabled={item().disabled}
                            onClick={() => void press()}
                          >
                            {item().text}
                          </Button>
                        )}
                      </Show>
                    </div>
                  </div>

                  <div class="skills-main-body">
                    <div class="skills-block">
                      <div class="skills-label">描述</div>
                      <div class="skills-copy">{skill().description || "暂无描述"}</div>
                    </div>

                    <div class="skills-block">
                      <div class="skills-label">内容</div>
                      <Show
                        when={body()}
                        fallback={<div class="skills-copy">{tab() === "market" && info.loading ? "加载中..." : "暂无内容"}</div>}
                      >
                        <div class="rounded-lg border border-border-weak-base bg-surface-base px-4 py-3">
                          <Markdown text={body()!} cacheKey={`${skill().id}:content`} class="text-13-regular" />
                        </div>
                      </Show>
                    </div>
                  </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function DialogSkills() {
  const dialog = useDialog()

  return (
    <Dialog size="x-large">
      <SkillsView onClose={() => dialog.close()} />
    </Dialog>
  )
}
