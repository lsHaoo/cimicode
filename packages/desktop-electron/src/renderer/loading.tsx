import { MetaProvider } from "@solidjs/meta"
import { render } from "solid-js/web"
import "@opencode-ai/app/index.css"
import { Font } from "@opencode-ai/ui/font"
import "./styles.css"
import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import type { InitStep, SqliteMigrationProgress } from "../preload/types"

const root = document.getElementById("root")!
const lines = ["Just a moment...", "Migrating your database", "This may take a couple of minutes"]
const delays = [3000, 9000]
const tone = "#1677ff"
const LOGO_URL = "https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-icon_beta.svg"

function Mark(props: { done: boolean }) {
  const [err, setErr] = createSignal(false)

  return (
    <div
      class="relative grid h-16 w-16 place-items-center overflow-hidden rounded-[1.25rem] border"
      style={{
        border: `1px solid ${props.done ? `${tone}55` : `${tone}38`}`,
        background: `linear-gradient(145deg, ${tone}26, rgba(255, 255, 255, 0.78))`,
        "box-shadow": `inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 10px 24px ${tone}14`,
      }}
    >
      <span
        class="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${tone}2b, transparent 70%)`,
          animation: props.done ? undefined : "oc-loading-pulse 1.8s ease-in-out infinite",
        }}
      />
      <span
        class="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 34%, ${tone}12)`,
        }}
      />
      <Show
        when={!err()}
        fallback={
          <span class="relative z-[1] text-[1.35rem] font-semibold leading-none" style={{ color: tone }}>
            C
          </span>
        }
      >
        <img
          src={LOGO_URL}
          alt="Cimi"
          class="absolute inset-0 z-[1] h-16 w-16 rounded-[1.25rem]"
          style={{
            "object-fit": "cover",
            filter: `drop-shadow(0 10px 20px ${tone}26)`,
          }}
          onError={() => setErr(true)}
        />
      </Show>
    </div>
  )
}

render(() => {
  const [step, setStep] = createSignal<InitStep | null>(null)
  const [line, setLine] = createSignal(0)
  const [percent, setPercent] = createSignal(0)

  const phase = createMemo(() => step()?.phase)

  const value = createMemo(() => {
    if (phase() === "done") return 100
    return Math.max(25, Math.min(100, percent()))
  })

  window.api.awaitInitialization((next) => setStep(next as InitStep)).catch(() => undefined)

  onMount(() => {
    setLine(0)
    setPercent(0)

    const timers = delays.map((ms, i) => setTimeout(() => setLine(i + 1), ms))

    const listener = window.api.onSqliteMigrationProgress((progress: SqliteMigrationProgress) => {
      if (progress.type === "InProgress") setPercent(Math.max(0, Math.min(100, progress.value)))
      if (progress.type === "Done") {
        setPercent(100)
        setStep({ phase: "done" })
      }
    })

    onCleanup(() => {
      listener()
      timers.forEach(clearTimeout)
    })
  })

  createEffect(() => {
    if (phase() !== "done") return

    const timer = setTimeout(() => window.api.loadingWindowComplete(), 1000)
    onCleanup(() => clearTimeout(timer))
  })

  const status = createMemo(() => {
    if (phase() === "done") return "All done"
    if (phase() === "sqlite_waiting") return lines[line()]
    return "Just a moment..."
  })

  const note = createMemo(() => {
    if (phase() === "done") return "The desktop workspace is ready. Switching to the main window."
    if (phase() === "sqlite_waiting") return "Preparing local data and applying any required migrations."
    return "Connecting local services and warming up the desktop shell."
  })

  return (
    <MetaProvider>
      <div class="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background-base text-text-strong">
        <Font />
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
        `}</style>
        <div
          class="pointer-events-none absolute -right-28 -top-36 h-[28rem] w-[28rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${tone}33 0%, transparent 68%)` }}
        />
        <div
          class="pointer-events-none absolute -bottom-36 -left-24 h-[24rem] w-[24rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${tone}1f 0%, transparent 72%)` }}
        />
        <div
          class="relative w-full max-w-[32rem] rounded-[1.75rem] border p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]"
          style={{
            border: `1px solid ${tone}2e`,
            background: `linear-gradient(180deg, color-mix(in srgb, var(--background-base) 82%, white 18%), color-mix(in srgb, var(--background-base) 92%, ${tone} 8%))`,
            "box-shadow": "0 24px 60px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
          }}
        >
          <div class="flex items-center gap-4">
            <Mark done={phase() === "done"} />
            <div>
              <div class="text-[0.72rem] tracking-[0.14em] text-text-weak">Cimi Desktop</div>
              <div class="mt-1 text-[1.45rem] font-semibold leading-tight">Preparing local workspace</div>
            </div>
          </div>

          <div class="mt-8" aria-live="polite" aria-atomic="true">
            <div class="flex items-center justify-between gap-4">
              <span
                class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[1rem] font-medium leading-6"
                style={{ color: `color-mix(in srgb, var(--text-strong) 76%, ${tone} 24%)` }}
              >
                {status()}
              </span>
              <span class="shrink-0 text-[0.78rem] font-medium text-text-weak">{Math.round(value())}%</span>
            </div>
            <p class="mt-2 text-[0.83rem] leading-6 text-text-weak">{note()}</p>
            <div
              class="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-weak"
              role="progressbar"
              aria-label="Database migration progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(value())}
            >
              <div
                class="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${value()}%`,
                  background: `linear-gradient(90deg, ${tone}b8, ${tone})`,
                  "box-shadow": `0 0 24px ${tone}55`,
                }}
              />
            </div>
            <div class="mt-6 flex items-center justify-between text-[0.75rem] leading-5 text-text-weak">
              <span>Local services</span>
              <span>SQLite migration</span>
              <span>Desktop shell</span>
            </div>
          </div>
        </div>
      </div>
    </MetaProvider>
  )
}, root)
