export type PreviewKind = "html" | "markdown"
export type PreviewMode = "source" | "preview"

export function previewKind(path?: string): PreviewKind | null {
  if (!path) return null
  if (/\.(?:html?|xhtml)$/i.test(path)) return "html"
  if (/\.(?:md|markdown)$/i.test(path)) return "markdown"
  return null
}

export function previewScrollTab(tab: string, kind: PreviewKind | null, mode: PreviewMode) {
  if (!kind) return tab
  return `${tab}#${mode}`
}
