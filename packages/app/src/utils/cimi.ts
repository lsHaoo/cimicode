const key = "cimi.skills.token"
const name = "token"

type Store = Pick<Storage, "getItem" | "setItem">
type Hist = Pick<History, "replaceState">

const read = (store?: Pick<Storage, "getItem">) => {
  if (!store) return
  try {
    return store.getItem(key) ?? undefined
  } catch {
    return
  }
}

const write = (store: Pick<Storage, "setItem"> | undefined, token: string) => {
  if (!store) return
  try {
    store.setItem(key, token)
  } catch {
    return
  }
}

export function cimiToken(store?: Pick<Storage, "getItem">) {
  return read(store ?? (typeof sessionStorage === "object" ? sessionStorage : undefined))
}

export function cimiUrl(url: URL) {
  const next = new URL(url.toString())
  const token = next.searchParams.get(name) ?? undefined
  const seen = next.searchParams.has(name)
  next.searchParams.delete(name)
  return {
    seen,
    token: token || undefined,
    href: `${next.pathname}${next.search}${next.hash}`,
  }
}

export function cimiBoot(input?: {
  url?: URL
  store?: Store
  hist?: Hist
}) {
  const url = input?.url ?? (typeof location === "object" ? new URL(location.href) : new URL("https://localhost/"))
  const store = input?.store ?? (typeof sessionStorage === "object" ? sessionStorage : undefined)
  const hist = input?.hist ?? (typeof history === "object" ? history : undefined)
  const next = cimiUrl(url)

  if (next.token) write(store, next.token)
  if (next.seen) hist?.replaceState?.(null, "", next.href)

  return next.token ?? read(store)
}
