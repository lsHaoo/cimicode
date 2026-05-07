import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __OPENCODE__?: {
      deepLinks?: string[]
    }
  }

  interface ImportMetaEnv {
    readonly VITE_SSO_ENABLED?: string
    readonly VITE_SSO_URL?: string
    readonly VITE_APP_ID?: string
    readonly VITE_APP_SECRET?: string
    readonly VITE_SSO_REDIRECT_URI?: string
  }
}
