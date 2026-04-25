import { createResource, createSignal } from "solid-js"

export interface PresetModel {
  provider: string
  name: string
  url: string
  limit: {
    context: number
    output: number
  }
}

export type PresetModels = PresetModel[]

// 预设模型数据 - 可以定期从服务器更新
const FALLBACK_DATA: PresetModels = [
  {
    "provider": "CXMT Cimi",
    "name": "GLM-4.7-fp8",
    "url": "http://agi-gateway.cxmt.com/v1",
    "limit": { "context": 200000, "output": 8192 }
  },
  {
    "provider": "CXMT Cimi",
    "name": "GLM-4.7-flash",
    "url": "http://agi-gateway.cxmt.com/v1",
    "limit": { "context": 200000, "output": 8192 }
  }
]

export function usePresetModels() {
  const [retry, setRetry] = createSignal(0)
  const [useFallback, setUseFallback] = createSignal(false)

  const [resource] = createResource(
    retry,
    async (): Promise<PresetModels | null> => {
      try {
        // 尝试从服务器获取最新数据
        const timestamp = Date.now()
        const url = `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-models.json?t=${timestamp}`

        console.log(`🔄 Fetching latest data from: ${url}`)

        const response = await fetch(url, {
          mode: 'cors', // 明确启用CORS
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`✅ Successfully loaded ${data.length} models from server`)
        setUseFallback(false)
        return data as PresetModels
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ Server fetch failed: ${message}`)
        console.log(`📦 Using fallback data (${FALLBACK_DATA.length} models)`)
        setUseFallback(true)
        return FALLBACK_DATA
      }
    }
  )

  const retryLoad = () => {
    console.log(`🔄 Manually refreshing data...`)
    setRetry((prev) => prev + 1)
  }

  // 自动刷新：每5分钟尝试一次获取最新数据
  setInterval(() => {
    if (!resource.loading && !useFallback()) {
      console.log(`⏰ Auto-refreshing data...`)
      retryLoad()
    }
  }, 5 * 60 * 1000)

  const models = () => resource() ?? []
  const loading = () => resource.loading
  const error = () => resource.error

  return {
    models,
    loading,
    error,
    retryLoad,
    useFallback,
  }
}
