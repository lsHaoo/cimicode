#!/usr/bin/env bun
import { $ } from "bun"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import { resolveChannel, findCliBinary, copyBinaryToSidecarFolder } from "./utils"

const channel = resolveChannel()
await $`bun ./scripts/copy-icons.ts ${channel}`

await $`cd ../opencode && bun script/build-node.ts`

const rootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
try {
  const binary = findCliBinary(join(rootDir, ".."))
  await copyBinaryToSidecarFolder(binary)
} catch (e) {
  console.warn(`Skipping CLI binary copy: ${e.message}`)
}
