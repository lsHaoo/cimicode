import type { Config, Provider } from "@opencode-ai/sdk/v2"
import { CXMT_CIMI_PROVIDER_ID, CXMT_CIMI_PROVIDER_NAME } from "./provider-preset"

const OPENAI_COMPATIBLE_PROVIDER = "@ai-sdk/openai-compatible"

export function isCxmtCimiProvider(provider: { id: string; name?: string }) {
  return provider.id === CXMT_CIMI_PROVIDER_ID || provider.name === CXMT_CIMI_PROVIDER_NAME
}

export function isCustomProvider(providerID: string, config: Config) {
  const provider = config.provider?.[providerID]
  if (!provider) return false
  if (providerID === CXMT_CIMI_PROVIDER_ID || provider.name === CXMT_CIMI_PROVIDER_NAME) return false
  if (provider.npm !== OPENAI_COMPATIBLE_PROVIDER) return false
  return !!provider.models && Object.keys(provider.models).length > 0
}

export function isAllowedVisibleProvider(provider: Provider, config: Config) {
  if (isCxmtCimiProvider(provider)) return true
  return isCustomProvider(provider.id, config)
}
