import { createSignal, onCleanup, onMount, Show, type JSX } from "solid-js"
import { ssoInfo, ssoError, ssoWarn, ssoDebug } from "./logger"
import { getToken, handleSSOCallback, isSSOEnabled, getSSOUrl, removeToken, setToken } from "./index"

const LOGO_URL = "https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.webp"

function Splash(props: { text: string; note?: string }) {
  return (
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background-base z-10">
      <img src={LOGO_URL} alt="Cimi" class="w-14 h-14 opacity-40 animate-pulse" />
      <div class="text-14-regular text-text-weak">{props.text}</div>
      {props.note && <div class="text-12-regular text-text-weaker max-w-80 text-center">{props.note}</div>}
    </div>
  )
}

export function SSOGate(props: { children: JSX.Element; ready?: boolean; splash?: JSX.Element }) {
  const enabled = isSSOEnabled()
  const [authenticated, setAuthenticated] = createSignal(!enabled || !!getToken())
  const [error, setError] = createSignal<string | null>(null)
  const [frame, setFrame] = createSignal(false)
  const [ssoUrl, setSsoUrl] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(true)

  onMount(() => {
    if (!enabled || authenticated()) return

    const url = getSSOUrl()
    if (!url) {
      ssoError("SSO not properly configured")
      setError("SSO not properly configured")
      setLoading(false)
      return
    }

    ssoInfo("SSO Login Flow Started", { ssoUrl: url })
    setLoading(false)
    setSsoUrl(url)

    const handleMessage = (event: MessageEvent) => {
      ssoDebug("postMessage received", {
        origin: event.origin,
        type: event.data?.type,
        hasUrl: !!event.data?.url,
      })

      if (event.data?.type === "sso-callback" && event.data.url) {
        ssoInfo("Valid SSO callback detected", { callbackUrl: event.data.url })

        if (event.data.error) {
          ssoError("SSO server returned error", { errorMessage: event.data.errorMessage })
          setError("登录失败: " + (event.data.errorMessage || "未知错误"))
          setLoading(false)
          return
        }

        setLoading(true)
        handleSSOCallback(event.data.url)
          .then((token) => {
            if (token) {
              ssoInfo("Login SUCCESS", { tokenLength: token.length })
              setAuthenticated(true)
            } else {
              ssoError("Login FAILED - no token returned")
              setError("登录失败，请重试")
              setLoading(false)
            }
          })
          .catch((err) => {
            ssoError("Login ERROR", { error: err.message })
            setError("登录失败: " + err.message)
            setLoading(false)
          })
      } else if (event.data?.type === "login_success") {
        ssoInfo("SSO login_success message detected")
        const mockToken = `sso_token_${Date.now()}`
        setToken(mockToken)
        setTimeout(() => setAuthenticated(true), 500)
      }
    }

    window.addEventListener("message", handleMessage)
    onCleanup(() => {
      window.removeEventListener("message", handleMessage)
    })
  })

  return (
    <Show
      when={props.ready !== false}
      fallback={props.splash ?? <Splash text="正在初始化桌面环境..." note="正在连接本地能力并准备登录界面。" />}
    >
      <Show
        when={authenticated()}
        fallback={
          <div class="h-dvh w-screen flex flex-col bg-background-base">
            <div class="flex items-center justify-between px-3 py-2 bg-surface-base border-b border-surface-border select-none">
              <div class="flex items-center gap-2">
                <img src={LOGO_URL} alt="Cimi" class="h-6 w-auto object-contain" />
              </div>
            </div>

            <div class="flex-1 relative">
              <Show when={import.meta.env.DEV}>
                <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div class="rounded-lg bg-surface-raised border border-surface-border p-3 shadow-lg">
                    <div class="text-xs font-semibold text-text-weak mb-2">开发工具</div>
                    <button
                      class="w-full rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
                      onClick={() => {
                        ssoInfo("Dev: Simulating SSO login success")
                        setLoading(true)
                        setTimeout(() => {
                          const mockToken = `mock_dev_token_${Date.now()}`
                          setToken(mockToken)
                          setAuthenticated(true)
                        }, 500)
                      }}
                    >
                      模拟登录成功
                    </button>
                    <button
                      class="w-full rounded-md bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600 mt-1"
                      onClick={() => {
                        ssoInfo("Dev: Simulating SSO login failure")
                        setError("模拟SSO登录失败")
                      }}
                    >
                      模拟登录失败
                    </button>
                    <button
                      class="w-full rounded-md bg-gray-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-600 mt-1"
                      onClick={() => {
                        ssoInfo("Dev: Clearing SSO token")
                        removeToken()
                        setError(null)
                        setFrame(false)
                        setLoading(false)
                        setAuthenticated(false)
                        setSsoUrl(getSSOUrl())
                      }}
                    >
                      清除Token重置
                    </button>
                  </div>
                </div>
              </Show>

              <Show when={!error() && (loading() || !frame())}>
                <Splash
                  text={loading() ? "正在登录..." : "正在准备登录界面..."}
                  note={loading() ? "正在验证身份并建立登录会话，请稍候。" : "桌面环境已经就绪，正在加载统一登录页面。"}
                />
              </Show>

              <Show when={error()}>
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-background-base">
                  <div class="text-text-critical-base">{error()}</div>
                  <button
                    class="rounded-md bg-surface-raised px-4 py-2 text-text-base transition-colors hover:bg-surface-raised-hover"
                    onClick={() => {
                      setError(null)
                      setFrame(false)
                      setLoading(false)
                      const url = getSSOUrl()
                      if (url) setSsoUrl(url)
                    }}
                  >
                    重试
                  </button>
                </div>
              </Show>

              <Show when={ssoUrl() && !error()}>
                <iframe
                  ref={(el) => {
                    if (el) {
                      el.onload = () => {
                        setFrame(true)
                        ssoInfo("iframe loaded successfully")
                      }
                      el.onerror = () => {
                        ssoInfo("iframe error (expected SSO redirect)")
                        setTimeout(() => {
                          try {
                            if (el.src && el.src.includes("sso-callback.html")) {
                              ssoInfo("Callback redirect detected!", { callbackUrl: el.src })
                              setLoading(true)
                              handleSSOCallback(el.src)
                                .then((token) => {
                                  if (token) {
                                    ssoInfo("Login successful!")
                                    setAuthenticated(true)
                                  } else {
                                    setLoading(false)
                                    setError("登录失败，请重试")
                                  }
                                })
                                .catch((err) => {
                                  setLoading(false)
                                  setError("登录失败: " + err.message)
                                })
                            }
                          } catch (error) {
                            ssoError("Error processing callback", { error: (error as Error).message })
                          }
                        }, 100)
                      }
                    }
                  }}
                  src={ssoUrl()!}
                  class="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-presentation"
                  allow="same-origin"
                  referrerpolicy="no-referrer"
                  title="SSO Login"
                />
              </Show>
            </div>
          </div>
        }
      >
        {props.children}
      </Show>
    </Show>
  )
}
