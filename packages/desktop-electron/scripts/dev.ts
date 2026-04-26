#!/usr/bin/env bun
import { $ } from "bun"

delete process.env.ELECTRON_RUN_AS_NODE

await $`electron-vite dev`
