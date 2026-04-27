import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { AfterPackContext, Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

// signAndEditExecutable is false, so electron-builder won't use rcedit (which corrupts the exe).
// This hook injects the icon AFTER the exe is fully written, before NSIS packages it.
async function afterPack(context: AfterPackContext) {
  if (context.electronPlatformName !== "win32") return

  const rcedit = path.join(
    process.env.LOCALAPPDATA || "",
    "electron-builder/Cache/winCodeSign/winCodeSign-2.6.0/rcedit-x64.exe",
  )
  const productFilename = context.appInfo?.productFilename ?? context.packager?.appInfo?.productFilename
  if (!productFilename) return
  const exeName = `${productFilename}.exe`
  const exePath = path.join(context.appOutDir, exeName)
  const iconPath = path.join(projectDir, "resources/icons/icon.ico")

  for (let attempt = 1; attempt <= 5; attempt++) {
    await new Promise((r) => setTimeout(r, 1000 * attempt))
    try {
      await execFileAsync(rcedit, [exePath, "--set-icon", iconPath])
      console.log(`  • icon applied via afterPack (attempt ${attempt}) → ${exeName}`)
      return
    } catch (e: any) {
      console.warn(`  • afterPack icon attempt ${attempt} failed: ${e.message}`)
    }
  }
  console.warn(`  • afterPack: all icon attempts failed for ${exeName}`)
}

const channel = (() => {
  const raw = process.env.CIMICODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const getBase = (): Configuration => ({
  artifactName: "Cimi_${version}-beta.${ext}",
  afterPack,
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  extraResources: [
    ...(existsSync(path.join(projectDir, "native"))
      ? [
          {
            from: "native/",
            to: "native/",
            filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
          },
        ]
      : []),
    ...(existsSync(path.join(projectDir, "resources/opencode-cli.exe"))
      ? [{ from: "resources/opencode-cli.exe", to: "opencode-cli.exe" }]
      : existsSync(path.join(projectDir, "resources/opencode-cli"))
        ? [{ from: "resources/opencode-cli", to: "opencode-cli" }]
        : []),
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "Cimi",
    schemes: ["cimi"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signAndEditExecutable: false,
    signtoolOptions: {},
    target: ["nsis", "dir"],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
    include: "installer.nsh",
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "ai.cimicode.desktop.dev",
        productName: "Cimi Dev",
        rpm: { packageName: "cimicode-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "ai.cimicode.desktop.beta",
        productName: "Cimi Beta",
        protocols: { name: "Cimi Beta", schemes: ["cimi"] },
        publish: { provider: "github", owner: "anomalyco", repo: "cimicode-beta", channel: "latest" },
        rpm: { packageName: "cimicode-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "ai.cimicode.desktop",
        productName: "Cimi",
        protocols: { name: "Cimi", schemes: ["cimi"] },
        publish: { provider: "github", owner: "anomalyco", repo: "cimicode", channel: "latest" },
        rpm: { packageName: "cimicode" },
      }
    }
  }
}

export default getConfig()
