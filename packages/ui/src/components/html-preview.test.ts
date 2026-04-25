import { describe, expect, test } from "bun:test"
import { htmlPreviewDoc } from "./html-preview"

describe("htmlPreviewDoc", () => {
  test("removes scripts and noscript content", () => {
    expect(
      htmlPreviewDoc(`<!doctype html><html><body><noscript>Enable JavaScript</noscript><script>alert(1)</script><main>Hello</main></body></html>`),
    ).not.toContain("Enable JavaScript")
    expect(
      htmlPreviewDoc(`<!doctype html><html><body><noscript>Enable JavaScript</noscript><script>alert(1)</script><main>Hello</main></body></html>`),
    ).not.toContain("alert(1)")
  })

  test("injects preview csp and preserves inline styles", () => {
    const out = htmlPreviewDoc(`<html><head><style>body { color: red }</style></head><body><h1>Hello</h1></body></html>`)
    expect(out).toContain("Content-Security-Policy")
    expect(out).toContain("body { color: red }")
  })
})
