import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { getStatus, install, uninstall, toggle, enable, disable } from "../../skill-manager"
import { lazy } from "../../util/lazy"

export const SkillManagerRoutes = lazy(() =>
  new Hono()
    // GET /skill-manager/status - 获取 skill 状态
    .get(
      "/status",
      describeRoute({
        summary: "Get skill status",
        description: "Get the status of a skill, including whether it exists and is enabled.",
        operationId: "skill-manager.get-status",
        responses: {
          200: {
            description: "Skill status",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    exists: z.boolean(),
                    enabled: z.boolean(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("query", z.object({ skillName: z.string() })),
      async (c) => {
        const { skillName } = c.req.valid("query")
        const status = await getStatus(skillName)
        return c.json(status)
      },
    )
    // POST /skill-manager/install - 安装 skill
    .post(
      "/install",
      describeRoute({
        summary: "Install skill",
        description: "Install a skill from the provided download URL. Requires X-Access-Token header for authentication.",
        operationId: "skill-manager.install",
        responses: {
          200: {
            description: "Install result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    message: z.string(),
                    skillName: z.string().optional(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("json", z.object({ skillName: z.string(), downloadUrl: z.string() })),
      async (c) => {
        const { skillName, downloadUrl } = c.req.valid("json")
        const accessToken = c.req.header("X-Access-Token")
        const result = await install(skillName, downloadUrl, accessToken)
        return c.json(result)
      },
    )
    // DELETE /skill-manager/uninstall - 卸载 skill
    .delete(
      "/uninstall",
      describeRoute({
        summary: "Uninstall skill",
        description: "Uninstall a skill by deleting its directory and files.",
        operationId: "skill-manager.uninstall",
        responses: {
          200: {
            description: "Uninstall result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    message: z.string(),
                    skillName: z.string().optional(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("json", z.object({ skillName: z.string() })),
      async (c) => {
        const { skillName } = c.req.valid("json")
        const result = await uninstall(skillName)
        return c.json(result)
      },
    )
    // PUT /skill-manager/enable - 启用 skill
    .put(
      "/enable",
      describeRoute({
        summary: "Enable skill",
        description: "Enable a specific skill in the global configuration.",
        operationId: "skill-manager.enable",
        responses: {
          200: {
            description: "Enable result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    message: z.string(),
                    skillName: z.string(),
                    enabled: z.boolean(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("json", z.object({ skillName: z.string() })),
      async (c) => {
        const { skillName } = c.req.valid("json")
        const result = await enable(skillName)
        return c.json(result)
      },
    )
    // PUT /skill-manager/disable - 禁用 skill
    .put(
      "/disable",
      describeRoute({
        summary: "Disable skill",
        description: "Disable a specific skill in the global configuration.",
        operationId: "skill-manager.disable",
        responses: {
          200: {
            description: "Disable result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    message: z.string(),
                    skillName: z.string(),
                    enabled: z.boolean(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("json", z.object({ skillName: z.string() })),
      async (c) => {
        const { skillName } = c.req.valid("json")
        const result = await disable(skillName)
        return c.json(result)
      },
    )
    // PUT /skill-manager/toggle/:name - 切换 skill 启用状态
    .put(
      "/toggle/:name",
      describeRoute({
        summary: "Toggle skill",
        description: "Toggle the enabled state of a specific skill.",
        operationId: "skill-manager.toggle",
        responses: {
          200: {
            description: "Toggle result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    message: z.string(),
                    skillName: z.string(),
                    enabled: z.boolean(),
                  }),
                ),
              },
            },
          },
        },
      }),
      validator("param", z.object({ name: z.string() })),
      async (c) => {
        const { name } = c.req.valid("param")
        const result = await toggle(name)
        return c.json(result)
      },
    )
)