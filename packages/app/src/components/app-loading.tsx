import { Spinner } from "@opencode-ai/ui/spinner"
import { Show, createSignal, onMount } from "solid-js"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { WindowControls } from "./window-controls"

type Props = {
  controls?: boolean
  title?: string
  note?: string
  hide?: boolean
}

type Win = Window & {
  hideLoadingScreen?: () => void
}

const LOGO_URL = "https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-icon_beta.svg"

const tone = "#1677ff"

export function AppLogo(props: { class?: string }) {
  const [err, setErr] = createSignal(false)

  return (
    <Show
      when={!err()}
      fallback={
        <div
          class={props.class}
          classList={{
            "grid place-items-center rounded-2xl bg-surface-weak text-24-medium text-text-strong": true,
          }}
        >
          C
        </div>
      }
    >
      <img src={LOGO_URL} alt="Cimi" class={props.class} onError={() => setErr(true)} />
    </Show>
  )
}

function Mark() {
  return (
    <div
      class="relative grid size-16 place-items-center overflow-hidden rounded-[1.25rem] border"
      style={{
        border: `1px solid ${tone}38`,
        background: `linear-gradient(145deg, ${tone}26, rgba(255, 255, 255, 0.78))`,
        "box-shadow": `inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 10px 24px ${tone}14`,
      }}
    >
      <span
        class="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${tone}2b, transparent 70%)`,
          animation: "oc-loading-pulse 1.8s ease-in-out infinite",
        }}
      />
      <span
        class="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 34%, ${tone}12)`,
        }}
      />
      <AppLogo class="absolute inset-0 z-[1] size-16 rounded-[1.25rem] object-cover" />
    </div>
  )
}

export function AppLoading(props: Props) {
  const language = useLanguage()
  const platform = usePlatform()
  const title = () => props.title ?? `${language.t("common.loading")}${language.t("common.loading.ellipsis")}`

  onMount(() => {
    if (props.hide === false) return
    requestAnimationFrame(() => {
      ;(window as Win).hideLoadingScreen?.()
    })
  })

  if (platform.platform === "web") {
    return (
      <div class="flex size-full min-h-0 items-center justify-center bg-background-base px-6 text-text-strong">
        <div class="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <Spinner class="size-8 text-icon-base" />
          <div class="text-[1.05rem] font-medium leading-6">{title()}</div>
          <Show when={props.note}>{(note) => <p class="text-[0.83rem] leading-6 text-text-weak">{note()}</p>}</Show>
        </div>
      </div>
    )
  }

  return (
    <div class="relative size-full min-h-0 overflow-hidden bg-background-base text-text-strong">
      <Show when={props.controls}>
        <WindowControls class="absolute right-0 top-0 z-10 flex items-center" />
      </Show>
      <style>{`
        @keyframes oc-loading-pulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.72;
          }

          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }

        @keyframes oc-loading-slide {
          0% {
            transform: translateX(0%);
          }

          100% {
            transform: translateX(320%);
          }
        }
      `}</style>
      <div
        class="pointer-events-none absolute -right-28 -top-36 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${tone}33 0%, transparent 68%)`,
        }}
      />
      <div
        class="pointer-events-none absolute -bottom-36 -left-24 h-[24rem] w-[24rem] rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${tone}1f 0%, transparent 72%)`,
        }}
      />
      <div class="relative flex h-full items-center justify-center p-6">
        <div
          class="relative w-full max-w-[30rem] overflow-hidden rounded-[1.5rem] border p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]"
          style={{
            border: `1px solid ${tone}2e`,
            background: `linear-gradient(180deg, color-mix(in srgb, var(--background-base) 82%, white 18%), color-mix(in srgb, var(--background-base) 92%, ${tone} 8%))`,
            "box-shadow": `0 24px 60px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)`,
          }}
        >
          <div
            class="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: "linear-gradient(135deg, rgba(22, 119, 255, 0.12), transparent 44%)",
            }}
          />
          <div class="relative flex items-center gap-3">
            <Mark />
            <div>
              <div class="text-[0.72rem] tracking-[0.14em] text-text-weak">{language.t("app.name.desktop")}</div>
              <div class="mt-1 text-[1.3rem] font-semibold leading-tight text-text-strong">{title()}</div>
            </div>
          </div>

          <div class="relative mt-7" aria-live="polite" aria-atomic="true">
            <Show when={props.note}>
              {(note) => <p class="mt-0 text-[0.83rem] leading-6 text-text-weak">{note()}</p>}
            </Show>
            <div class="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-weak" aria-hidden="true">
              <div
                class="h-full w-[35%] rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${tone}00, ${tone}cc, ${tone}00)`,
                  animation: "oc-loading-slide 1.35s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
