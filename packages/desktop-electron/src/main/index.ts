import { randomUUID } from "node:crypto"
import { EventEmitter } from "node:events"
import { existsSync } from "node:fs"
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http"
import { createServer } from "node:net"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import type { Event } from "electron"
import { app, BrowserWindow } from "electron"

import contextMenu from "electron-context-menu"
contextMenu({ showSaveImageAs: true, showLookUpSelection: false, showSearchWithGoogle: false })

// on macOS apps run in `/` which can cause issues with ripgrep
try {
  process.chdir(homedir())
} catch {}

process.env.OPENCODE_DISABLE_EMBEDDED_WEB_UI = "true"

const APP_NAMES: Record<string, string> = {
  dev: "Cimi Dev",
  beta: "Cimi Beta",
  prod: "Cimi",
}
const APP_IDS: Record<string, string> = {
  dev: "ai.cimicode.desktop.dev",
  beta: "ai.cimicode.desktop.beta",
  prod: "ai.cimicode.desktop",
}
const appId = app.isPackaged ? APP_IDS[CHANNEL] : "ai.cimicode.desktop.dev"
app.setName(app.isPackaged ? APP_NAMES[CHANNEL] : "Cimi Dev")
app.setAppUserModelId(appId)

const cimiConfigPath = join(homedir(), ".cimi", "cimicode")
const cimiDataPath = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share", "cimicode")
const cimiCachePath = process.env.XDG_CACHE_HOME || join(homedir(), ".cache", "cimicode")

app.setPath("userData", cimiConfigPath)
app.setPath("appData", cimiDataPath)
app.setPath("cache", cimiCachePath)
app.setPath("logs", join(cimiDataPath, "log"))
import type { InitStep, ServerReadyData, SqliteMigrationProgress, WslConfig } from "../preload/types"
import { checkAppExists, resolveAppPath, wslPath } from "./apps"
import { CHANNEL } from "./constants"
import { syncBuiltinSkills } from "./skills"
import { registerIpcHandlers, sendDeepLinks, sendMenuCommand, sendSqliteMigrationProgress } from "./ipc"
import { initLogging } from "./logging"
import { parseMarkdown } from "./markdown"
import { createMenu } from "./menu"
import { getDefaultServerUrl, getWslConfig, setDefaultServerUrl, setWslConfig, spawnLocalServer } from "./server"
import {
  createLoadingWindow,
  createMainWindow,
  registerRendererProtocol,
  setBackgroundColor,
  setDockIcon,
} from "./windows"
import { drizzle } from "drizzle-orm/node-sqlite/driver"
import type { Server } from "virtual:opencode-server"

const initEmitter = new EventEmitter()
let initStep: InitStep = { phase: "server_waiting" }

let mainWindow: BrowserWindow | null = null
let server: Server.Listener | null = null
const loadingComplete = defer<void>()

const pendingDeepLinks: string[] = []

const serverReady = defer<ServerReadyData>()
const logger = initLogging()

logger.log("app starting", {
  version: app.getVersion(),
  packaged: app.isPackaged,
})

setupApp()

function setupApp() {
  ensureLoopbackNoProxy()
  app.commandLine.appendSwitch("proxy-bypass-list", "<-loopback>")

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  app.on("second-instance", (_event: Event, argv: string[]) => {
    const urls = argv.filter((arg: string) => arg.startsWith("cimi://"))
    if (urls.length) {
      logger.log("deep link received via second-instance", { urls })
      emitDeepLinks(urls)
    }
    focusMainWindow()
  })

  app.on("open-url", (event: Event, url: string) => {
    event.preventDefault()
    logger.log("deep link received via open-url", { url })
    emitDeepLinks([url])
  })

  app.on("before-quit", () => {
    killSidecar()
  })

  app.on("will-quit", () => {
    killSidecar()
  })

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      killSidecar()
      app.exit(0)
    })
  }

  void app.whenReady().then(async () => {
    app.setAsDefaultProtocolClient("cimi")
    registerRendererProtocol()
    setDockIcon()
    syncBuiltinSkills()
    startSSOCallbackServer()
    await initialize()
  })
}

function emitDeepLinks(urls: string[]) {
  if (urls.length === 0) return
  pendingDeepLinks.push(...urls)
  if (mainWindow) sendDeepLinks(mainWindow, urls)
}

