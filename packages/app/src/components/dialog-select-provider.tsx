import { Component, Show } from "solid-js"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { Tag } from "@opencode-ai/ui/tag"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { useLanguage } from "@/context/language"
import { DialogCustomProvider } from "./dialog-custom-provider"
import { DialogQuickSetupPreset } from "./dialog-quick-setup-preset"

const CUSTOM_ID = "_custom"
const PRESET_ID = "_preset"

export const DialogSelectProvider: Component = () => {
  const dialog = useDialog()
  const language = useLanguage()

  const customLabel = () => language.t("settings.providers.tag.custom")
  const presetLabel = () => "CXMT Cimi"

  return (
    <Dialog title={language.t("command.provider.connect")} transition>
      <List
        search={{ placeholder: language.t("dialog.provider.search.placeholder"), autofocus: true }}
        emptyMessage={language.t("dialog.provider.empty")}
        activeIcon="plus-small"
        key={(x) => x?.id}
        items={() => {
          language.locale()
          return [
            { id: PRESET_ID, name: presetLabel() },
            { id: CUSTOM_ID, name: customLabel() },
          ]
        }}
        filterKeys={["id", "name"]}
        sortBy={(a, b) => {
          if (a.id === PRESET_ID) return -1
          if (b.id === PRESET_ID) return 1
          if (a.id === CUSTOM_ID) return -1
          if (b.id === CUSTOM_ID) return 1
          return a.name.localeCompare(b.name)
        }}
        onSelect={(x) => {
          if (!x) return
          if (x.id === PRESET_ID) {
            dialog.show(() => <DialogQuickSetupPreset />)
            return
          }
          if (x.id === CUSTOM_ID) dialog.show(() => <DialogCustomProvider back="providers" />)
        }}
      >
        {(i) => (
          <div class="px-1.25 w-full flex items-center gap-x-3">
            <ProviderIcon data-slot="list-item-extra-icon" id="synthetic" />
            <span>{i.name}</span>
            <Show when={i.id === CUSTOM_ID}>
              <Tag>{language.t("settings.providers.tag.custom")}</Tag>
            </Show>
            <Show when={i.id === PRESET_ID}>
              <Tag>Recommended</Tag>
            </Show>
          </div>
        )}
      </List>
    </Dialog>
  )
}
