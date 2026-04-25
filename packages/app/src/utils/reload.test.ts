import { describe, expect, test } from "bun:test"
import { servicePost, serviceReady, serviceText } from "./reload"

describe("reload helpers", () => {
  test("detects restart-service availability inside iframe", () => {
    const parent = {}

    expect(serviceReady({ parent } as unknown as Window)).toBe(true)
  })

  test("detects restart-service unavailability outside iframe", () => {
    const win = {} as { parent?: unknown }
    win.parent = win

    expect(serviceReady(win as unknown as Window)).toBe(false)
  })

  test("posts restart-service message to parent window", () => {
    const calls: Array<{ msg: string; target: string }> = []
    const parent = {
      postMessage: (msg: string, target: string) => {
        calls.push({ msg, target })
      },
    }

    expect(servicePost({ parent } as unknown as Window)).toBe(true)
    expect(calls).toEqual([{ msg: serviceText, target: "*" }])
  })

  test("skips restart-service message outside iframe", () => {
    const calls: string[] = []
    const win = {
      postMessage: (msg: string) => {
        calls.push(msg)
      },
    } as {
      parent?: unknown
      postMessage: (msg: string) => void
    }
    win.parent = win

    expect(servicePost(win as unknown as Window)).toBe(false)
    expect(calls).toEqual([])
  })
})
