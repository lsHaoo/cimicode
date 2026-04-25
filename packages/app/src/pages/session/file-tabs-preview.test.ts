import { describe, expect, test } from "bun:test"
import { previewKind, previewScrollTab } from "./file-tabs-preview"

describe("previewKind", () => {
  test("detects html previews", () => {
    expect(previewKind("index.html")).toBe("html")
    expect(previewKind("index.htm")).toBe("html")
    expect(previewKind("index.xhtml")).toBe("html")
  })

  test("detects markdown previews", () => {
    expect(previewKind("README.md")).toBe("markdown")
    expect(previewKind("README.markdown")).toBe("markdown")
  })

  test("ignores unsupported files", () => {
    expect(previewKind("notes.mdx")).toBeNull()
    expect(previewKind("notes.txt")).toBeNull()
    expect(previewKind()).toBeNull()
  })
})

describe("previewScrollTab", () => {
  test("adds preview mode to html tabs", () => {
    expect(previewScrollTab("file://index.html", "html", "source")).toBe("file://index.html#source")
    expect(previewScrollTab("file://index.html", "html", "preview")).toBe("file://index.html#preview")
  })

  test("adds preview mode to markdown tabs", () => {
    expect(previewScrollTab("file://README.md", "markdown", "source")).toBe("file://README.md#source")
    expect(previewScrollTab("file://README.md", "markdown", "preview")).toBe("file://README.md#preview")
  })

  test("keeps other tabs stable", () => {
    expect(previewScrollTab("file://notes.txt", null, "preview")).toBe("file://notes.txt")
  })
})
