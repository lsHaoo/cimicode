import { Button } from "@opencode-ai/ui/button"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { Show, onMount, createEffect } from "solid-js"
import { usePresetModels, type PresetModel } from "@/hooks/use-preset-models"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { createStore } from "solid-js/store"
import { showToast } from "@opencode-ai/ui/toast"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useLocal } from "@/context/local"
import { DialogSelectModel } from "./dialog-select-model"
import { DialogSelectProvider } from "./dialog-select-provider"
import { Spinner } from "@opencode-ai/ui/spinner"

type Props = {
  providerID?: string
}

export function DialogQuickSetupPreset(props: Props) {
  const dialog = useDialog()
  const presetModels = usePresetModels()
  const globalSDK = useGlobalSDK()
  const globalSync = useGlobalSync()

  // 编辑模式：获取当前配置
  const editingProvider = () => {
    if (!props.providerID) return undefined
    return globalSync.data.config.provider?.[props.providerID]
  }

  const currentModelName = () => {
    const provider = editingProvider()
    if (!provider) return undefined
    const models = Object.keys(provider.models || {})
    return models[0] // CXMT Cimi只有一个模型
  }

  const isEditMode = () => !!props.providerID

  // 每次打开对话框时自动刷新数据
  onMount(() => {
    presetModels.retryLoad()
  })

  // 编辑模式：自动设置当前模型
  createEffect(() => {
    if (isEditMode() && currentModelName() && !form.selectedModel) {
      const modelName = currentModelName()
      const matchedModel = presetModels.models().find(m => m.name === modelName)
      if (matchedModel) {
        setForm("selectedModel", matchedModel)
      }
    }
  })

  const [form, setForm] = createStore({
    selectedModel: null as PresetModel | null,
    apiKey: "",
    error: "",
    submitting: false,
    closeAllOnSubmit: false,
  })

  const handleSelectModel = (model: PresetModel) => {
    setForm("selectedModel", model)
    setForm("error", "")
  }

  const handleBack = () => {
    if (form.selectedModel) {
      setForm("selectedModel", null)
      setForm("apiKey", "")
      setForm("error", "")
    } else {
      dialog.close()
      setTimeout(() => {
        dialog.show(() => <DialogSelectProvider />)
      }, 100)
    }
  }

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!form.selectedModel) {
      setForm("error", "请选择一个模型")
      return
    }

    if (!form.apiKey.trim()) {
      setForm("error", "请输入API Key")
      return
    }

    setForm("submitting", true)
    setForm("error", "")

    // 在编辑模式下，设置标记表示需要关闭所有弹框
    if (isEditMode()) {
      setForm("closeAllOnSubmit", true)
    }

    try {
      const model = form.selectedModel
      const providerID = props.providerID || (model.provider || "cimimi").toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

      // 更新API Key
      await globalSDK.client.auth.set({
        providerID,
        auth: {
          type: "api",
          key: form.apiKey.trim(),
        },
      })

      // 然后更新配置
      await globalSync.updateConfig({
        provider: {
          [providerID]: {
            npm: "@ai-sdk/openai-compatible",
            name: model.provider || model.name,
            options: {
              baseURL: model.url,
            },
            models: {
              [model.name]: {
                name: model.name,
                limit: model.limit,
              },
            },
          },
        },
        disabled_providers: globalSync.data.config.disabled_providers?.filter(id => id !== providerID) ?? [],
      })

      // 先关闭对话框
      dialog.close()

      // 在编辑模式下，强制关闭所有可能的对话框
      if (form.closeAllOnSubmit) {
        // 使用递归调用来确保关闭所有对话框堆栈
        const closeAllDialogs = (count = 0) => {
          if (count > 5) return // 最多尝试5次
          dialog.close()
          setTimeout(() => closeAllDialogs(count + 1), 50)
        }
        closeAllDialogs()
      }

      showToast({
        variant: "success",
        icon: "circle-check",
        title: isEditMode() ? "模型更新成功" : "模型配置成功",
        description: `已成功${isEditMode() ? "更新" : "配置"} ${model.name}`,
      })

      // 检查是否在 LocalProvider 上下文中
      // 如果不在，则不显示模型选择对话框
      let canShowModelDialog = false
      try {
        useLocal()
        canShowModelDialog = true
      } catch (error) {
        // 不在 LocalProvider 上下文中，跳过模型选择对话框
        console.log("Not in LocalProvider context, skipping model selection dialog")
      }

      // 只在新建模式下且在 LocalProvider 上下文中显示选择模型对话框
      if (!isEditMode() && canShowModelDialog) {
        setTimeout(() => {
          dialog.show(() => <DialogSelectModel />)
        }, 150)
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "配置失败，请重试"
      setForm("error", message)
    } finally {
      setForm("submitting", false)
    }
  }

  return (
    <Dialog
      title={
        <IconButton
          tabIndex={-1}
          icon="arrow-left"
          variant="ghost"
          onClick={handleBack}
          aria-label="返回"
        />
      }
      {...(!form.selectedModel && {
        titleButton: (
          <Button
            variant="ghost"
            size="small"
            icon="refresh"
            onClick={() => presetModels.retryLoad()}
          >
            刷新
          </Button>
        )
      })}
    >
      <Show
        when={!form.selectedModel}
        fallback={
          <div class="flex flex-col gap-6 px-6 pt-2 pb-4">
            {/* 模型信息 */}
            <div class="flex items-start gap-3">
              <ProviderIcon id="synthetic" class="size-5 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <div class="text-13-regular text-text-weak mb-3">{isEditMode() ? "编辑模型" : "配置模型"}</div>

                <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <div class="text-12-regular text-text-weak">供应商名称</div>
                    <div class="text-15-regular text-text-strong">{form.selectedModel?.provider}</div>
                  </div>

                  <div>
                    <div class="text-12-regular text-text-weak">供应商ID</div>
                    <div class="text-15-regular text-text-strong">{props.providerID || (form.selectedModel?.provider || "cimimi").toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}</div>
                  </div>

                  <div>
                    <div class="text-12-regular text-text-weak">模型名称</div>
                    <div class="text-15-medium text-text-strong">{form.selectedModel?.name}</div>
                  </div>

                  <div>
                    <div class="text-12-regular text-text-weak">API 地址</div>
                    <div class="text-15-regular text-text-strong break-all">{form.selectedModel?.url}</div>
                  </div>

                  <div>
                    <div class="text-12-regular text-text-weak">输入</div>
                    <div class="text-15-regular text-text-strong">{form.selectedModel?.limit?.context?.toLocaleString() || 'N/A'} tokens</div>
                  </div>

                  <div>
                    <div class="text-12-regular text-text-weak">输出</div>
                    <div class="text-15-regular text-text-strong">{form.selectedModel?.limit?.output?.toLocaleString() || 'N/A'} tokens</div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key 表单 */}
            <form onSubmit={handleSubmit} class="flex flex-col gap-4">
              <TextField
                autofocus
                type="text"
                label="API Key"
                placeholder="输入您的 API Key"
                value={form.apiKey}
                onChange={(v) => setForm("apiKey", v)}
                validationState={form.error ? "invalid" : undefined}
                error={form.error}
                disabled={form.submitting}
              />

              <div class="flex justify-start">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  disabled={form.submitting}
                >
                  <Show when={form.submitting} fallback="提交">
                    <Spinner class="size-4" />
                  </Show>
                </Button>
              </div>
            </form>
          </div>
        }
      >
        <Show
          when={presetModels.loading()}
          fallback={
            <Show
              when={presetModels.models().length > 0}
              fallback={
                <div class="flex flex-col items-center justify-center py-20 px-6">
                  <div class="text-15-regular text-text-strong mb-2">无法加载模型列表</div>
                  <div class="text-13-regular text-text-weak mb-6">
                    {presetModels.useFallback()
                      ? `使用 ${presetModels.models().length} 个内置模型`
                      : "请检查网络连接"}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => presetModels.retryLoad()}
                  >
                    重试
                  </Button>
                </div>
              }
            >
              <List
                class="flex-1 min-h-0 [&_[data-slot=list-scroll]]:flex-1 [&_[data-slot=list-scroll]]:min-h-0"
                search={{ placeholder: "搜索模型...", autofocus: true }}
                emptyMessage="暂无可用模型"
                key={(x: PresetModel) => x.name}
                items={presetModels.models()}
                filterKeys={["name", "provider"]}
                sortBy={(a: PresetModel, b: PresetModel) => a.name.localeCompare(b.name)}
                onSelect={(item: PresetModel | undefined) => item && handleSelectModel(item)}
              >
                {(model: PresetModel) => (
                  <div class="w-full flex items-center gap-x-2">
                    <ProviderIcon data-slot="list-item-extra-icon" id="synthetic" />
                    <span class="truncate">{model.name}</span>
                    <div class="ml-auto text-12-regular text-text-weak">
                      {model.provider} · {(model.limit.context / 1000).toFixed(0)}K
                    </div>
                  </div>
                )}
              </List>
            </Show>
          }
        >
          <div class="flex items-center justify-center py-16">
            <div class="flex flex-col items-center gap-4">
              <Spinner class="size-8" />
              <div class="text-14-regular text-text-weak">正在加载模型列表...</div>
            </div>
          </div>
        </Show>
      </Show>
    </Dialog>
  )
}
