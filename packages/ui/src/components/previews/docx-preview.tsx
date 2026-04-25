import { createEffect, createSignal, Show } from "solid-js"
import { renderAsync } from "docx-preview"

interface DocxPreviewProps {
  data: string | undefined // base64
  path?: string
  onLoad?: () => void
  onError?: () => void
}

export function DocxPreview(props: DocxPreviewProps) {
  let containerRef: HTMLDivElement | undefined
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal(false)
  const [rendered, setRendered] = createSignal(false)

  const renderDocx = async (data: string) => {
    if (!containerRef) {
      // 容器还没准备好，延迟重试
      setTimeout(() => renderDocx(data), 50)
      return
    }

    try {
      setLoading(true)
      setError(false)
      setRendered(false)

      // 处理data URL前缀
      let base64Data = data
      if (data.startsWith("data:")) {
        const base64Start = data.indexOf("base64,")
        if (base64Start !== -1) {
          base64Data = data.substring(base64Start + 7)
        }
      }

      // 将 base64 转换为 Uint8Array
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // 清除之前的内容
      containerRef.innerHTML = ""

      await renderAsync(bytes, containerRef, undefined, {
        className: "docx-preview-wrapper",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      })

      // 渲染后移除 wrapper 的 padding 和 margin，并修复宽度溢出问题
      const wrapper = containerRef.querySelector(".docx-preview-wrapper-wrapper") as HTMLElement
      if (wrapper) {
        wrapper.style.padding = "0"
        wrapper.style.margin = "0"
        wrapper.style.overflow = "visible"
        wrapper.style.width = "fit-content"
      }

      // 移除 docx-preview-wrapper 的 margin-bottom
      const previewWrapper = containerRef.querySelector(".docx-preview-wrapper") as HTMLElement
      if (previewWrapper) {
        previewWrapper.style.marginBottom = "0"
      }

      setLoading(false)
      setRendered(true)
      props.onLoad?.()
    } catch (err) {
      console.error("DOCX render error:", err)
      setError(true)
      setLoading(false)
      props.onError?.()
    }
  }

  createEffect(() => {
    if (props.data) {
      renderDocx(props.data)
    }
  })

  return (
    <div class="flex flex-col items-center w-full">
      <Show when={loading() && !rendered()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Loading document...</div>
      </Show>
      <Show when={error()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Failed to load document</div>
      </Show>
      {/* 容器始终存在 */}
      <div
        ref={containerRef}
        class="h-full rounded border border-border-weak-base bg-white w-full"
        style={{ display: rendered() ? "block" : "none" }}
      />
    </div>
  )
}