function focusMainWindow() {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

function setInitStep(step: InitStep) {
  initStep = step
  logger.log("init step", { step })
  initEmitter.emit("step", step)
}

async function initialize() {
  const { Database, JsonMigration } = await import("virtual:opencode-server")
  const needsMigration = sqliteNeedsMigration(Database.Path)
  const sqliteDone = needsMigration ? defer<void>() : undefined
  let overlay: BrowserWindow | null = null

  const port = await getSidecarPort()
  const hostname = "127.0.0.1"
  const url = `http://${hostname}:${port}`
  const password = randomUUID()

  const loadingTask = (async () => {
    logger.log("sidecar connection started", { url })

    initEmitter.on("sqlite", (progress: SqliteMigrationProgress) => {
      setInitStep({ phase: "sqlite_waiting" })
      if (overlay) sendSqliteMigrationProgress(overlay, progress)
      if (mainWindow) sendSqliteMigrationProgress(mainWindow, progress)
      if (progress.type === "Done") sqliteDone?.resolve()
    })

    if (needsMigration) {
      await JsonMigration.run(drizzle({ client: Database.Client().$client }), {
        progress: (event: { current: number; total: number }) => {
          const percent = Math.round((event.current / event.total) * 100)
          initEmitter.emit("sqlite", { type: "InProgress", value: percent })
        },
      })
      initEmitter.emit("sqlite", { type: "Done" })

      sqliteDone?.resolve()
    }

    if (needsMigration) {
      await sqliteDone?.promise
    }

    logger.log("spawning sidecar", { url })
    const { listener, health } = await spawnLocalServer(hostname, port, password)
    server = listener
    serverReady.resolve({
      url,
      username: "cimi",
      password,
    })

    await Promise.race([
      health.wait,
      delay(30_000).then(() => {
        throw new Error("Sidecar health check timed out")
      }),
    ]).catch((error) => {
      logger.error("sidecar health check failed", error)
    })

    logger.log("loading task finished")
  })()

  if (needsMigration) {
    const show = await Promise.race([loadingTask.then(() => false), delay(1_000).then(() => true)])
    if (show) {
      overlay = createLoadingWindow()
      await delay(1_000)
    }
  }

  await loadingTask
  setInitStep({ phase: "done" })

  if (overlay) {
    await loadingComplete.promise
  }

  mainWindow = createMainWindow()
  wireMenu()

  overlay?.close()
}

function wireMenu() {
  if (!mainWindow) return
  createMenu({
    trigger: (id) => mainWindow && sendMenuCommand(mainWindow, id),
    reload: () => mainWindow?.reload(),
    relaunch: () => {
      killSidecar()
      app.relaunch()
      app.exit(0)
    },
  })
}

registerIpcHandlers({
  killSidecar: () => killSidecar(),
  awaitInitialization: async (sendStep) => {
    sendStep(initStep)
    const listener = (step: InitStep) => sendStep(step)
    initEmitter.on("step", listener)
    try {
      logger.log("awaiting server ready")
      const res = await serverReady.promise
      logger.log("server ready", { url: res.url })
      return res
    } finally {
      initEmitter.off("step", listener)
    }
  },
  consumeInitialDeepLinks: () => pendingDeepLinks.splice(0),
  getDefaultServerUrl: () => getDefaultServerUrl(),
  setDefaultServerUrl: (url) => setDefaultServerUrl(url),
  getWslConfig: () => Promise.resolve(getWslConfig()),
  setWslConfig: (config: WslConfig) => setWslConfig(config),
  getDisplayBackend: async () => null,
  setDisplayBackend: async () => undefined,
  parseMarkdown: async (markdown) => parseMarkdown(markdown),
  checkAppExists: async (appName) => checkAppExists(appName),
  wslPath: async (path, mode) => wslPath(path, mode),
  resolveAppPath: async (appName) => resolveAppPath(appName),
  loadingWindowComplete: () => loadingComplete.resolve(),
  setBackgroundColor: (color) => setBackgroundColor(color),
})

function killSidecar() {
  if (!server) return
  server.stop()
  server = null
  ssoCallbackServer?.close()
  ssoCallbackServer = null
}

function ensureLoopbackNoProxy() {
  const loopback = ["127.0.0.1", "localhost", "::1"]
  const upsert = (key: string) => {
    const items = (process.env[key] ?? "")
      .split(",")
      .map((value: string) => value.trim())
      .filter((value: string) => Boolean(value))

    for (const host of loopback) {
      if (items.some((value: string) => value.toLowerCase() === host)) continue
      items.push(host)
    }

    process.env[key] = items.join(",")
  }

  upsert("NO_PROXY")
  upsert("no_proxy")
}

async function getSidecarPort() {
  const fromEnv = process.env.OPENCODE_PORT
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return await new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (typeof address !== "object" || !address) {
        server.close()
        reject(new Error("Failed to get port"))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

function sqliteNeedsMigration(databasePath: string) {
  return !existsSync(databasePath) && existsSync(join(dirname(databasePath), "storage"))
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function defer<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let ssoCallbackServer: ReturnType<typeof createHttpServer> | null = null

const SSO_CALLBACK_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSO回调处理</title>
  <style>
    body { margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:system-ui,-apple-system,sans-serif; background:#f8f7f7; }
    .message { text-align:center; color:#666; }
    .success { color:#52c41a; font-size:18px; font-weight:500; }
    .error { color:#e74c3c; font-size:18px; font-weight:500; }
    .warning { color:#faad14; font-size:16px; margin-top:10px; }
  </style>
</head>
<body>
  <div class="message">
    <div id="content">处理登录中...</div>
    <div id="error-detail" class="warning" style="display:none;margin-top:10px;"></div>
  </div>
  <script>
  (function(){
    var params=new URLSearchParams(window.location.search);
    var el=document.getElementById('content');
    var errEl=document.getElementById('error-detail');
    if(params.has('error')){
      var e=params.get('error'),d=params.get('error_description')||e;
      el.className='error';el.textContent='登录失败';errEl.style.display='block';errEl.textContent='错误: '+d;
      if(window.parent!==window)window.parent.postMessage({type:'sso-callback',url:window.location.href,error:true,errorMessage:d},'*');
      return;
    }
    if(params.has('code')){
      el.textContent='登录成功，正在进入应用...';el.className='success';
      if(window.parent!==window){window.parent.postMessage({type:'sso-callback',url:window.location.href,success:true},'*');
        setTimeout(function(){errEl.style.display='block';errEl.textContent='如果页面没有自动关闭，请手动关闭此窗口';},2000);
      }
    }else{el.textContent='SSO回调页面';errEl.style.display='block';errEl.textContent='请通过SSO登录流程访问此页面';}
  })();
  </script>
</body>
</html>`

function startSSOCallbackServer() {
  const port = 3000

  ssoCallbackServer = createHttpServer((_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(SSO_CALLBACK_HTML)
  })

  ssoCallbackServer.listen(port, "127.0.0.1", () => {
    logger.log("SSO callback server started", { port })
  })

  ssoCallbackServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.log("SSO callback server port 3000 in use, skipping")
      return
    }
    logger.error("SSO callback server error", err)
  })
}
