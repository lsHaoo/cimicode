import { Button } from "@opencode-ai/ui/button"
import { createMediaQuery } from "@solid-primitives/media"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { createMemo, createSignal, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { DialogUploadFile } from "./dialog-upload-file"
import { DialogDownloadFile } from "./dialog-download-file"

export function WebFileTransfer(props: { restart?: () => void }) {
  const language = useLanguage()
  const platform = usePlatform()
  const dialog = useDialog()
  const desktop = createMediaQuery("(min-width: 768px)")

  const isWeb = () => platform.platform === "web"
  const [mounted, setMounted] = createSignal(false)

  onMount(() => {
    setMounted(true)
  })

  const target = createMemo(() => {
    if (!mounted() || typeof document !== "object") return null
    const id = isWeb() && desktop() ? "opencode-project-row-left" : "opencode-titlebar-right"
    return document.getElementById(id)
  })

  const upload = () => {
    dialog.show(() => <DialogUploadFile />)
  }

  const download = () => {
    dialog.show(() => <DialogDownloadFile />)
  }

  return (
    <Show when={isWeb() && target()}>
      {(node) => (
        <Portal mount={node()}>
          <div class="order-first flex items-center gap-1 shrink-0">
            <Show when={false}>
              <Tooltip placement="bottom" value={language.t("webFileTransfer.upload.tooltip")}>
                <Button
                  variant="ghost"
                  class="titlebar-icon w-8 h-6 p-0 box-border shrink-0"
                  onClick={upload}
                  aria-label={language.t("webFileTransfer.upload.tooltip")}
                >
                  <Icon size="small" name="cloud-upload" />
                </Button>
              </Tooltip>
            </Show>
            <Show when={props.restart}>
              {(restart) => (
                <Tooltip placement="bottom" value={language.t("session.header.more.restartService")}>
                  <Button
                    variant="ghost"
                    class="titlebar-icon w-8 h-6 p-0 box-border shrink-0"
                    onClick={restart()}
                    aria-label={language.t("session.header.more.restartService")}
                  >
                    <svg
                      data-slot="icon-svg"
                      viewBox="0 0 1024 1024"
                      class="size-4 text-icon-weak"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M922.208 475.744c-20.48 0-37.12 16.64-37.12 37.12 0 205.376-167.072 372.448-372.448 372.448a374.08 374.08 0 0 1-224.288-75.072h64.608a37.12 37.12 0 0 0 0-74.24H196.96c-20.48 0-37.12 16.64-37.12 37.12v148.128a37.12 37.12 0 0 0 74.24 0V862.08a447.84 447.84 0 0 0 278.592 97.504 445.184 445.184 0 0 0 315.872-130.816 445.184 445.184 0 0 0 130.816-315.872c0-20.48-16.64-37.12-37.12-37.12z m-512.256-88.704a36.288 36.288 0 0 0-44.896-56.96 234.048 234.048 0 0 0-89.632 184.8c0 129.728 105.536 235.264 235.264 235.264 62.72 0 121.792-24.512 166.272-68.992s68.96-103.52 68.96-166.272a234.048 234.048 0 0 0-89.696-184.832 35.904 35.904 0 0 0-22.432-7.776c-11.2 0-21.568 5.024-28.48 13.792-6.016 7.616-8.672 17.088-7.52 26.72s5.952 18.208 13.568 24.224a161.92 161.92 0 0 1 62.08 127.872c0 89.728-72.992 162.72-162.72 162.72s-162.72-72.992-162.72-162.72a161.92 161.92 0 0 1 62.016-127.84z m102.688-246.624c80.672 0 160.064 26.624 224.288 75.072h-62.336a37.12 37.12 0 0 0 0 74.24h153.76c20.48 0 37.12-16.64 37.12-37.12V104.48a37.12 37.12 0 0 0-74.24 0v59.168a447.84 447.84 0 0 0-278.592-97.504 445.184 445.184 0 0 0-315.872 130.816 445.184 445.184 0 0 0-130.816 315.872 37.12 37.12 0 0 0 74.24 0c0-205.376 167.072-372.448 372.448-372.448z m43.072 356.896v-175.904c0-24.832-20.224-45.056-45.056-45.056s-45.056 20.224-45.056 45.056v175.904c0 24.832 20.224 45.056 45.056 45.056s45.056-20.224 45.056-45.056z"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                </Tooltip>
              )}
            </Show>
            <Tooltip placement="bottom" value={language.t("webFileTransfer.download.tooltip")}>
              <Button
                variant="ghost"
                class="titlebar-icon w-8 h-6 p-0 box-border shrink-0"
                onClick={download}
                aria-label={language.t("webFileTransfer.download.tooltip")}
              >
                <Icon size="small" name="project-space" />
              </Button>
            </Tooltip>
          </div>
        </Portal>
      )}
    </Show>
  )
}
