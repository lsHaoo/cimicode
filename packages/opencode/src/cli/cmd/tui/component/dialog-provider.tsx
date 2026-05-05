import { createMemo, createSignal, onMount } from "solid-js"
import { useSync } from "@tui/context/sync"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "../context/sdk"
import { DialogPrompt } from "../ui/dialog-prompt"
import { useTheme } from "../context/theme"
import { DialogModel } from "./dialog-model"
import { DialogModelEdit } from "./dialog-model-edit"
import { useToast } from "../ui/toast"
import { useConnected } from "./use-connected"
import {
  CXMT_CIMI_PROVIDER_ID,
  CXMT_CIMI_PROVIDER_NAME,
  loadPresetModels,
  presetConfigPatch,
  presetProviderID,
  type PresetModel,
} from "./provider-preset"
import { isCustomProvider, isEditableProvider } from "./provider-filter"

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

  const promptRequired = async (title: string, placeholder: string, validate?: (value: string) => string | undefined) => {
    while (true) {
      const value = await DialogPrompt.show(dialog, title, { placeholder })
      if (value === null) return
      const trimmed = value.trim()
      const error = !trimmed ? `${title} is required` : validate?.(trimmed)
      if (!error) return trimmed
      toast.show({ variant: "error", message: error })
    }
  }

  const promptOptional = async (title: string, placeholder: string) => {
    const value = await DialogPrompt.show(dialog, title, { placeholder })
    if (value === null) return
    return value.trim()
  }

  const configureCustomProvider = async () => {
    const providerID = await promptRequired("Custom provider ID", "my-provider", (value) => {
      if (!/^[a-z0-9][a-z0-9-_]*$/.test(value)) return "Use lowercase letters, numbers, hyphen, or underscore"
      if (
        sync.data.provider_next.all.some((provider) => provider.id === value) &&
        !sync.data.config.disabled_providers?.includes(value)
      )
        return "Provider ID already exists"
    })
    if (!providerID) return

    const name = await promptRequired("Custom provider name", "My Provider")
    if (!name) return

    const baseURL = await promptRequired("Base URL", "https://api.example.com/v1", (value) => {
      if (!/^https?:\/\//.test(value)) return "Base URL must start with http:// or https://"
    })
    if (!baseURL) return

    const apiKey = await promptOptional("API key", "sk-... or {env:MY_API_KEY}")
    if (apiKey === undefined) return

    const modelInput = await promptRequired("Model IDs", "model-a, model-b")
    if (!modelInput) return

    const models = [...new Set(modelInput.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))]
    if (models.length === 0) {
      toast.show({ variant: "error", message: "At least one model ID is required" })
      return
    }

    const headerInput = await promptOptional("Headers", "Header-Name=value, one per line")
    if (headerInput === undefined) return

    const headerRows = headerInput.split(/\n+/).map((item) => item.trim()).filter(Boolean)
    const headers = Object.fromEntries(
      headerRows.flatMap((row) => {
        const match = row.match(/^([^:=]+)[:=](.+)$/)
        if (!match) return []
        return [[match[1].trim(), match[2].trim()]]
      }),
    )
    if (headerRows.length !== Object.keys(headers).length) {
      toast.show({ variant: "error", message: "Headers must use Header-Name=value or Header-Name: value" })
      return
    }

    const env = apiKey.match(/^\{env:([^}]+)\}$/)?.[1]?.trim()
    if (apiKey && !env) {
      await sdk.client.auth.set({
        providerID,
        auth: {
          type: "api",
          key: apiKey,
        },
      })
    }
    await sdk.client.global.config.update(
      {
        config: {
          provider: {
            [providerID]: {
              npm: "@ai-sdk/openai-compatible",
              name,
              ...(env ? { env: [env] } : {}),
              options: {
                baseURL,
                ...(Object.keys(headers).length ? { headers } : {}),
              },
              models: Object.fromEntries(models.map((model) => [model, { name: model }])),
            },
          },
          disabled_providers: (sync.data.config.disabled_providers ?? []).filter((id) => id !== providerID),
        },
      },
      { throwOnError: true },
    )
    await sdk.client.instance.dispose()
    await sync.bootstrap()
    toast.show({ variant: "success", message: `Configured ${name}` })
    dialog.replace(() => <DialogModel providerID={providerID} />)
  }

  const options = createMemo(() => {
    const connected = sync.data.provider_next.connected.includes(CXMT_CIMI_PROVIDER_ID)
    const customConnected = sync.data.provider.some((provider) => isCustomProvider(provider.id, sync.data.config))

    const editOptions = onboarded()
      ? sync.data.provider
          .filter((provider) => isEditableProvider(provider.id, sync.data.config))
          .map((provider) => ({
            title: provider.name ?? provider.id,
            value: `edit:${provider.id}`,
            description: "Edit models",
            category: "Edit models",
            onSelect() {
              dialog.replace(() => <DialogModelEdit providerID={provider.id} />)
            },
          }))
      : []

    return [
      {
        title: CXMT_CIMI_PROVIDER_NAME,
        value: CXMT_CIMI_PROVIDER_ID,
        description: "Recommended preset",
        category: "Popular",
        gutter: connected && onboarded() ? <text fg={theme.success}>connected</text> : undefined,
        onSelect() {
          dialog.replace(() => <CxmtCimiModelSelect />)
        },
      },
      {
        title: "Custom provider",
        value: "_custom",
        description: "OpenAI-compatible",
        category: "Other",
        gutter: customConnected && onboarded() ? <text fg={theme.success}>connected</text> : undefined,
        onSelect() {
          void configureCustomProvider()
        },
      },
      ...editOptions,
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
      description: `${model.provider} - ${(model.limit.context / 1000).toFixed(0)}K context`,
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
