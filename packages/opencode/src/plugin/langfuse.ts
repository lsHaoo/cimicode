import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { LangfuseSpanProcessor } from "@langfuse/otel"
import { NodeSDK } from "@opentelemetry/sdk-node"

/**
 * Langfuse configuration for OpenCode built-in plugin
 *
 * NOTE: These are hardcoded credentials for enterprise deployment.
 * The OpenTelemetry tracing will be automatically enabled without user configuration.
 *
 * Environment variables (OC_ prefix only to avoid naming conflicts):
 * - OC_LANGFUSE_PUBLIC_KEY: Override hardcoded public key
 * - OC_LANGFUSE_SECRET_KEY: Override hardcoded secret key
 * - OC_LANGFUSE_BASEURL: Override hardcoded base URL
 * - OC_LANGFUSE_ENVIRONMENT: Override environment (default: "production")
 * - OC_LANGFUSE_ENABLED: Set to "false" to disable Langfuse tracing (default: enabled)
 *
 * Priority: OC_LANGFUSE_* > HARDCODED_CONFIG
 */
const HARDCODED_CONFIG = {
  publicKey: "pk-lf-32603ea5-3475-4c57-8708-dc0712aa4936",
  secretKey: "sk-lf-eeccb092-e30b-45ab-a81a-61fcd7612896",
  baseUrl: "http://aip-trace.cxmt.com",
  environment: "production",
}

const PLUGIN_NAME = "LangfusePlugin"

const log = (level: "info" | "warn" | "error", message: string, client: PluginInput["client"]) => {
  // Use both client.log and console.log for better visibility
  const logMessage = `[${PLUGIN_NAME}] ${message}`
  console.log(logMessage)
  try {
    client.app.log({
      body: { service: "langfuse-otel", level, message },
    })
  } catch (err) {
    // Ignore logging errors
  }
}

export async function LangfusePlugin(input: PluginInput): Promise<Hooks> {
  const startTime = Date.now()

  // Check if Langfuse is explicitly disabled via environment variable
  if (process.env.OC_LANGFUSE_ENABLED === "false") {
    log("warn", "Langfuse tracing disabled via OC_LANGFUSE_ENABLED=false", input.client)
    return {}
  }

  // Allow environment variable overrides (OC_ prefix only to avoid naming conflicts)
  const publicKey = process.env.OC_LANGFUSE_PUBLIC_KEY || HARDCODED_CONFIG.publicKey
  const secretKey = process.env.OC_LANGFUSE_SECRET_KEY || HARDCODED_CONFIG.secretKey
  const baseUrl = process.env.OC_LANGFUSE_BASEURL || HARDCODED_CONFIG.baseUrl
  const environment = process.env.OC_LANGFUSE_ENVIRONMENT || HARDCODED_CONFIG.environment

  log("info", `Initializing Langfuse OTEL plugin → ${baseUrl}`, input.client)

  let processor: LangfuseSpanProcessor | undefined
  let sdk: NodeSDK | undefined

  try {
    // Initialize the Langfuse span processor
    processor = new LangfuseSpanProcessor({
      publicKey,
      secretKey,
      baseUrl,
      environment,
    })

    // Initialize the OpenTelemetry SDK
    sdk = new NodeSDK({
      spanProcessors: [processor],
    })

    // Start the SDK
    await sdk.start()
    const initTime = Date.now() - startTime
    log("info", `OTEL tracing initialized → ${baseUrl} (environment: ${environment}) [${initTime}ms]`, input.client)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    log("error", `Failed to initialize Langfuse OTEL: ${errorMsg}`, input.client)

    // Check if it's a network connectivity issue
    if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND") || errorMsg.includes("network")) {
      log("warn", "Langfuse server is not reachable. Tracing will be disabled. Use OC_LANGFUSE_ENABLED=false to suppress this message.", input.client)
    }

    // Return empty hooks to prevent OpenCode from failing
    return {}
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        try {
          if (processor) {
            await processor.forceFlush()
            log("info", "Flushed OTEL spans before idle", input.client)
          }
        } catch (err) {
          log("warn", `Failed to flush OTEL spans: ${err}`, input.client)
        }
      }

      if (event.type === "server.instance.disposed") {
        try {
          if (sdk) {
            await sdk.shutdown()
            log("info", "Shut down OTEL SDK", input.client)
          }
        } catch (err) {
          log("warn", `Failed to shutdown OTEL SDK: ${err}`, input.client)
        }
      }
    },
  }
}

// Add plugin name property for logging
Object.defineProperty(LangfusePlugin, "name", { value: PLUGIN_NAME })
