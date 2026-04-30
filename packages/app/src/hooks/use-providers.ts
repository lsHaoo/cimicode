import { useGlobalSync } from "@/context/global-sync"
import { decode64 } from "@/utils/base64"
import { isAllowedVisibleProvider } from "@/utils/provider-filter"
import { useParams } from "@solidjs/router"
import { createMemo } from "solid-js"

export const popularProviders: string[] = []

export function useProviders() {
  const globalSync = useGlobalSync()
  const params = useParams()
  const dir = createMemo(() => decode64(params.dir) ?? "")
  const state = () => {
    if (dir()) {
      const [projectStore] = globalSync.child(dir())
      if (projectStore.provider_ready) return { provider: projectStore.provider, config: projectStore.config }
    }
    return { provider: globalSync.data.provider, config: globalSync.data.config }
  }
  const providers = () => state().provider
  const configProvider = (providerID: string) => state().config.provider?.[providerID]
  const allowed = (provider: ReturnType<typeof providers>["all"][number]) =>
    isAllowedVisibleProvider(provider, configProvider(provider.id))

  return {
    all: () => providers().all,
    default: () => providers().default,
    popular: () => [],
    connected: () => {
      const connected = new Set(providers().connected)
      return providers().all.filter((p) => connected.has(p.id) && allowed(p))
    },
    paid: () => {
      const connected = new Set(providers().connected)
      return providers().all.filter(
        (p) =>
          connected.has(p.id) &&
          allowed(p) &&
          (p.id !== "opencode" || Object.values(p.models).some((m) => m.cost?.input)),
      )
    },
  }
}
