import { existsSync } from "node:fs"
import { join } from "node:path"
import { $ } from "bun"

export type Channel = "dev" | "beta" | "prod"

export function resolveChannel(): Channel {
  const raw = Bun.env.OPENCODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
}

export const SIDECAR_BINARIES: Array<{ rustTarget: string; ocBinary: string; assetExt: string }> = [
  {
    rustTarget: "aarch64-apple-darwin",
    ocBinary: "opencode-darwin-arm64",
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-apple-darwin",
    ocBinary: "opencode-darwin-x64-baseline",
    assetExt: "zip",
  },
  {
    rustTarget: "aarch64-pc-windows-msvc",
    ocBinary: "opencode-windows-arm64",
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-pc-windows-msvc",
    ocBinary: "opencode-windows-x64-baseline",
    assetExt: "zip",
  },
  {
    rustTarget: "x86_64-unknown-linux-gnu",
    ocBinary: "opencode-linux-x64-baseline",
    assetExt: "tar.gz",
  },
  {
    rustTarget: "aarch64-unknown-linux-gnu",
    ocBinary: "opencode-linux-arm64",
    assetExt: "tar.gz",
  },
]

export const RUST_TARGET = Bun.env.RUST_TARGET

function nativeTarget() {
  const { platform, arch } = process
  if (platform === "darwin") return arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin"
  if (platform === "win32") return arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc"
  if (platform === "linux") return arch === "arm64" ? "aarch64-unknown-linux-gnu" : "x86_64-unknown-linux-gnu"
  throw new Error(`Unsupported platform: ${platform}/${arch}`)
}

export function getCurrentSidecar(target = RUST_TARGET ?? nativeTarget()) {
  const binaryConfig = SIDECAR_BINARIES.find((b) => b.rustTarget === target)
  if (!binaryConfig) throw new Error(`Sidecar configuration not available for Rust target '${target}'`)
  return binaryConfig
}

export function findCliBinary(rootDir: string) {
  const sidecar = getCurrentSidecar()
  const binaryName = process.platform === "win32" ? "opencode.exe" : "opencode"

  // Try with the configured ocBinary name (e.g. opencode-windows-x64-baseline)
  const distPath = join(rootDir, "packages/opencode/dist", sidecar.ocBinary, "bin", binaryName)
  if (existsSync(distPath)) return distPath

  // Try without -baseline suffix (e.g. opencode-windows-x64)
  const nonBaseline = sidecar.ocBinary.replace(/-baseline$/, "")
  const distPath2 = join(rootDir, "packages/opencode/dist", nonBaseline, "bin", binaryName)
  if (existsSync(distPath2)) return distPath2

  // Try node_modules
  const nmPath = join(rootDir, "node_modules", sidecar.ocBinary, "bin", binaryName)
  if (existsSync(nmPath)) return nmPath

  const nmPath2 = join(rootDir, "node_modules", nonBaseline, "bin", binaryName)
  if (existsSync(nmPath2)) return nmPath2

  throw new Error(
    `Cannot find opencode CLI binary. Tried:\n  ${distPath}\n  ${distPath2}\n  ${nmPath}\n  ${nmPath2}\nRun "bun run --cwd packages/opencode build" first.`,
  )
}

export async function copyBinaryToSidecarFolder(source: string) {
  const dir = `resources`
  await $`mkdir -p ${dir}`
  const dest = windowsify(`${dir}/opencode-cli`)
  await $`cp ${source} ${dest}`
  if (process.platform === "win32" && process.env.GITHUB_ACTIONS === "true") {
    await $`pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File ../../script/sign-windows.ps1 ${dest}`
  }
  if (process.platform === "darwin") await $`codesign --force --sign - ${dest}`

  console.log(`Copied ${source} to ${dest}`)
}

export function windowsify(path: string) {
  if (path.endsWith(".exe")) return path
  return `${path}${process.platform === "win32" ? ".exe" : ""}`
}
