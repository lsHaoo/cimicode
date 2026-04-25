import { onCleanup, onMount } from "solid-js"
import { showToast } from "@opencode-ai/ui/toast"
import { getFilename } from "@opencode-ai/shared/util/path"
import { usePrompt, type ContentPart, type ImageAttachmentPart } from "@/context/prompt"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"
import { usePlatform } from "@/context/platform"
import { useFile } from "@/context/file"
import { uuid } from "@/utils/uuid"
import { getCursorPosition } from "./editor-dom"
import { attachmentMime } from "./files"
import { normalizePaste, pasteMode } from "./paste"
import { webFileTransferApi } from "@/utils/web-file-transfer"

function dataUrl(file: File, mime: string) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.addEventListener("error", () => resolve(""))
    reader.addEventListener("load", () => {
      const value = typeof reader.result === "string" ? reader.result : ""
      const idx = value.indexOf(",")
      if (idx === -1) {
        resolve(value)
        return
      }
      resolve(`data:${mime};base64,${value.slice(idx + 1)}`)
    })
    reader.readAsDataURL(file)
  })
}

type PromptAttachmentsInput = {
  editor: () => HTMLDivElement | undefined
  isDialogActive: () => boolean
  setDraggingType: (type: "image" | "@mention" | null) => void
  focusEditor: () => void
  addPart: (part: ContentPart) => boolean
  readClipboardImage?: () => Promise<File | null>
  sessionDirectory: string
}

export function createPromptAttachments(input: PromptAttachmentsInput) {
  const prompt = usePrompt()
  const language = useLanguage()
  const server = useServer()
  const platform = usePlatform()
  const files = useFile()

  const warn = () => {
    showToast({
      title: language.t("prompt.toast.pasteUnsupported.title"),
      description: language.t("prompt.toast.pasteUnsupported.description"),
    })
  }

  const add = async (file: File, toast = true) => {
    const mime = await attachmentMime(file)
    if (!mime) {
      if (toast) warn()
      return false
    }

    const editor = input.editor()
    if (!editor) return false

    const url = await dataUrl(file, mime)
    if (!url) return false

    try {
      // Web version: upload to server using /file-manager/upload endpoint
      // Desktop version: use data URL directly
      let serverPath: string | undefined

      if (platform.platform === "web") {
        const currentServer = server.current
        if (!currentServer) {
          if (toast) warn()
          return false
        }

        const projectName = getFilename(input.sessionDirectory)
        const uploadPath = `${projectName}/${file.name}`
        const result = await webFileTransferApi.uploadFile(
          currentServer.http.url,
          file,
          uploadPath,
        )

        if (!result.success || !result.path) {
          if (toast) {
            showToast({
              title: language.t("webFileTransfer.upload.error"),
              description: result.message || "Upload failed",
            })
          }
          return false
        }

        serverPath = result.path

        // Refresh file system after successful upload (web version only)
        files.tree.refresh(input.sessionDirectory)
      }

      const attachment: ImageAttachmentPart = {
        type: "image",
        id: uuid(),
        filename: file.name,
        mime,
        dataUrl: url,
        serverPath,
      }
      const cursor = prompt.cursor() ?? getCursorPosition(editor)
      prompt.set([...prompt.current(), attachment], cursor)

      // Web version: Add @filename reference to message input
      if (platform.platform === "web") {
        const currentPrompt = prompt.current()
        const textParts = currentPrompt.filter((part) => part.type === "text")
        const existingText = textParts.map((part) => part.content).join("")

        const fileReference = existingText.trim() ? `, @${file.name}` : `@${file.name}`

        const filePart: any = {
          type: "file",
          path: file.name,
          content: fileReference,
          start: 0,
          end: fileReference.length,
        }
        ;(filePart as any)._isUploadedReference = true

        input.addPart(filePart)
      }

      return true
    } catch (error) {
      if (toast && platform.platform === "web") {
        showToast({
          title: language.t("webFileTransfer.upload.error"),
          description: error instanceof Error ? error.message : "Upload failed",
        })
      }
      return false
    }
  }

  const addAttachment = (file: File) => add(file)

  const addAttachments = async (fileList: File[], toast = true) => {
    let found = false
    for (const file of fileList) {
      const ok = await add(file, false)
      if (ok) found = true
    }
    if (!found && fileList.length > 0 && toast) warn()
    return found
  }

  const removeAttachment = (id: string) => {
    const current = prompt.current()
    const next = current.filter((part) => part.type !== "image" || part.id !== id)
    prompt.set(next, prompt.cursor())
  }

  const handlePaste = async (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData
    if (!clipboardData) return

    event.preventDefault()
    event.stopPropagation()

    const items = Array.from(clipboardData.items)
    const fileItems = items.filter((item) => item.kind === "file")

    if (fileItems.length > 0) {
      let found = false
      for (const item of fileItems) {
        const file = item.getAsFile()
        if (!file) continue
        const ok = await add(file, false)
        if (ok) found = true
      }
      if (!found) warn()
      return
    }

    const plainText = clipboardData.getData("text/plain") ?? ""

    if (input.readClipboardImage && !plainText) {
      const file = await input.readClipboardImage()
      if (file) {
        await addAttachment(file)
        return
      }
    }

    if (!plainText) return

    const text = normalizePaste(plainText)

    const put = () => {
      if (input.addPart({ type: "text", content: text, start: 0, end: 0 })) return true
      input.focusEditor()
      return input.addPart({ type: "text", content: text, start: 0, end: 0 })
    }

    if (pasteMode(text) === "manual") {
      put()
      return
    }

    const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text)
    if (inserted) return

    put()
  }

  const handleGlobalDragOver = (event: DragEvent) => {
    if (input.isDialogActive()) return

    event.preventDefault()
    const hasFiles = event.dataTransfer?.types.includes("Files")
    const hasText = event.dataTransfer?.types.includes("text/plain")
    if (hasFiles) {
      input.setDraggingType("image")
    } else if (hasText) {
      input.setDraggingType("@mention")
    }
  }

  const handleGlobalDragLeave = (event: DragEvent) => {
    if (input.isDialogActive()) return
    if (!event.relatedTarget) {
      input.setDraggingType(null)
    }
  }

  const handleGlobalDrop = async (event: DragEvent) => {
    if (input.isDialogActive()) return

    event.preventDefault()
    input.setDraggingType(null)

    const plainText = event.dataTransfer?.getData("text/plain")
    const filePrefix = "file:"
    if (plainText?.startsWith(filePrefix)) {
      const filePath = plainText.slice(filePrefix.length)
      input.focusEditor()
      input.addPart({ type: "file", path: filePath, content: "@" + filePath, start: 0, end: 0 })
      return
    }

    const dropped = event.dataTransfer?.files
    if (!dropped) return

    let found = false
    for (const file of Array.from(dropped)) {
      const ok = await add(file, false)
      if (ok) found = true
    }
    if (!found && dropped.length > 0) warn()
  }

  onMount(() => {
    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("dragleave", handleGlobalDragLeave)
    document.addEventListener("drop", handleGlobalDrop)
  })

  onCleanup(() => {
    document.removeEventListener("dragover", handleGlobalDragOver)
    document.removeEventListener("dragleave", handleGlobalDragLeave)
    document.removeEventListener("drop", handleGlobalDrop)
  })

  return {
    addAttachment,
    addAttachments,
    removeAttachment,
    handlePaste,
  }
}
