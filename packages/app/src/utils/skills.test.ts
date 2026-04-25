import { describe, expect, test } from "bun:test"
import {
  skillDisable,
  skillDisableUrl,
  skillDownUrl,
  skillDone,
  skillEnable,
  skillEnableUrl,
  skillHas,
  skillHeaders,
  skillInfo,
  skillInfoUrl,
  skillInstall,
  skillInstallUrl,
  skillJoin,
  skillLocal,
  skillMarket,
  skillMine,
  skillMineUrl,
  skillPage,
  skillPickId,
  skillRead,
  skillState,
  skillStatus,
  skillStatusUrl,
  skillSet,
  skillUninstall,
  skillUninstallUrl,
  skillUrl,
} from "./skills"

describe("skills api helpers", () => {
  test("builds marketplace url without empty keyword", () => {
    const url = new URL(skillUrl(""), "https://host.test")

    expect(url.pathname).toBe("/api/agi/chat/v1/marketplace/assets/skills")
    expect(url.searchParams.get("pageNum")).toBe("1")
    expect(url.searchParams.get("pageSize")).toBe("900")
    expect(url.searchParams.has("keyword")).toBe(false)
  })

  test("builds marketplace url with keyword", () => {
    const url = new URL(skillUrl("abc"), "https://host.test")

    expect(url.searchParams.get("keyword")).toBe("abc")
  })

  test("emits access token header", () => {
    expect(skillHeaders("abc")).toEqual({
      Accept: "application/json",
      "X-Access-Token": "abc",
    })
  })

  test("builds install download url from development env", () => {
    expect(skillDownUrl("/download/skill.zip", "https://t-app.cdtp.com/api/agi/chat")).toBe(
      "https://t-app.cdtp.com/api/agi/chat/download/skill.zip",
    )
    expect(skillDownUrl("download/skill.zip", "https://t-app.cdtp.com/api/agi/chat")).toBe(
      "https://t-app.cdtp.com/api/agi/chat/download/skill.zip",
    )
  })

  test("builds install download url from production env", () => {
    expect(skillDownUrl("/download/skill.zip", "https://app.cxmt.com/api/agi/chat")).toBe(
      "https://app.cxmt.com/api/agi/chat/download/skill.zip",
    )
    expect(skillDownUrl("https://cdn.example.com/skill.zip", "https://t-app.cdtp.com/api/agi/chat")).toBe(
      "https://cdn.example.com/skill.zip",
    )
  })

  test("normalizes response payload", () => {
    const page = skillPage({
      code: "SUCCESS",
      data: [
        {
          id: "1",
          name: "Alpha",
          description: "desc",
          avatar: "",
          currentVersion: { versionNo: 2 },
          categories: [{ name: "代码生成" }, { name: " " }, {}],
        },
      ],
      totalSize: 1,
      totalPages: 1,
      pageSize: 900,
      pageNum: 1,
    })

    expect(page).toEqual({
      list: [
        {
          id: "1",
          name: "Alpha",
          description: "desc",
          avatar: "",
          cats: ["代码生成"],
          ver: 2,
        },
      ],
      total: 1,
      pages: 1,
      size: 900,
      page: 1,
    })
  })

  test("normalizes detail payload", () => {
    const item = skillInfo({
      code: "SUCCESS",
      data: {
        id: "1",
        name: "Alpha",
        description: "desc",
        avatar: "",
        version: {
          versionNo: 3,
          config: {
            skillMdContent: "# Alpha",
            attachment: {
              downloadUrl: "https://cdn.example.com/alpha.zip",
            },
          },
        },
        categories: [{ name: "代码生成" }],
      },
    })

    expect(item).toEqual({
      id: "1",
      name: "Alpha",
      description: "desc",
      avatar: "",
      cats: ["代码生成"],
      ver: 3,
      content: "# Alpha",
      download: "https://cdn.example.com/alpha.zip",
    })
  })

  test("normalizes skill state payload", () => {
    expect(
      skillState({
        exists: true,
        enabled: false,
      }),
    ).toEqual({
      exists: true,
      enabled: false,
    })
  })

  test("normalizes action payload", () => {
    expect(
      skillDone({
        success: true,
        enabled: true,
      }),
    ).toEqual({
      ok: true,
      enabled: true,
    })
  })

  test("requests marketplace with token and query", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          code: "SUCCESS",
          data: [],
          totalSize: 0,
          totalPages: 0,
          pageSize: 900,
          pageNum: 1,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch
    const page = await skillMarket({
      keyword: "abc",
      token: "tok",
      fetch: run,
    })

    expect(page.list).toEqual([])
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toContain("keyword=abc")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "X-Access-Token": "tok",
    })
  })

  test("builds marketplace detail url", () => {
    const url = skillInfoUrl("015e8cc3d4394e618e66b07dc7253447")

    expect(url).toBe("/api/agi/chat/v1/marketplace/assets/skills/015e8cc3d4394e618e66b07dc7253447")
  })

  test("requests marketplace detail with token", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          code: "SUCCESS",
          data: {
            id: "1",
            name: "Alpha",
            description: "desc",
            avatar: "",
            version: {
              versionNo: 1,
              config: {
                skillMdContent: "# Alpha",
                attachment: {
                  downloadUrl: "https://cdn.example.com/alpha.zip",
                },
              },
            },
          },
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillRead({
      id: "1",
      token: "tok",
      fetch: run,
    })

    expect(item?.content).toBe("# Alpha")
    expect(item?.download).toBe("https://cdn.example.com/alpha.zip")
    expect(calls[0]?.url).toBe("/api/agi/chat/v1/marketplace/assets/skills/1")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "X-Access-Token": "tok",
    })
  })

  test("builds status url with skill name query", () => {
    const url = skillStatusUrl("http://localhost:4096", "代码生成")

    expect(url.toString()).toBe("http://localhost:4096/skill-manager/status?skillName=%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90")
    expect(url.searchParams.get("skillName")).toBe("代码生成")
  })

  test("requests skill status with query string", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          exists: true,
          enabled: false,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillStatus({
      base: "http://localhost:4096",
      name: "代码生成",
      fetch: run,
    })

    expect(item).toEqual({
      exists: true,
      enabled: false,
    })
    expect(calls[0]?.url).toBe("http://localhost:4096/skill-manager/status?skillName=%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90")
    expect(calls[0]?.init?.method).toBe("GET")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
    })
  })

  test("builds skill action urls", () => {
    expect(skillEnableUrl("http://localhost:4096").toString()).toBe("http://localhost:4096/skill-manager/enable")
    expect(skillDisableUrl("http://localhost:4096").toString()).toBe("http://localhost:4096/skill-manager/disable")
    expect(skillInstallUrl("http://localhost:4096").toString()).toBe("http://localhost:4096/skill-manager/install")
    expect(skillUninstallUrl("http://localhost:4096").toString()).toBe("http://localhost:4096/skill-manager/uninstall")
  })

  test("requests enable with body payload", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          success: true,
          enabled: true,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillEnable({
      base: "http://localhost:4096",
      name: "代码生成",
      fetch: run,
    })

    expect(item).toEqual({
      ok: true,
      enabled: true,
    })
    expect(calls[0]?.url).toBe("http://localhost:4096/skill-manager/enable")
    expect(calls[0]?.init?.method).toBe("PUT")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    })
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ skillName: "代码生成" }))
  })

  test("requests disable with body payload", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          success: true,
          enabled: false,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillDisable({
      base: "http://localhost:4096",
      name: "代码生成",
      fetch: run,
    })

    expect(item).toEqual({
      ok: true,
      enabled: false,
    })
    expect(calls[0]?.url).toBe("http://localhost:4096/skill-manager/disable")
    expect(calls[0]?.init?.method).toBe("PUT")
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ skillName: "代码生成" }))
  })

  test("requests install with token and download url", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          success: true,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillInstall({
      base: "http://localhost:4096",
      name: "代码生成",
      url: "/download/skill.zip",
      token: "tok",
      down: "https://t-app.cdtp.com/api/agi/chat",
      fetch: run,
    })

    expect(item).toEqual({
      ok: true,
    })
    expect(calls[0]?.url).toBe("http://localhost:4096/skill-manager/install")
    expect(calls[0]?.init?.method).toBe("POST")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Access-Token": "tok",
    })
    expect(calls[0]?.init?.body).toBe(
      JSON.stringify({
        skillName: "代码生成",
        downloadUrl: "https://t-app.cdtp.com/api/agi/chat/download/skill.zip",
      }),
    )
  })

  test("requests uninstall with token and body payload", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify({
          success: true,
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const item = await skillUninstall({
      base: "http://localhost:4096",
      name: "\u4ee3\u7801\u751f\u6210",
      token: "tok",
      fetch: run,
    })

    expect(item).toEqual({
      ok: true,
    })
    expect(calls[0]?.url).toBe("http://localhost:4096/skill-manager/uninstall")
    expect(calls[0]?.init?.method).toBe("DELETE")
    expect(calls[0]?.init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Access-Token": "tok",
    })
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ skillName: "\u4ee3\u7801\u751f\u6210" }))
  })

  test("returns empty page when request fails", async () => {
    const page = await skillMarket({
      fetch: (async () => {
        throw new Error("offline")
      }) as unknown as typeof fetch,
    })

    expect(page).toEqual({
      list: [],
      total: 0,
      pages: 0,
      size: 900,
      page: 1,
    })
  })

  test("returns empty detail when detail request fails", async () => {
    const item = await skillRead({
      id: "015e8cc3d4394e618e66b07dc7253447",
      fetch: (async () => {
        throw new Error("offline")
      }) as unknown as typeof fetch,
    })

    expect(item).toBeUndefined()
  })

  test("returns unknown state when status request fails", async () => {
    const item = await skillStatus({
      base: "http://localhost:4096",
      name: "代码生成",
      fetch: (async () => {
        throw new Error("offline")
      }) as unknown as typeof fetch,
    })

    expect(item).toBeUndefined()
  })

  test("returns failed result when action request fails", async () => {
    const run = (async () => {
      throw new Error("offline")
    }) as unknown as typeof fetch

    expect(
      await skillEnable({
        base: "http://localhost:4096",
        name: "代码生成",
        fetch: run,
      }),
    ).toEqual({ ok: false })
    expect(
      await skillDisable({
        base: "http://localhost:4096",
        name: "代码生成",
        fetch: run,
      }),
    ).toEqual({ ok: false })
    expect(
      await skillInstall({
        base: "http://localhost:4096",
        name: "代码生成",
        url: "https://cdn.example.com/skill.zip",
        fetch: run,
      }),
    ).toEqual({ ok: false })
    expect(
      await skillUninstall({
        base: "http://localhost:4096",
        name: "\u4ee3\u7801\u751f\u6210",
        fetch: run,
      }),
    ).toEqual({ ok: false })
  })

  test("returns empty page when payload code is not success", () => {
    expect(
      skillPage({
        code: "FAIL",
        data: [
          {
            id: "1",
            name: "Alpha",
          },
        ],
      }),
    ).toEqual({
      list: [],
      total: 0,
      pages: 0,
      size: 900,
      page: 1,
    })
  })

  test("stores enabled skills and derives my skills list", () => {
    const one = { id: "2", name: "Beta", description: "", avatar: "", cats: ["分析"], ver: 1 }
    const two = { id: "1", name: "Alpha", description: "", avatar: "", cats: [], ver: undefined }
    const next = skillSet({}, one, true)
    const done = skillSet(next, two, true)

    expect(skillMine(done).map((item) => item.id)).toEqual(["1", "2"])
    expect(skillPickId(skillMine(done), "2")).toBe("2")
    expect(skillPickId(skillMine(skillSet(done, one, false)), "2")).toBe("1")
  })

  test("builds local skills url", () => {
    const url = skillMineUrl("http://localhost:4096")

    expect(url.toString()).toBe("http://localhost:4096/skill")
  })

  test("requests local installed skills", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const run = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      calls.push({ url: String(url), init })
      return new Response(
        JSON.stringify([
          {
            name: "verification-before-completion",
            description: "evidence before assertions always",
            location: "/home/ws/skills/verification-before-completion/SKILL.md",
            content: "xxxx",
          },
        ]),
        { status: 200 },
      )
    }) as unknown as typeof fetch

    const list = await skillLocal({
      base: "http://localhost:4096",
      fetch: run,
    })

    expect(calls[0]?.url).toBe("http://localhost:4096/skill")
    expect(calls[0]?.init?.method).toBe("GET")
    expect(list).toEqual([
      {
        id: "/home/ws/skills/verification-before-completion/SKILL.md",
        name: "verification-before-completion",
        description: "evidence before assertions always",
        avatar: "",
        cats: [],
        content: "xxxx",
      },
    ])
  })

  test("returns empty local skills when request fails", async () => {
    const list = await skillLocal({
      base: "http://localhost:4096",
      fetch: (async () => {
        throw new Error("offline")
      }) as unknown as typeof fetch,
    })

    expect(list).toEqual([])
  })

  test("joins installed skills and matches by name", () => {
    const local = [
      {
        id: "/a/SKILL.md",
        name: "Alpha",
        description: "",
        avatar: "",
        cats: [],
        ver: 1,
        content: "# Alpha",
      },
    ]
    const saved = [{ id: "1", name: "Alpha", description: "", avatar: "", cats: ["分析"], ver: 1 }]
    const list = skillJoin(saved, local)

    expect(list.map((item) => item.name)).toEqual(["Alpha"])
    expect(list[0]?.content).toBe("# Alpha")
    expect(skillHas(list, { id: "2", name: "Alpha" })).toBe(true)
    expect(skillHas(list, { id: "3", name: "Beta" })).toBe(false)
  })
})
