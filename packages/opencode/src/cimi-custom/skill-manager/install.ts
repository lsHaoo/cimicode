import { NamedError } from "@opencode-ai/core/util/error"
import { Log } from "@/util"
import { Global } from "@opencode-ai/core/global"
import path from "path"
import fs from "fs/promises"
import { ZipReader, BlobReader, BlobWriter } from "@zip.js/zip.js"
import z from "zod"

const log = Log.create({ service: "skill-manager" })

function getSkillInstallDir(): string {
  return path.join(Global.Path.config, "skills")
}

function validateZipEntry(filename: string): boolean {
  if (filename.includes("..")) {
    return false
  }
  if (path.isAbsolute(filename.replace(/\\/g, "/"))) {
    return false
  }
  return true
}

function normalizeZipPath(zipPath: string): string {
  const normalized = zipPath.replace(/\\/g, "/")
  return normalized.split("/").join(path.sep)
}

async function extractSkill(zipBuffer: ArrayBuffer, skillName: string, isUpdate: boolean): Promise<void> {
  const installDir = getSkillInstallDir()
  const targetDir = path.join(installDir, skillName)
  const tempDir = path.join(installDir, `.tmp-${skillName}-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  try {
    const blob = new Blob([zipBuffer])
    const zipReader = new ZipReader(new BlobReader(blob))

    try {
      const entries = await zipReader.getEntries()

      let skillRootDir = ""
      const skillMdEntry = entries.find(e => {
        const normalized = e.filename.replace(/\\/g, "/").toLowerCase()
        return normalized.endsWith("/skill.md") || normalized === "skill.md"
      })

      if (!skillMdEntry) {
        throw new InstallError({
          message: "Invalid skill package: SKILL.md not found in zip",
          errorType: "invalid_package",
        })
      }

      const skillMdPath = skillMdEntry.filename
      const parts = skillMdPath.replace(/\\/g, "/").split("/")
      parts.pop()
      skillRootDir = parts.join("/")

      for (const entry of entries) {
        if (!validateZipEntry(entry.filename)) {
          throw new InstallError({
            message: `Invalid path in zip: ${entry.filename}`,
            errorType: "invalid_package",
          })
        }
      }

      for (const entry of entries) {
        if (entry.directory) continue

        const sourcePath = entry.filename.replace(/\\/g, "/")

        if (skillRootDir !== "" && !sourcePath.startsWith(skillRootDir + "/")) {
          continue
        }

        const relativePath = skillRootDir === "" ? sourcePath : sourcePath.slice(skillRootDir.length + 1)
        const targetPath = path.join(tempDir, skillName, normalizeZipPath(relativePath))

        const resolvedTarget = path.resolve(targetPath)
        const resolvedTemp = path.resolve(tempDir)
        if (!resolvedTarget.startsWith(resolvedTemp + path.sep) && resolvedTarget !== resolvedTemp) {
          throw new InstallError({
            message: `Invalid path extraction: target is outside temp directory`,
            errorType: "invalid_package",
          })
        }

        const targetDirPath = path.dirname(targetPath)
        await fs.mkdir(targetDirPath, { recursive: true })

        const fileBlob = await entry.getData(new BlobWriter())
        const fileArrayBuffer = await fileBlob.arrayBuffer()
        await fs.writeFile(targetPath, Buffer.from(fileArrayBuffer))
      }

      const skillMdPathOnDisk = path.join(tempDir, skillName, normalizeZipPath("SKILL.md"))
      const skillMdExists = await fs.access(skillMdPathOnDisk).then(() => true).catch(() => false)
      if (!skillMdExists) {
        throw new InstallError({
          message: "Invalid skill package: SKILL.md extraction failed",
          errorType: "extraction_failed",
        })
      }

      if (await fs.access(targetDir).then(() => true).catch(() => false)) {
        await fs.rm(targetDir, { recursive: true, force: true })
      }

      const skillTempDir = path.join(tempDir, skillName)
      await fs.rename(skillTempDir, targetDir)

    } finally {
      await zipReader.close()
    }
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})

    if (InstallError.isInstance(error)) {
      throw error
    }

    throw new InstallError({
      message: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      errorType: "extraction_failed",
    })
  }
}

async function disposeInstanceForReload() {
  const { Instance } = await import("@/project/instance")
  await Instance.disposeAll()
}

type InstallErrorType =
  | "download_failed"
  | "invalid_package"
  | "extraction_failed"

const InstallError = NamedError.create(
  "InstallError",
  z.object({
    message: z.string(),
    errorType: z.enum(["download_failed", "invalid_package", "extraction_failed"]),
  })
)

export async function install(skillName: string, downloadUrl: string, accessToken?: string) {
  try {
    const installDir = getSkillInstallDir()
    const skillDir = path.join(installDir, skillName)
    const skillMdPath = path.join(skillDir, "SKILL.md")

    const exists = await fs.access(skillMdPath).then(() => true).catch(() => false)

    const operation = exists ? "Updating" : "Installing"

    const headers: Record<string, string> = {}
    if (accessToken) {
      headers["X-Access-Token"] = accessToken
    }

    log.info(`${operation.toLowerCase()} skill`, { skillName, url: downloadUrl, hasToken: !!accessToken })

    const response = await fetch(downloadUrl, { headers })
    if (!response.ok) {
      let errorDetails = ""
      try {
        const errorText = await response.text()
        errorDetails = errorText.length > 0 ? ` - ${errorText}` : ""
      } catch {
        errorDetails = " - Failed to read error response"
      }
      throw new InstallError({
        message: `Download failed: HTTP ${response.status} ${response.statusText}${errorDetails}`,
        errorType: "download_failed",
      })
    }

    const zipBuffer = await response.arrayBuffer()
    await extractSkill(zipBuffer, skillName, exists)
    await disposeInstanceForReload()

    log.info(`skill ${exists ? "updated" : "installed"} successfully`, { skillName })

    return {
      success: true as const,
      message: `Skill '${skillName}' ${exists ? "updated" : "installed"} successfully`,
      skillName,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    let errorType: InstallErrorType = "download_failed"

    if (InstallError.isInstance(error)) {
      errorType = error.data.errorType
    }

    log.error("failed to install skill", {
      skillName,
      error: errorMessage,
      errorType,
      stack: errorStack,
    })

    return {
      success: false as const,
      message: errorMessage,
      errorType,
    }
  }
}
