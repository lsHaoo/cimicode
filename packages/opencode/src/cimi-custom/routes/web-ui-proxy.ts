import { Hono } from "hono"
import { proxy } from "hono/proxy"
import { Log } from "@/util"

const log = Log.create({ service: "web-ui-proxy" })

const CSP_HEADER =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data:; connect-src 'self' data:"

export const WebUIProxyRoutes = (): Hono | null => {
  const webUrl = process.env.CIMICODE_WEB_URL
  if (!webUrl) return null

  log.info("custom WebUI proxy enabled", { webUrl })

  return new Hono().all("/*", async (c) => {
    const path = c.req.path

    const proxyRequest = async (targetPath: string): Promise<Response> => {
      const response = await proxy(`${webUrl}${targetPath}`, {
        ...c.req,
        headers: {
          ...c.req.raw.headers,
          host: new URL(webUrl).host,
        },
      })
      response.headers.set("Content-Security-Policy", CSP_HEADER)
      if (targetPath.endsWith("index.html")) {
        response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      } else {
        response.headers.set("Cache-Control", "public, max-age=3600")
      }
      return response
    }

    const proxyPath = path === "/" ? `${path}index.html` : path
    let response = await proxyRequest(proxyPath)
    if (response.status !== 200 && !path.includes(".")) {
      response = await proxyRequest("/index.html")
    }

    return response
  })
}
