import { cimiToken } from "@/utils/cimi"

export type SkillAsset = {
  id: string
  name: string
  description: string
  avatar: string
  cats: string[]
  ver?: number
  content?: string
  download?: string
}

export type SkillPage = {
  list: SkillAsset[]
  total: number
  pages: number
  size: number
  page: number
}

export type EnabledSkill = SkillAsset
export type SkillState = {
  exists: boolean
  enabled: boolean
}

type RawCat = {
  name?: string | null
}

type RawSkill = {
  id?: string | null
  name?: string | null
  description?: string | null
  avatar?: string | null
  categories?: RawCat[] | null
  currentVersion?: {
    versionNo?: number | null
  } | null
  version?: {
    versionNo?: number | null
    config?: {
      skillMdContent?: string | null
      attachment?: {
        downloadUrl?: string | null
      } | null
    } | null
  } | null
}

type RawPage = {
  code?: string | null
  message?: string | null
  data?: RawSkill[] | null
  totalSize?: number | null
  totalPages?: number | null
  pageSize?: number | null
  pageNum?: number | null
}

type RawInfo = {
  code?: string | null
  message?: string | null
  data?: RawSkill | null
}

type RawMine = {
  name?: string | null
  description?: string | null
  location?: string | null
  content?: string | null
}

type RawState = {
  exists?: boolean | null
  enabled?: boolean | null
}

type RawDone = {
  success?: boolean | null
  enabled?: boolean | null
}

type SkillDone = {
  ok: boolean
  enabled?: boolean
}

const ok = "SUCCESS"
const size = 900

function blank(): SkillPage {
  return {
    list: [],
    total: 0,
    pages: 0,
    size,
    page: 1,
  }
}

function root(base: string) {
  return base.endsWith("/") ? base : `${base}/`
}

function done(ok: boolean, enabled?: boolean): SkillDone {
  return typeof enabled === "boolean" ? { ok, enabled } : { ok }
}

function body(name: string) {
  return JSON.stringify({
    skillName: name.trim(),
  })
}

function json() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

export function skillDownUrl(url: string, base?: string) {
  const next = url.trim()
  if (!next) return ""
  if (/^https?:\/\//i.test(next)) return next
  const head = (base ?? "").trim().replace(/\/+$/, "")
  if (!head) return next
  return next.startsWith("/") ? `${head}${next}` : `${head}/${next}`
}

export function skillUrl(keyword?: string) {
  const url = new URL("/api/agi/chat/v1/marketplace/assets/skills", "https://local.test")
  url.searchParams.set("pageNum", "1")
  url.searchParams.set("pageSize", `${size}`)
  if (keyword?.trim()) url.searchParams.set("keyword", keyword.trim())
  return `${url.pathname}${url.search}`
}

export function skillInfoUrl(id: string) {
  return `/api/agi/chat/v1/marketplace/assets/skills/${id}`
}

export function skillHeaders(token = cimiToken()) {
  return {
    Accept: "application/json",
    "X-Access-Token": token ?? "",
  }
}

export function skillPick(skill: RawSkill): SkillAsset {
  return {
    id: skill.id ?? "",
    name: skill.name ?? "",
    description: skill.description ?? "",
    avatar: skill.avatar ?? "",
    cats: (skill.categories ?? []).map((item) => item.name?.trim()).filter((item): item is string => !!item),
    ver: skill.currentVersion?.versionNo ?? skill.version?.versionNo ?? undefined,
    ...(skill.version?.config?.skillMdContent?.trim() ? { content: skill.version.config.skillMdContent } : {}),
    ...(skill.version?.config?.attachment?.downloadUrl?.trim()
      ? { download: skill.version.config.attachment.downloadUrl }
      : {}),
  }
}

export function skillPage(body: RawPage): SkillPage {
  if (body.code !== ok) return blank()
  return {
    list: (body.data ?? []).map(skillPick),
    total: body.totalSize ?? 0,
    pages: body.totalPages ?? 0,
    size: body.pageSize ?? size,
    page: body.pageNum ?? 1,
  }
}

export function skillInfo(body: RawInfo) {
  if (body.code !== ok || !body.data) return
  return skillPick(body.data)
}

export function skillState(body: RawState) {
  if (typeof body.exists !== "boolean") return
  if (typeof body.enabled !== "boolean") return
  return {
    exists: body.exists,
    enabled: body.enabled,
  }
}

export function skillDone(body: RawDone) {
  if (body.success !== true) return done(false)
  return done(true, typeof body.enabled === "boolean" ? body.enabled : undefined)
}

function skillKey(skill: Pick<SkillAsset, "id" | "name">) {
  const name = skill.name.trim().toLowerCase()
  if (name) return name
  return skill.id
}

export function skillSnap(skill: SkillAsset): EnabledSkill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    avatar: skill.avatar,
    cats: [...skill.cats],
    ver: skill.ver,
    ...(skill.content ? { content: skill.content } : {}),
    ...(skill.download ? { download: skill.download } : {}),
  }
}

export function skillMine(items: Record<string, EnabledSkill>) {
  return Object.values(items).sort((a, b) => a.name.localeCompare(b.name))
}

export function skillMineUrl(base: string) {
  return new URL("skill", root(base))
}

export function skillStatusUrl(base: string, name: string) {
  const url = new URL("skill-manager/status", root(base))
  url.searchParams.set("skillName", name.trim())
  return url
}

export function skillEnableUrl(base: string) {
  return new URL("skill-manager/enable", root(base))
}

export function skillDisableUrl(base: string) {
  return new URL("skill-manager/disable", root(base))
}

