import type { Config } from "@opencode-ai/sdk/v2"

export type PresetModel = {
  provider: string
  name: string
  url: string
  limit: {
    context: number
    output: number
  }
}

export const CXMT_CIMI_PROVIDER_ID = "cxmt-cimi"
export const CXMT_CIMI_PROVIDER_NAME = "CXMT Cimi"
export const CXMT_CIMI_MODELS_URL = "https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-models.json"

export const CXMT_CIMI_FALLBACK_MODELS: PresetModel[] = [
  {
    provider: CXMT_CIMI_PROVIDER_NAME,
    name: "GLM-4.7-fp8",
    url: "http://agi-gateway.cxmt.com/v1",
    limit: { context: 200000, output: 8192 },
  },
  {
    provider: CXMT_CIMI_PROVIDER_NAME,
    name: "qwen3.6-35b-a3b",
    url: "http://agi-gateway.cxmt.com/v1",
    limit: { context: 200000, output: 8192 },
  },
]

function isPresetModel(value: unknown): value is PresetModel {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<PresetModel>
  if (typeof item.provider !== "string") return false
  if (typeof item.name !== "string") return false
  if (typeof item.url !== "string") return false
  if (!item.limit || typeof item.limit !== "object") return false
  return typeof item.limit.context === "number" && typeof item.limit.output === "number"
}

export function presetProviderID(model: Pick<PresetModel, "provider">) {
  return (model.provider || "cimimi")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function presetConfigPatch(model: PresetModel, disabledProviders: string[] = []): Config {
  const providerID = presetProviderID(model)
  return {
    provider: {
      [providerID]: {
        npm: "@ai-sdk/openai-compatible",
        name: model.provider || model.name,
        options: {
          baseURL: model.url,
        },
        models: {
          [model.name]: {
            name: model.name,
            limit: model.limit,
          },
        },
      },
    },
    disabled_providers: disabledProviders.filter((id) => id !== providerID),
  }
}

export async function loadPresetModels(fetcher: typeof fetch = fetch): Promise<PresetModel[]> {
  try {
    const response = await fetcher(`${CXMT_CIMI_MODELS_URL}?t=${Date.now()}`, {
      headers: { Accept: "application/json" },
    })
    if (!response.ok) return CXMT_CIMI_FALLBACK_MODELS
    const data = await response.json()
    if (!Array.isArray(data)) return CXMT_CIMI_FALLBACK_MODELS
    const models = data.filter(isPresetModel)
    if (models.length === 0) return CXMT_CIMI_FALLBACK_MODELS
    return models
  } catch {
    return CXMT_CIMI_FALLBACK_MODELS
  }
}
