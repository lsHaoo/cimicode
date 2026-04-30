import { Hono } from "hono"
import { FileManagerRoutes } from "./file-manager"
import { SkillManagerRoutes } from "./skill-manager"
import { RestartRoutes } from "./restart"
import { AgiProxyRoutes } from "./agi-proxy"
import { WebUIProxyRoutes } from "./web-ui-proxy"

export function CimiCustomRoutes(): Hono {
  const app = new Hono()
  app.route("/file-manager", FileManagerRoutes())
  app.route("/skill-manager", SkillManagerRoutes())
  app.route("/reload", RestartRoutes())
  app.route("/api/agi", AgiProxyRoutes())
  const webUI = WebUIProxyRoutes()
  if (webUI) app.route("/", webUI)
  return app
}
