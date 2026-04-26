let ssoLogEnabled = true

export function isSSOLogEnabled(): boolean {
  return ssoLogEnabled
}

export function setSSOLogEnabled(enabled: boolean): void {
  ssoLogEnabled = enabled
}

function ssoLog(level: "info" | "warn" | "error" | "debug", message: string, data?: any): void {
  if (!ssoLogEnabled) return

  const timestamp = new Date().toISOString()
  const logMessage = `[SSO ${level.toUpperCase()}] ${timestamp} - ${message}`

  switch (level) {
    case "info":
      console.log(logMessage, data || "")
      break
    case "warn":
      console.warn(logMessage, data || "")
      break
    case "error":
      console.error(logMessage, data || "")
      break
    case "debug":
      console.debug(logMessage, data || "")
      break
  }
}

export const ssoInfo = (message: string, data?: any) => ssoLog("info", message, data)
export const ssoWarn = (message: string, data?: any) => ssoLog("warn", message, data)
export const ssoError = (message: string, data?: any) => ssoLog("error", message, data)
export const ssoDebug = (message: string, data?: any) => ssoLog("debug", message, data)
