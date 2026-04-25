import DOMPurify from "dompurify"
import { Button } from "./button"
import { useI18n } from "../context/i18n"
import { createEffect, createMemo, createSignal, onCleanup, type ComponentProps } from "solid-js"

const csp =
  "default-src 'none'; img-src data: blob: http: https:; media-src data: blob: http: https:; font-src data: blob: http: https:; style-src 'unsafe-inline'; script-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

const cfg = {
  USE_PROFILES: { html: true },
  SANITIZE_NAMED_PROPS: true,
  ADD_ATTR: ["style"],
  FORBID_TAGS: ["script", "noscript", "iframe", "object", "embed", "base"],
  FORBID_CONTENTS: ["script", "noscript", "iframe", "object", "embed"],
}

const rel = new Set(["stylesheet", "preload", "prefetch", "modulepreload", "preconnect", "dns-prefetch"])

const cspTag = () => `<meta http-equiv="Content-Security-Policy" content="${csp.replace(/"/g, "&quot;")}">`

const attr = (tag: string, key: string) => {
  const out = new RegExp(`${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag)
  return out?.[1] ?? out?.[2] ?? out?.[3]
}

const meta = (key: string) =>
  new RegExp(`<meta\\b(?=[^>]*http-equiv\\s*=\\s*(?:"${key}"|'${key}'|${key}))[^>]*>`, "gi")

const pair = (tag: string) => new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi")
const solo = (tag: string) => new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi")

function rewrite(input: string) {
  return input
    .replace(pair("script"), "")
    .replace(pair("noscript"), "")
    .replace(pair("iframe"), "")
    .replace(pair("object"), "")
    .replace(solo("embed"), "")
    .replace(solo("base"), "")
    .replace(meta("refresh"), "")
    .replace(meta("content-security-policy"), "")
    .replace(/<link\b[^>]*>/gi, (tag) => {
      const out = attr(tag, "rel")
      if (!out) return tag
      if (!out.toLowerCase().split(/\s+/).some((item) => rel.has(item))) return tag
      return ""
    })
    .replace(/\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:href|src|xlink:href|formaction)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi,
      "",
    )
}

function style(input: string) {
  const out: string[] = []
  const html = input.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs: string, css: string) => {
    out.push(`<style${attrs}>${css.replace(/@import[\s\S]*?;(?=\s|$)/gi, "")}</style>`)
    return ""
  })
  return { html, css: out.join("") }
}

function inject(input: string, css = "") {
  const out = input.trim()
  const head = `<meta charset="utf-8">${cspTag()}${css}`

  if (!out) return `<!doctype html><html><head>${head}</head><body></body></html>`
  if (/<head[\s>]/i.test(out)) {
    const next = out.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}${head}`)
    if (/^\s*<!doctype/i.test(next)) return next
    return `<!doctype html>${next}`
  }
  if (/<html[\s>]/i.test(out)) {
    const next = out.replace(/<html(\s[^>]*)?>/i, (tag) => `${tag}<head>${head}</head>`)
    if (/^\s*<!doctype/i.test(next)) return next
    return `<!doctype html>${next}`
  }
  return `<!doctype html><html><head>${head}</head><body>${out}</body></html>`
}

export function htmlPreviewDoc(input: string) {
  const out = style(rewrite(input))
  if (!DOMPurify.isSupported) return inject(out.html, out.css)
  return inject(DOMPurify.sanitize(out.html, cfg), out.css)
}

export function HtmlPreview(props: {
  html: string
  title?: string
  class?: ComponentProps<"div">["class"]
  classList?: ComponentProps<"div">["classList"]
  onLoad?: VoidFunction
}) {
  const i18n = useI18n()
  let frame: HTMLIFrameElement | undefined
  let stop: VoidFunction | undefined
  const [h, setH] = createSignal(480)
  const [lost, setLost] = createSignal(false)
  const doc = createMemo(() => htmlPreviewDoc(props.html))

  const read = <T,>(fn: () => T) => {
    try {
      return fn()
    } catch {
      return undefined
    }
  }

  const root = () => read(() => frame?.contentDocument?.documentElement)
  const body = () => read(() => frame?.contentDocument?.body)
  const url = () => read(() => frame?.contentWindow?.location.href)

  const sync = () => {
    const next = Math.max(
      root()?.scrollHeight ?? 0,
      body()?.scrollHeight ?? 0,
      root()?.offsetHeight ?? 0,
      body()?.offsetHeight ?? 0,
      480,
    )
    setH(next)
  }

  const bind = () => {
    stop?.()
    stop = undefined
    setLost(!url()?.startsWith("about:srcdoc"))
    sync()
    props.onLoad?.()

    const html = root()
    if (!html || typeof ResizeObserver !== "function") return

    const page = body()
    const obs = new ResizeObserver(() => sync())
    obs.observe(html)
    if (page) obs.observe(page)
    stop = () => obs.disconnect()
  }

  const reset = () => {
    if (!frame) return
    stop?.()
    stop = undefined
    setLost(false)
    setH(480)
    frame.srcdoc = doc()
  }

  createEffect(() => {
    doc()
    setLost(false)
    requestAnimationFrame(() => {
      if (!url()) return
      bind()
    })
  })

  onCleanup(() => stop?.())

  return (
    <div data-component="html-preview" class={props.class} classList={props.classList}>
      {lost() && (
        <div class="mb-2 flex justify-end pr-3">
          <Button size="small" variant="secondary" onClick={reset}>
            {i18n.t("ui.htmlPreview.restore")}
          </Button>
        </div>
      )}
      <iframe
        ref={frame}
        title={props.title ?? "HTML preview"}
        srcdoc={doc()}
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        class="block w-full rounded-lg border border-border-weak-base bg-white"
        style={{ height: `${h()}px` }}
        onLoad={bind}
      />
    </div>
  )
}
