import { createMemo, createSignal, onMount, Show } from "solid-js"
import { useSync } from "@tui/context/sync"
import { map, pipe, sortBy } from "remeda"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "../context/sdk"
import { DialogPrompt } from "../ui/dialog-prompt"
import { Link } from "../ui/link"
import { useTheme } from "../context/theme"
import { TextAttributes } from "@opentui/core"
import type { ProviderAuthAuthorization, ProviderAuthMethod } from "@opencode-ai/sdk/v2"
import { DialogModel } from "./dialog-model"
import { useKeyboard } from "@opentui/solid"
import * as Clipboard from "@tui/util/clipboard"
import { useToast } from "../ui/toast"
import { isConsoleManagedProvider } from "@tui/util/provider-origin"
import { useConnected } from "./use-connected"
import {
  CXMT_CIMI_PROVIDER_ID,
  CXMT_CIMI_PROVIDER_NAME,
  loadPresetModels,
  presetConfigPatch,
  presetProviderID,
  type PresetModel,
} from "./provider-preset"

const PROVIDER_PRIORITY: Record<string, number> = {
  [CXMT_CIMI_PROVIDER_ID]: 0,
  opencode: 0,
  "opencode-go": 1,
  openai: 2,
  "github-copilot": 3,
  anthropic: 4,
  google: 5,
}

export function providerDisplayName(provider: { id: string; name: string }) {
  if (provider.id === "opencode") return "CimiCode"
  if (provider.id === "opencode-go") return "CimiCode Go"
  return provider.name
}

export function createDialogProviderOptions() {
  const sync = useSync()
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()
  const { theme } = useTheme()
  const onboarded = useConnected()
  const options = createMemo(() => {
    const connected = sync.data.provider_next.connected.includes(CXMT_CIMI_PROVIDER_ID)
    const cxmt = {
      title: CXMT_CIMI_PROVIDER_NAME,
      value: CXMT_CIMI_PROVIDER_ID,
      description: "Recommended preset",
      category: "Popular",
      gutter: connected && onboarded() ? <text fg={theme.success}>✓</text> : undefined,
      onSelect() {
        dialog.replace(() => <CxmtCimiModelSelect />)
      },
    }

    return [
      cxmt,
      ...pipe(
        sync.data.provider_next.all.filter((provider) => provider.id !== CXMT_CIMI_PROVIDER_ID),
        sortBy((x) => PROVIDER_PRIORITY[x.id] ?? 99),
        map((provider) => {
          const consoleManaged = isConsoleManagedProvider(sync.data.console_state.consoleManagedProviders, provider.id)
          const connected = sync.data.provider_next.connected.includes(provider.id)

          return {
            title: providerDisplayName(provider),
            value: provider.id,
            description: {
              opencode: "(Recommended)",
              anthropic: "(API key)",
              openai: "(ChatGPT Plus/Pro or API key)",
              "opencode-go": "Low cost subscription for everyone",
            }[provider.id],
            footer: consoleManaged ? sync.data.console_state.activeOrgName : undefined,
            category: provider.id in PROVIDER_PRIORITY ? "Popular" : "Other",
            gutter: connected && onboarded() ? <text fg={theme.success}>✓</text> : undefined,
            async onSelect() {
              if (consoleManaged) return

              const methods = sync.data.provider_auth[provider.id] ?? [
                {
                  type: "api",
                  label: "API key",
                },
              ]
              let index: number | null = 0
              if (methods.length > 1) {
                index = await new Promise<number | null>((resolve) => {
                  dialog.replace(
                    () => (
                      <DialogSelect
                        title="Select auth method"
                        options={methods.map((x, index) => ({
                          title: x.label,
                          value: index,
                        }))}
                        onSelect={(option) => resolve(option.value)}
                      />
                    ),
                    () => resolve(null),
                  )
                })
              }
              if (index == null) return
              const method = methods[index]
              if (method.type === "oauth") {
                let inputs: Record<string, string> | undefined
                if (method.prompts?.length) {
                  const value = await PromptsMethod({
                    dialog,
                    prompts: method.prompts,
                  })
                  if (!value) return
                  inputs = value
                }

                const result = await sdk.client.provider.oauth.authorize({
                  providerID: provider.id,
                  method: index,
                  inputs,
                })
                if (result.error) {
                  toast.show({
                    variant: "error",
                    message: JSON.stringify(result.error),
                  })
                  dialog.clear()
                  return
                }
                if (result.data?.method === "code") {
                  dialog.replace(() => (
                    <CodeMethod
                      providerID={provider.id}
                      title={method.label}
                      index={index}
                      authorization={result.data!}
                    />
                  ))
                }
                if (result.data?.method === "auto") {
                  dialog.replace(() => (
                    <AutoMethod
                      providerID={provider.id}
                      title={method.label}
                      index={index}
                      authorization={result.data!}
                    />
                  ))
                }
              }
              if (method.type === "api") {
                let metadata: Record<string, string> | undefined
                if (method.prompts?.length) {
                  const value = await PromptsMethod({ dialog, prompts: method.prompts })
                  if (!value) return
                  metadata = value
                }
                return dialog.replace(() => <ApiMethod providerID={provider.id} title={method.label} metadata={metadata} />)
              }
            },
          }
        }),
      ),
    ]
  })
  return options
}