export function skillInstallUrl(base: string) {
  return new URL("skill-manager/install", root(base))
}

export function skillUninstallUrl(base: string) {
  return new URL("skill-manager/uninstall", root(base))
}

export function skillMinePick(skill: RawMine): SkillAsset {
  return {
    id: skill.location?.trim() || skill.name?.trim() || "",
    name: skill.name?.trim() ?? "",
    description: skill.description ?? "",
    avatar: "",
    cats: [],
    ...(skill.content?.trim() ? { content: skill.content } : {}),
  }
}

export function skillJoin(...input: SkillAsset[][]) {
  const map = new Map<string, SkillAsset>()
  input.flat().forEach((skill) => {
    const key = skillKey(skill)
    if (!key) return
    const prev = map.get(key)
    if (!prev) {
      map.set(key, skill)
      return
    }
    map.set(key, {
      id: prev.id || skill.id,
      name: prev.name || skill.name,
      description: prev.description || skill.description,
      avatar: prev.avatar || skill.avatar,
      cats: prev.cats.length ? prev.cats : skill.cats,
      ver: prev.ver ?? skill.ver,
      ...(prev.content || skill.content ? { content: prev.content || skill.content } : {}),
      ...(prev.download || skill.download ? { download: prev.download || skill.download } : {}),
    })
  })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function skillHas(list: SkillAsset[], skill?: Pick<SkillAsset, "id" | "name">) {
  if (!skill) return false
  const key = skillKey(skill)
  if (!key) return false
  return list.some((item) => skillKey(item) === key)
}

export function skillPickId(list: Array<{ id: string }>, id?: string) {
  if (!list.length) return ""
  if (id && list.some((item) => item.id === id)) return id
  return list[0]?.id ?? ""
}

export function skillSet(
  items: Record<string, EnabledSkill>,
  skill: SkillAsset,
  enabled: boolean,
) {
  if (enabled) {
    return {
      ...items,
      [skill.id]: skillSnap(skill),
    }
  }

  const next = { ...items }
  delete next[skill.id]
  return next
}

export async function skillMarket(input: {
  keyword?: string
  token?: string
  fetch?: typeof fetch
}) {
  const url = skillUrl(input.keyword)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "GET",
    headers: skillHeaders(input.token),
  }).catch(() => undefined)

  if (!res?.ok) return blank()

  const body = await res.json().catch(() => undefined)
  if (!body) return blank()

  return skillPage(body as RawPage)
}

export async function skillRead(input: {
  id: string
  token?: string
  fetch?: typeof fetch
}) {
  const url = skillInfoUrl(input.id)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "GET",
    headers: skillHeaders(input.token),
  }).catch(() => undefined)

  if (!res?.ok) return

  const body = await res.json().catch(() => undefined)
  if (!body) return

  return skillInfo(body as RawInfo)
}

export async function skillLocal(input: {
  base: string
  fetch?: typeof fetch
}) {
  const url = skillMineUrl(input.base)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  }).catch(() => undefined)

  if (!res?.ok) return []
  const body = (await res.json()) as RawMine[] | unknown
  if (!Array.isArray(body)) return []
  return body.map(skillMinePick).filter((skill) => !!skill.id)
}

export async function skillStatus(input: {
  base: string
  name: string
  fetch?: typeof fetch
}) {
  const url = skillStatusUrl(input.base, input.name)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  }).catch(() => undefined)

  if (!res?.ok) return
  const next = await res.json().catch(() => undefined)
  if (!next) return
  return skillState(next as RawState)
}

export async function skillEnable(input: {
  base: string
  name: string
  fetch?: typeof fetch
}) {
  const url = skillEnableUrl(input.base)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "PUT",
    headers: json(),
    body: body(input.name),
  }).catch(() => undefined)

  if (!res?.ok) return done(false)
  const next = await res.json().catch(() => undefined)
  if (!next) return done(false)
  return skillDone(next as RawDone)
}

export async function skillDisable(input: {
  base: string
  name: string
  fetch?: typeof fetch
}) {
  const url = skillDisableUrl(input.base)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "PUT",
    headers: json(),
    body: body(input.name),
  }).catch(() => undefined)

  if (!res?.ok) return done(false)
  const next = await res.json().catch(() => undefined)
  if (!next) return done(false)
  return skillDone(next as RawDone)
}

export async function skillInstall(input: {
  base: string
  name: string
  url: string
  token?: string
  down?: string
  fetch?: typeof fetch
}) {
  const next = skillDownUrl(input.url, input.down)
  if (!next) return done(false)

  const url = skillInstallUrl(input.base)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "POST",
    headers: {
      ...json(),
      "X-Access-Token": input.token ?? cimiToken() ?? "",
    },
    body: JSON.stringify({
      skillName: input.name.trim(),
      downloadUrl: next,
    }),
  }).catch(() => undefined)

  if (!res?.ok) return done(false)
  const body = await res.json().catch(() => undefined)
  if (!body) return done(false)
  return skillDone(body as RawDone)
}

export async function skillUninstall(input: {
  base: string
  name: string
  token?: string
  fetch?: typeof fetch
}) {
  const url = skillUninstallUrl(input.base)
  const run = input.fetch ?? fetch
  const res = await run(url, {
    method: "DELETE",
    headers: {
      ...json(),
      "X-Access-Token": input.token ?? cimiToken() ?? "",
    },
    body: body(input.name),
  }).catch(() => undefined)

  if (!res?.ok) return done(false)
  const next = await res.json().catch(() => undefined)
  if (!next) return done(false)
  return skillDone(next as RawDone)
}
