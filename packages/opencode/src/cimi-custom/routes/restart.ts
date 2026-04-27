import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import z from "zod"
import { lazy } from "../../util/lazy"

export const RestartRoutes = lazy(() =>
  new Hono()
    .post(
      "/",
      describeRoute({
        summary: "Restart server",
        description: "Restart the OpenCode server process",
        operationId: "app.restart",
        responses: {
          200: {
            description: "Restart initiated",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    message: z.string(),
                  }),
                ),
              },
            },
          },
        },
      }),
      async (c) => {
        // 先返回响应，不等待重启完成
        const response = c.json({ message: "Server restarting..." })

        // 延迟执行，确保响应已发送
        setTimeout(async () => {
          try {
            // 使用 nohup 确保脚本独立运行，不受父进程影响
            const cmd = "nohup bash /tmp/scripts/restart.sh >> /tmp/cimicode.log 2>&1 &"
            Bun.spawn(["bash", "-c", cmd], { detached: true })
          } catch (error) {
            // 静默处理错误，因为响应已经返回
            // 实际项目可以写日志
          }
        }, 1000)

        return response
      },
    )
)