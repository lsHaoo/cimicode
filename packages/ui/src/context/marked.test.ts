import { describe, expect, test } from "bun:test"
import { createMarkdownParser } from "./marked"

describe("createMarkdownParser", () => {
  test("renders mermaid and math in the js parser", async () => {
    const parser = createMarkdownParser()
    const out = await parser.parse(["```mermaid", "graph TD", "A-->B", "```", "", "$$x^2$$"].join("\n"))

    expect(out).toContain('<pre class="mermaid">')
    expect(out).toContain("graph TD")
    expect(out).toContain("A--&gt;B")
    expect(out).toContain("katex")
  })

  test("post-processes native parser output for mermaid, code, and math", async () => {
    const parser = createMarkdownParser({
      nativeParser: async () =>
        [
          '<pre><code class="language-mermaid">graph TD\nA--&gt;B\n</code></pre>',
          '<pre><code class="language-ts">const a = 1</code></pre>',
          "<p>$1+1$</p>",
        ].join(""),
    })

    const out = await parser.parse("")

    expect(out).toContain('<pre class="mermaid">')
    expect(out).toContain("graph TD")
    expect(out).toContain("A--&gt;B")
    expect(out).toContain('class="shiki')
    expect(out).toContain("syntax-keyword")
    expect(out).toContain("katex")
  })
})
