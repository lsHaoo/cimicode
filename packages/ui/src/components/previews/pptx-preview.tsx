import { createEffect, createSignal, Show, onCleanup } from "solid-js"
import { init } from "pptx-preview"

interface PptxPreviewProps {
  data: string | undefined // base64
  path?: string
  onLoad?: () => void
  onError?: () => void
}

export function PptxPreview(props: PptxPreviewProps) {
  let containerRef: HTMLDivElement | undefined
  let viewerInstance: ReturnType<typeof init> | null = null
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal(false)
  const [slideCount, setSlideCount] = createSignal(0)

  const loadPptx = async (data: string) => {
    if (!containerRef) {
      // 容器还没准备好，延迟重试
      setTimeout(() => loadPptx(data), 50)
      return
    }

    try {
      setLoading(true)
      setError(false)

      // 初始化viewer
      if (!viewerInstance) {
        viewerInstance = init(containerRef, {
          width: 720,
          height: 540,
          mode: "slide",
        })
      }

      const buffer = base64ToArrayBuffer(data)

      await viewerInstance.preview(buffer)
      // 确保 currentIndex 已更新后刷新页码显示
      viewerInstance.currentIndex = 0
      viewerInstance.updatePagination()
      setSlideCount(viewerInstance.slideCount)

      // 设置pptx-preview-wrapper背景色为白色
      const wrapper = containerRef.querySelector(".pptx-preview-wrapper") as HTMLElement
      if (wrapper) {
        wrapper.style.backgroundColor = "white"
      }

      setLoading(false)
      props.onLoad?.()
    } catch (err) {
      console.error("PPTX render error:", err)
      setError(true)
      setLoading(false)
      props.onError?.()
    }
  }

  createEffect(() => {
    if (props.data) {
      loadPptx(props.data)
    }
  })

  onCleanup(() => {
    if (viewerInstance) {
      viewerInstance.destroy()
      viewerInstance = null
    }
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <Show when={loading()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Loading presentation...</div>
      </Show>
      <Show when={error()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Failed to load presentation</div>
      </Show>
      <div
        ref={containerRef}
        class="w-full rounded border border-border-weak-base bg-white"
        style={{ display: loading() || error() ? "none" : "block" }}
      />
      <Show when={!loading() && !error() && slideCount() > 0}>
        <div class="text-xs text-text-weak text-center">
          {slideCount()} slides
        </div>
      </Show>
    </div>
  )
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let data = base64
  if (base64.startsWith("data:")) {
    const idx = base64.indexOf("base64,")
    if (idx !== -1) data = base64.slice(idx + 7)
  }
  const binary = atob(data)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}