import { ssoInfo, ssoError, ssoWarn, ssoDebug } from "./logger"

const SSO_ENABLED = import.meta.env.VITE_SSO_ENABLED === "true"
const SSO_URL = import.meta.env.VITE_SSO_URL as string | undefined
const APP_ID = import.meta.env.VITE_APP_ID as string | undefined
const APP_SECRET = import.meta.env.VITE_APP_SECRET as string | undefined
const REDIRECT_URI = import.meta.env.VITE_SSO_REDIRECT_URI as string | undefined

const TOKEN_KEY = "sso_token"
const STATE_KEY = "sso_state"

export function isSSOEnabled(): boolean {
  return SSO_ENABLED && !!(SSO_URL && APP_ID && APP_SECRET)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  return token
}

function getRedirectUri(): string {
  if (REDIRECT_URI) return REDIRECT_URI

  const origin = window.location.origin
  const fallback = new URL("/sso-callback.html", origin).toString()

  ssoInfo("Using fallback redirect URI", { origin, fallback })
  return fallback
}

function parse(input: string): URL | undefined {
  try {
    return new URL(input)
  } catch {
    return
  }
}

function path(url: URL) {
  return url.pathname === "/" ? "" : url.pathname
}

function match(input: string) {
  const url = parse(input)
  const back = parse(getRedirectUri())
  if (!url || !back) return false
  if (!url.searchParams.has("code") && !url.searchParams.has("error")) return false
  return (
    url.protocol === back.protocol &&
    url.hostname === back.hostname &&
    url.port === back.port &&
    path(url) === path(back)
  )
}

function getState(input = window.location.href): string | null {
  return parse(input)?.searchParams.get("state") ?? null
}

export function getError(input = window.location.href): string | null {
  const url = parse(input)
  if (!url) return null
  const err = url.searchParams.get("error")
  if (!err) return null
  const desc = url.searchParams.get("error_description")
  if (!desc) return err
  return `${err}: ${desc}`
}

function setState(state: string): void {
  localStorage.setItem(STATE_KEY, state)
}

function clearState(): void {
  localStorage.removeItem(STATE_KEY)
}

export function getSSOUrl(): string | null {
  if (!isSSOEnabled()) return null

  const redirectUri = getRedirectUri()
  const state = crypto.randomUUID()
  setState(state)

  const params = new URLSearchParams({
    client_id: APP_ID!,
    scope: "openid profile email phone address username external_id extended_fields",
    state,
    response_type: "code",
    redirect_uri: redirectUri,
  })

  const loginUrl = `${SSO_URL}/oidc/auth?${params.toString()}`

  ssoInfo("Login URL generated", { loginUrl, redirectUri, state })

  return loginUrl
}

export function getCodeFromUrl(input = window.location.href): string | null {
  return parse(input)?.searchParams.get("code") ?? null
}

export function isCallback(input = window.location.href): boolean {
  return match(input)
}

async function exchangeCodeForToken(code: string): Promise<string> {
  ssoInfo("Starting token exchange", { codeLength: code.length })

  const redirectUri = getRedirectUri()
  const tokenEndpoint = `${SSO_URL}/oidc/token`

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: APP_ID!,
      client_secret: APP_SECRET!,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    ssoError("Token exchange failed", { status: response.status, body: errorText })
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  ssoInfo("Token exchange successful", { hasAccessToken: !!data.access_token })

  return data.access_token
}

export async function handleSSOCallback(input = window.location.href): Promise<string | null> {
  ssoInfo("Handling SSO callback", { url: input })

  const err = getError(input)
  if (err) {
    ssoError("Callback error from SSO server", { error: err })
    clearState()
    return null
  }

  const state = localStorage.getItem(STATE_KEY)
  const currentState = getState(input)

  if (state && state !== currentState) {
    ssoError("State mismatch - possible CSRF attack", { expected: state, received: currentState })
    clearState()
    return null
  }

  const code = getCodeFromUrl(input)
  if (!code) {
    ssoError("No authorization code in callback URL")
    return null
  }

  return exchangeCodeForToken(code)
    .then((token) => {
      setToken(token)
      clearState()
      ssoInfo("Authentication completed successfully")
      return token
    })
    .catch((err) => {
      ssoError("Token exchange failed", { error: (err as Error).message })
      clearState()
      return null
    })
}
