import { expect, test } from "bun:test"
import pkg from "../../../package.json" with { type: "json" }

const { TuiVersion } = await import("../../../src/cli/cmd/tui/util/version")
const {
  CXMT_CIMI_FALLBACK_MODELS,
  CXMT_CIMI_MODELS_URL,
  loadPresetModels,
  presetConfigPatch,
  presetProviderID,
} = await import("../../../src/cli/cmd/tui/component/provider-preset")

test("CXMT Cimi preset builds config patch", () => {
  const model = CXMT_CIMI_FALLBACK_MODELS[0]
  const patch = presetConfigPatch(model, ["cxmt-cimi", "anthropic"])

  expect(presetProviderID(model)).toBe("cxmt-cimi")
  expect(patch.disabled_providers).toEqual(["anthropic"])
  expect(patch.provider?.["cxmt-cimi"]).toEqual({
    npm: "@ai-sdk/openai-compatible",
    name: "CXMT Cimi",
    options: {
      baseURL: "http://agi-gateway.cxmt.com/v1",
    },
    models: {
      [model.name]: {
        name: model.name,
        limit: model.limit,
      },
    },
  })
})

test("CXMT Cimi preset model loader falls back on fetch failure", async () => {
  const failingFetch = (async (url: Parameters<typeof fetch>[0]) => {
    expect(String(url)).toStartWith(CXMT_CIMI_MODELS_URL)
    throw new Error("network")
  }) as unknown as typeof fetch
  const models = await loadPresetModels(failingFetch)

  expect(models).toEqual(CXMT_CIMI_FALLBACK_MODELS)
})

test("TUI version falls back to package version", () => {
  expect(TuiVersion).toBe(pkg.version)
})
