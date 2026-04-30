import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { app } from "electron"

export function syncBuiltinSkills() {
  if (!app.isPackaged) return

  const source = join(process.resourcesPath, "skills")
  const target = join(homedir(), ".cimi", "cimicode", "skills")

  if (!existsSync(source)) return

  mkdirSync(target, { recursive: true })

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const targetSkill = join(target, entry.name)
    if (!existsSync(targetSkill)) {
      cpSync(join(source, entry.name), targetSkill, { recursive: true })
    }
  }
}
