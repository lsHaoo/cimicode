export const CXMT_CIMI_PROVIDER_ID = "cxmt-cimi"
export const CXMT_CIMI_PROVIDER_NAME = "CXMT Cimi"
export const OPENAI_COMPATIBLE_PROVIDER = "@ai-sdk/openai-compatible"

type Provider = {
  id: string
  name?: string
}

type ConfigProvider = {
  name?: string
  npm?: string
  models?: Record<string, unknown>
}

export function isCxmtCimiProvider(provider: Provider) {
  return provider.id === CXMT_CIMI_PROVIDER_ID || provider.name === CXMT_CIMI_PROVIDER_NAME
}

export function isConfigCustomProvider(providerID: string, provider: ConfigProvider | undefined) {
  if (!provider) return false
  if (providerID === CXMT_CIMI_PROVIDER_ID || provider.name === CXMT_CIMI_PROVIDER_NAME) return false
  if (provider.npm !== OPENAI_COMPATIBLE_PROVIDER) return false
  return !!provider.models && Object.keys(provider.models).length > 0
}

export function isAllowedVisibleProvider(provider: Provider, configProvider: ConfigProvider | undefined) {
  if (isCxmtCimiProvider(provider)) return true
  return isConfigCustomProvider(provider.id, configProvider)
}
