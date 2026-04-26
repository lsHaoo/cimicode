import { $ } from "bun"
import { existsSync } from "node:fs"

await $`bun ./scripts/copy-icons.ts ${process.env.OPENCODE_CHANNEL ?? "dev"}`

try {
  await $`cd ../opencode && bun script/build-node.ts`
} catch (error) {
  if (existsSync("../opencode/dist/node/node.js")) {
    console.warn("Failed to rebuild opencode node bundle; using existing dist/node/node.js")
    console.warn(error)
  } else {
    throw error
  }
}