export function DialogProvider() {
  const options = createDialogProviderOptions()
  return <DialogSelect title="Connect a provider" options={options()} />
}

function CxmtCimiModelSelect() {
  const dialog = useDialog()
  const sdk = useSDK()
  const { theme } = useTheme()
  const [models, setModels] = createSignal<PresetModel[]>([])
  const [loading, setLoading] = createSignal(true)

  onMount(async () => {
    setModels(await loadPresetModels(sdk.fetch))
    setLoading(false)
  })

  const options = createMemo(() => {
    if (loading()) {
      return [
        {
          title: "Loading models...",
          value: undefined as PresetModel | undefined,
          disabled: true,
        },
      ]
    }

    return models().map((model) => ({
      title: model.name,
      value: model,
      description: `${model.provider} · ${(model.limit.context / 1000).toFixed(0)}K context`,
      footer: <text fg={theme.textMuted}>{model.url}</text>,
      onSelect() {
        dialog.replace(() => <CxmtCimiApiKey model={model} />)
      },
    }))
  })

  return <DialogSelect title="Select CXMT Cimi model" options={options()} />
}

function CxmtCimiApiKey(props: { model: PresetModel }) {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const toast = useToast()
  const { theme } = useTheme()

  return (
    <DialogPrompt
      title={`Connect ${props.model.provider}`}
      placeholder="API key"
      description={() => (
        <box gap={1}>
          <text fg={theme.textMuted}>Configure {props.model.name} through the CXMT Cimi OpenAI-compatible gateway.</text>
          <text fg={theme.textMuted}>{props.model.url}</text>
        </box>
      )}
      onConfirm={async (value) => {
        const apiKey = value.trim()
        if (!apiKey) return

        const providerID = presetProviderID(props.model)
        await sdk.client.auth.set(
          {
            providerID,
            auth: {
              type: "api",
              key: apiKey,
            },
          },
          { throwOnError: true },
        )
        await sdk.client.global.config.update(
          {
            config: presetConfigPatch(props.model, sync.data.config.disabled_providers ?? []),
          },
          { throwOnError: true },
        )
        await sdk.client.instance.dispose()
        await sync.bootstrap()
        toast.show({ variant: "success", message: `Configured ${props.model.name}` })
        dialog.replace(() => <DialogModel providerID={providerID} />)
      }}
    />
  )
}

