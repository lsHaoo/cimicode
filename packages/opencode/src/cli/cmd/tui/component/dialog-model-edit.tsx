import { createMemo, createSignal } from "solid-js"
import { useSync } from "@tui/context/sync"
import { useSDK } from "@tui/context/sdk"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "../ui/toast"
import { DialogPrompt } from "../ui/dialog-prompt"
import { Keybind } from "@/util/keybind"
import { entries, sortBy, pipe } from "remeda"
import type { Config } from "@opencode-ai/sdk/v2"

export function DialogModelEdit(props: { providerID: string }) {
  const sync = useSync()
  const sdk = useSDK()
  const dialog = useDialog()
  const toast = useToast()
  const [loading, setLoading] = createSignal(false)

  const provider = createMemo(() => sync.data.provider.find((x) => x.id === props.providerID))
  const providerConfig = createMemo(() => sync.data.config.provider?.[props.providerID])

  const modelEntries = createMemo(() => {
    const models = providerConfig()?.models
    if (!models) return []
    return pipe(
      entries(models),
      sortBy(([key]) => key),
    )
  })

  async function updateModels(models: NonNullable<Config["provider"]>[string]["models"]) {
    setLoading(true)
    try {
      await sdk.client.global.config.update(
        {
          config: {
            provider: {
              [props.providerID]: {
                models,
              },
            },
          },
        },
        { throwOnError: true },
      )
      await sdk.client.instance.dispose()
      await sync.bootstrap()
      toast.show({ variant: "success", message: "Models updated" })
    } catch (e) {
      toast.show({ variant: "error", message: e instanceof Error ? e.message : "Failed to update models" })
    } finally {
      setLoading(false)
    }
  }

  async function addModel() {
    const modelID = await DialogPrompt.show(dialog, "Model ID", { placeholder: "model-name" })
    if (!modelID) return
    if (providerConfig()?.models?.[modelID]) {
      toast.show({ variant: "error", message: "Model ID already exists" })
      return
    }
    const name = await DialogPrompt.show(dialog, "Model display name (optional)", {
      placeholder: modelID,
    })
    if (name === undefined) return
    const models = { ...providerConfig()?.models, [modelID]: { name: name || modelID } }
    await updateModels(models)
  }

  async function removeModel(modelID: string) {
    const confirmed = await DialogPrompt.show(dialog, `Remove model "${modelID}"?`, {
      placeholder: "Type yes to confirm",
    })
    if (confirmed?.toLowerCase() !== "yes") return
    const models = { ...providerConfig()?.models }
    delete models[modelID]
    await updateModels(models)
  }

  async function renameModel(modelID: string, currentName?: string) {
    const newName = await DialogPrompt.show(dialog, `Rename model "${modelID}"`, {
      placeholder: currentName ?? modelID,
      value: currentName ?? modelID,
    })
    if (!newName || newName === currentName) return
    const models = { ...providerConfig()?.models }
    if (models[modelID]) {
      models[modelID] = { ...models[modelID], name: newName }
    }
    await updateModels(models)
  }

  const options = createMemo(() => {
    if (!provider()) return []

    const modelOpts: DialogSelectOption<string>[] = modelEntries().map(([modelID, info]) => ({
      value: modelID,
      title: info.name ?? modelID,
      description: info.name && info.name !== modelID ? modelID : undefined,
      category: "Models",
    }))

    const addOption: DialogSelectOption<string> = {
      value: "__add",
      title: "Add model...",
      category: "Actions",
      onSelect: () => {
        if (!loading()) void addModel()
      },
    }

    return [...modelOpts, addOption]
  })

  return (
    <DialogSelect<string>
      title={`Edit models — ${provider()?.name ?? props.providerID}`}
      options={options()}
      keybind={[
        {
          keybind: Keybind.parse("d")[0],
          title: "Delete",
          disabled: loading(),
          onTrigger: (option) => {
            if (option.value === "__add") return
            void removeModel(option.value)
          },
        },
        {
          keybind: Keybind.parse("e")[0],
          title: "Rename",
          disabled: loading(),
          onTrigger: (option) => {
            if (option.value === "__add") return
            const info = providerConfig()?.models?.[option.value]
            void renameModel(option.value, info?.name)
          },
        },
      ]}
      flat={true}
    />
  )
}
