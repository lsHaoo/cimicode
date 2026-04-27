import { Hono } from "hono"
import { proxy } from "hono/proxy"
import { Log } from "@/util/log"
import { Env } from "@/env"

const log = Log.create({ service: "agi-proxy" })

/**
 * 根据环境变量获取代理目标URL
 */
function getProxyTarget(): string {
  const env = Env.get("OC_ENVIRONMENT")
  log.debug("proxy target environment", { env })
  if (env === "test") {
    return "http://t-app.cdtp.com "
  }
  return "http://app.cxmt.com "
}

/**
 * 安全地记录 headers（过滤敏感信息）
 */
function safeHeaders(headers: Record<string, string>): Record<string, string> {
  const unsafeKeys = ["authorization", "cookie", "set-cookie", "x-api-key"]
  const safe: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (unsafeKeys.some(uk => key.toLowerCase() === uk)) {
      safe[key] = "***HIDDEN***"
    } else {
      safe[key] = value
    }
  }
  return safe
}

/**
 * AGI 代理路由
 * 所有以 /api/agi 开头的请求将被透传代理
 */
export function AgiProxyRoutes() {
  return new Hono().all("/*", async (c) => {
    const originalPath = c.req.path
    const method = c.req.method

    // 从 Request.url 中提取查询字符串（包含 "?" 前缀）
    const url = new URL(c.req.raw.url)
    const query = url.search || ""

    // 构建代理目标路径
    const targetUrl = getProxyTarget()
    const proxyPath = `${targetUrl}${originalPath}${query}`

    // 获取目标 URL 的 host
    const targetHost = new URL(targetUrl).host

    // 转换 headers 为普通对象，并修改 host
    const headers: Record<string, string> = {}
    for (const [key, value] of c.req.raw.headers.entries()) {
      if (key.toLowerCase() === "host") {
        headers[key] = targetHost
      } else {
        headers[key] = value
      }
    }

    log.info("proxying request", {
      method,
      originalPath,
      query,
      targetUrl,
      targetHost,
      proxyPath,
      headers: safeHeaders(headers),
    })

    try {
      // 获取请求 body (可能是 null, string, ArrayBuffer, ReadableStream)
      const body = await c.req.arrayBuffer()

      log.debug("forwarding request", {
        bodyLength: body.byteLength,
        contentType: headers["content-type"],
      })

      // 透传代理
      const response = await proxy(proxyPath, {
        method,
        headers,
        body: body.byteLength > 0 ? body : undefined,
      })

      // 记录响应详细信息
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseText = await response.clone().text()

      log.info("proxy response received", {
        status: response.status,
        statusText: response.statusText,
        url: proxyPath,
        headers: safeHeaders(responseHeaders),
        bodyPreview: responseText.slice(0, 500), // 前500字符
        bodyLength: responseText.length,
      })

      return response
    } catch (error) {
      log.error("proxy request failed", {
        method,
        path: originalPath,
        proxyPath,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  })
}