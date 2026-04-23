import path from "path"
import { xdgData, xdgCache, xdgState } from "xdg-basedir"
import os from "os"
import { Context, Effect, Layer } from "effect"

export namespace Global {
  export class Service extends Context.Service<Service, Interface>()("@cimicode/Global") {}

  export interface Interface {
    readonly home: string
    readonly data: string
    readonly cache: string
    readonly config: string
    readonly state: string
    readonly bin: string
    readonly log: string
  }

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const app = "cimicode"
      // Support both old and new environment variable names for backwards compatibility
      const home = process.env.CIMICODE_TEST_HOME ?? process.env.OPENCODE_TEST_HOME ?? os.homedir()
      const data = path.join(xdgData!, "cimicode")
      const cache = path.join(xdgCache!, "cimicode")
      // Use custom config path instead of xdgConfig to match desktop-electron settings
      const cfg = path.join(home, ".cimi", "cimicode")
      const state = path.join(xdgState!, "cimicode")
      const bin = path.join(cache, "bin")
      const log = path.join(data, "log")

      return Service.of({
        home,
        data,
        cache,
        config: cfg,
        state,
        bin,
        log,
      })
    }),
  )
}
