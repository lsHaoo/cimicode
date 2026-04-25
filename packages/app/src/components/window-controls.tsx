import { Show, createMemo, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { usePlatform } from "@/context/platform"

type Win = {
  close?: () => Promise<void>
  isMaximized?: () => Promise<boolean>
  minimize?: () => Promise<void>
  onResized?: (cb: () => void) => Promise<() => void>
  toggleMaximize?: () => Promise<void>
}

type Tauri = {
  window?: {
    getCurrentWindow?: () => Win
  }
}

const tauri = () => (window as unknown as { __TAURI__?: Tauri }).__TAURI__
const current = () => tauri()?.window?.getCurrentWindow?.()

export function WindowControls(props: { class?: string }) {
  const platform = usePlatform()
  const show = createMemo(() => platform.platform === "desktop" && platform.os === "windows")
  const native = createMemo(() => !!tauri())
  const [state, setState] = createStore({ max: false })

  onMount(() => {
    if (!show()) return

    const win = current()
    if (!win?.isMaximized) return

    let off: (() => void) | undefined
    const sync = () => {
      void win
        .isMaximized?.()
        .then((max) => setState("max", !!max))
        .catch(() => undefined)
    }
    const listen = win.onResized?.(sync)

    sync()
    if (listen) {
      void listen
        .then((next) => {
          off = next
        })
        .catch(() => undefined)
    }

    onCleanup(() => off?.())
  })

  const min = () => {
    const win = current()
    if (!win?.minimize) return
    void win.minimize().catch(() => undefined)
  }

  const max = () => {
    const win = current()
    if (!win?.toggleMaximize) return
    void win.toggleMaximize().catch(() => undefined)
  }

  const close = () => {
    const win = current()
    if (!win?.close) return
    void win.close().catch(() => undefined)
  }

  return (
    <Show when={show()}>
      <div class={props.class ?? "flex items-center gap-1"}>
        <Show
          when={native()}
          fallback={
            <>
              <button
                class="h-10 w-[46px] cursor-pointer border-0 bg-transparent text-text-base transition-colors hover:bg-hover-bg"
                onClick={min}
                aria-label="最小化"
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
                  <line x1="2" y1="6" x2="10" y2="6" />
                </svg>
              </button>
              <button
                class="h-10 w-[46px] cursor-pointer border-0 bg-transparent text-text-base transition-colors hover:bg-hover-bg"
                onClick={max}
                aria-label={state.max ? "还原" : "最大化"}
              >
                <Show
                  when={state.max}
                  fallback={
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="2" y="2" width="8" height="8" />
                    </svg>
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="1" width="8" height="8" />
                    <rect x="1" y="3" width="8" height="8" fill="white" stroke="currentColor" />
                  </svg>
                </Show>
              </button>
              <button
                class="h-10 w-[46px] cursor-pointer border-0 bg-transparent text-text-base transition-colors hover:bg-hover-bg"
                onClick={close}
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M3 3L9 9M3 9L9 3" />
                </svg>
              </button>
            </>
          }
        >
          <div data-tauri-decorum-tb class="flex flex-row" />
        </Show>
      </div>
    </Show>
  )
}
