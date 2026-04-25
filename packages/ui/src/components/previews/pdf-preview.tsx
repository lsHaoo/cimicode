import { createEffect, createSignal, Show } from "solid-js"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

// 设置 worker（仅在浏览器环境）
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href
}

interface PdfPreviewProps {
  data: string | undefined // base64
  path?: string
  onLoad?: () => void
  onError?: () => void
}

export function PdfPreview(props: PdfPreviewProps) {
  let containerRef: HTMLDivElement | undefined
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal(false)
  const [currentPage, setCurrentPage] = createSignal(1)
  const [totalPages, setTotalPages] = createSignal(0)
  const [scale, setScale] = createSignal(1.2)
  const [pdfDoc, setPdfDoc] = createSignal<pdfjsLib.PDFDocumentProxy | null>(null)

  const renderPage = async (pageNum: number) => {
    const doc = pdfDoc()
    if (!doc || !containerRef) return

    // 清除之前的页面
    containerRef.innerHTML = ""

    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: scale() })

    // 创建 canvas
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.height = viewport.height
    canvas.width = viewport.width
    canvas.style.maxWidth = "100%"
    canvas.style.height = "auto"

    containerRef.appendChild(canvas)

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise

    props.onLoad?.()
  }

  createEffect(() => {
    if (!props.data) return

    const loadPdf = async () => {
      try {
        setLoading(true)
        setError(false)

        // 将 base64 转换为 Uint8Array
        let pdfData: Uint8Array
        if (props.data!.startsWith("data:")) {
          // data URL 格式
          const response = await fetch(props.data!)
          pdfData = new Uint8Array(await response.arrayBuffer())
        } else {
          // 纯 base64
          const binaryString = atob(props.data!)
          pdfData = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            pdfData[i] = binaryString.charCodeAt(i)
          }
        }

        const loadingTask = pdfjsLib.getDocument({
          data: pdfData,
          // 禁用外部字体加载，确保离线可用
          useWorkerFetch: false,
          isEvalSupported: false,
          disableFontFace: true,
        })
        const doc = await loadingTask.promise
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
        setLoading(false)
      } catch (err) {
        setError(true)
        setLoading(false)
        props.onError?.()
      }
    }

    loadPdf()
  })

  createEffect(() => {
    const doc = pdfDoc()
    if (doc) {
      renderPage(currentPage())
    }
  })

  // 重新渲染当前页当缩放改变
  createEffect(() => {
    scale() // 触发依赖
    const doc = pdfDoc()
    if (doc && !loading()) {
      renderPage(currentPage())
    }
  })

  return (
    <div class="flex flex-col items-center gap-4">
      <Show when={loading()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Loading PDF...</div>
      </Show>
      <Show when={error()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Failed to load PDF</div>
      </Show>
      <Show when={!loading() && !error()}>
        <div class="flex items-center gap-2">
          <button
            class="rounded px-2 py-1 text-sm bg-background-stronger hover:bg-background-strong disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage() === 1}
          >
            Previous
          </button>
          <span class="text-sm text-text-weak">
            {currentPage()} / {totalPages()}
          </span>
          <button
            class="rounded px-2 py-1 text-sm bg-background-stronger hover:bg-background-strong disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
            disabled={currentPage() === totalPages()}
          >
            Next
          </button>
          <span class="mx-2 text-text-weak">|</span>
          <button
            class="rounded px-2 py-1 text-sm bg-background-stronger hover:bg-background-strong"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          >
            -
          </button>
          <span class="text-sm text-text-weak">{Math.round(scale() * 100)}%</span>
          <button
            class="rounded px-2 py-1 text-sm bg-background-stronger hover:bg-background-strong"
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          >
            +
          </button>
        </div>
        <div
          ref={containerRef}
          class="overflow-auto h-full rounded border border-border-weak-base bg-white"
        />
      </Show>
    </div>
  )
}