interface AutoMethodProps {
  index: number
  providerID: string
  title: string
  authorization: ProviderAuthAuthorization
}
function AutoMethod(props: AutoMethodProps) {
  const { theme } = useTheme()
  const sdk = useSDK()
  const dialog = useDialog()
  const sync = useSync()
  const toast = useToast()

  useKeyboard((evt) => {
    if (evt.name === "c" && !evt.ctrl && !evt.meta) {
      const code = props.authorization.instructions.match(/[A-Z0-9]{4}-[A-Z0-9]{4,5}/)?.[0] ?? props.authorization.url
      Clipboard.copy(code)
        .then(() => toast.show({ message: "Copied to clipboard", variant: "info" }))
        .catch(toast.error)
    }
  })

  onMount(async () => {
    const result = await sdk.client.provider.oauth.callback({
      providerID: props.providerID,
      method: props.index,
    })
    if (result.error) {
      dialog.clear()
      return
    }
    await sdk.client.instance.dispose()
    await sync.bootstrap()
    dialog.replace(() => <DialogModel providerID={props.providerID} />)
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          {props.title}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      <box gap={1}>
        <Link href={props.authorization.url} fg={theme.primary} />
        <text fg={theme.textMuted}>{props.authorization.instructions}</text>
      </box>
      <text fg={theme.textMuted}>Waiting for authorization...</text>
      <text fg={theme.text}>
        c <span style={{ fg: theme.textMuted }}>copy</span>
      </text>
    </box>
  )
}

interface CodeMethodProps {
  index: number
  title: string
  providerID: string
  authorization: ProviderAuthAuthorization
}
function CodeMethod(props: CodeMethodProps) {
  const { theme } = useTheme()
  const sdk = useSDK()
  const sync = useSync()
  const dialog = useDialog()
  const [error, setError] = createSignal(false)

  return (
    <DialogPrompt
      title={props.title}
      placeholder="Authorization code"
      onConfirm={async (value) => {
        const { error } = await sdk.client.provider.oauth.callback({
          providerID: props.providerID,
          method: props.index,
          code: value,
        })
        if (!error) {
          await sdk.client.instance.dispose()
          await sync.bootstrap()
          dialog.replace(() => <DialogModel providerID={props.providerID} />)
          return
        }
        setError(true)
      }}
      description={() => (
        <box gap={1}>
          <text fg={theme.textMuted}>{props.authorization.instructions}</text>
          <Link href={props.authorization.url} fg={theme.primary} />
          <Show when={error()}>
            <text fg={theme.error}>Invalid code</text>
          </Show>
        </box>
      )}
    />
  )
}

interface ApiMethodProps {
  providerID: string
  title: string
  metadata?: Record<string, string>
}
function ApiMethod(props: ApiMethodProps) {
  const dialog = useDialog()
  const sdk = useSDK()
  const sync = useSync()
  const { theme } = useTheme()

  return (
    <DialogPrompt
      title={props.title}
      placeholder="API key"
      description={
        {
          opencode: (
            <box gap={1}>
              <text fg={theme.textMuted}>
                CimiCode Zen gives you access to all the best coding models at the cheapest prices with a single API
                key.
              </text>
              <text fg={theme.text}>
                Go to <span style={{ fg: theme.primary }}>https://cimicode.ai/zen</span> to get a key
              </text>
            </box>
          ),
          "opencode-go": (
            <box gap={1}>
              <text fg={theme.textMuted}>
                CimiCode Go is a $10 per month subscription that provides reliable access to popular open coding models
                with generous usage limits.
              </text>
              <text fg={theme.text}>
                Go to <span style={{ fg: theme.primary }}>https://cimicode.ai/zen</span> and enable CimiCode Go
              </text>
            </box>
          ),
        }[props.providerID] ?? undefined
      }
      onConfirm={async (value) => {
        if (!value) return
        await sdk.client.auth.set({
          providerID: props.providerID,
          auth: {
            type: "api",
            key: value,
            ...(props.metadata ? { metadata: props.metadata } : {}),
          },
        })
        await sdk.client.instance.dispose()
        await sync.bootstrap()
        dialog.replace(() => <DialogModel providerID={props.providerID} />)
      }}
    />
  )
}

interface PromptsMethodProps {
  dialog: ReturnType<typeof useDialog>
  prompts: NonNullable<ProviderAuthMethod["prompts"]>[number][]
}
async function PromptsMethod(props: PromptsMethodProps) {
  const inputs: Record<string, string> = {}
  for (const prompt of props.prompts) {
    if (prompt.when) {
      const value = inputs[prompt.when.key]
      if (value === undefined) continue
      const matches = prompt.when.op === "eq" ? value === prompt.when.value : value !== prompt.when.value
      if (!matches) continue
    }

    if (prompt.type === "select") {
      const value = await new Promise<string | null>((resolve) => {
        props.dialog.replace(
          () => (
            <DialogSelect
              title={prompt.message}
              options={prompt.options.map((x) => ({
                title: x.label,
                value: x.value,
                description: x.hint,
              }))}
              onSelect={(option) => resolve(option.value)}
            />
          ),
          () => resolve(null),
        )
      })
      if (value === null) return null
      inputs[prompt.key] = value
      continue
    }

    const value = await new Promise<string | null>((resolve) => {
      props.dialog.replace(
        () => (
          <DialogPrompt title={prompt.message} placeholder={prompt.placeholder} onConfirm={(value) => resolve(value)} />
        ),
        () => resolve(null),
      )
    })
    if (value === null) return null
    inputs[prompt.key] = value
  }
  return inputs
}
