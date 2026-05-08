/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { onMount } from "solid-js"
import { Global } from "@opencode-ai/core/global"
import { KVProvider } from "../../../src/cli/cmd/tui/context/kv"
import { KeybindProvider } from "../../../src/cli/cmd/tui/context/keybind"
import { ThemeProvider } from "../../../src/cli/cmd/tui/context/theme"
import { TuiConfigProvider } from "../../../src/cli/cmd/tui/context/tui-config"
import { DialogProvider } from "../../../src/cli/cmd/tui/ui/dialog"
import { DialogSelect } from "../../../src/cli/cmd/tui/ui/dialog-select"
import { ToastProvider } from "../../../src/cli/cmd/tui/ui/toast"
import { tmpdir } from "../../fixture/fixture"

test("DialogSelect renders JSX footers without nesting them in text nodes", async () => {
  const previous = Global.Path.state
  await using tmp = await tmpdir()
  Global.Path.state = tmp.path
  await Bun.write(`${tmp.path}/kv.json`, "{}")

  let rendered = false
  let mounted!: () => void
  const ready = new Promise<void>((resolve) => {
    mounted = () => {
      rendered = true
      resolve()
    }
  })

  const app = await testRender(() => (
    <KVProvider>
      <ToastProvider>
        <TuiConfigProvider config={{}}>
          <ThemeProvider mode="dark">
            <KeybindProvider>
              <DialogProvider>
                <Probe onMounted={mounted} />
              </DialogProvider>
            </KeybindProvider>
          </ThemeProvider>
        </TuiConfigProvider>
      </ToastProvider>
    </KVProvider>
  ))

  try {
    await ready
    expect(rendered).toBe(true)
  } finally {
    app.renderer.destroy()
    Global.Path.state = previous
  }
})

function Probe(props: { onMounted: () => void }) {
  onMount(props.onMounted)

  return (
    <DialogSelect
      title="Select CXMT Cimi model"
      options={[
        {
          title: "GLM-4.7-fp8",
          value: "glm-4.7-fp8",
          description: "CXMT Cimi - 200K context",
          footer: <text>http://agi-gateway.cxmt.com/v1</text>,
        },
      ]}
    />
  )
}
