import { describe, expect, test } from "bun:test"
import { cimiBoot, cimiToken, cimiUrl } from "./cimi"

describe("cimi runtime helpers", () => {
  test("reads token from url and strips only that query param", () => {
    const next = cimiUrl(new URL("https://host.test/a/b?token=abc&foo=bar#hash"))

    expect(next.seen).toBe(true)
    expect(next.token).toBe("abc")
    expect(next.href).toBe("/a/b?foo=bar#hash")
  })

  test("boots from url token and persists it", () => {
    const calls: string[] = []
    const map = new Map<string, string>()

    const token = cimiBoot({
      url: new URL("https://host.test/chat?token=abc"),
      store: {
        getItem: (id) => map.get(id) ?? null,
        setItem: (id, value) => {
          map.set(id, value)
        },
      },
      hist: {
        replaceState: (_state, _title, href) => {
          calls.push(String(href))
        },
      },
    })

    expect(token).toBe("abc")
    expect(calls).toEqual(["/chat"])
    expect(cimiToken({ getItem: (id) => map.get(id) ?? null })).toBe("abc")
  })

  test("falls back to stored token when url does not include one", () => {
    const map = new Map([["cimi.skills.token", "saved"]])

    const token = cimiBoot({
      url: new URL("https://host.test/chat?foo=bar"),
      store: {
        getItem: (id) => map.get(id) ?? null,
        setItem: () => undefined,
      },
      hist: {
        replaceState: () => undefined,
      },
    })

    expect(token).toBe("saved")
  })
})
