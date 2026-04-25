import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { createSignal, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServer } from "@/context/server"
import { webFileTransferApi } from "@/utils/web-file-transfer"

interface FolderToCreate {
  path: string
  status: "pending" | "creating" | "success" | "error"
  message?: string
}

interface FileUploadItem {
  id: string
  file: File
  relativePath?: string // Relative path within the folder
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  message?: string
}

export function DialogUploadFile() {
  const language = useLanguage()
  const dialog = useDialog()
  const server = useServer()

  const [files, setFiles] = createSignal<FileUploadItem[]>([])
  const [folders, setFolders] = createSignal<FolderToCreate[]>([])
  const [isDragging, setIsDragging] = createSignal(false)
  const [targetPath, setTargetPath] = createSignal("")
  const [newFolderPath, setNewFolderPath] = createSignal("")

  // Get the server URL
  const serverUrl = () => {
    const current = server.current
    if (!current) {
      throw new Error("No server available")
    }
    return current.http.url
  }

  const handleFileSelect = (selectedFiles: FileList | null, relativePaths?: string[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    console.log("[DialogUploadFile] Files selected:", selectedFiles.length)

    const newFiles: FileUploadItem[] = Array.from(selectedFiles).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      relativePath: relativePaths?.[index],
      progress: 0,
      status: "pending" as const,
    }))

    console.log("[DialogUploadFile] Adding files:", newFiles.length)
    setFiles((prev) => {
      const updated = [...prev, ...newFiles]
      console.log("[DialogUploadFile] Total files:", updated.length, "Pending:", updated.filter((f) => f.status === "pending").length)
      return updated
    })
  }

  const handleFolderSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    console.log("[DialogUploadFile] Folder selected, file count:", selectedFiles.length)

    // When selecting a folder, files have webkitRelativePath property
    const newFiles: FileUploadItem[] = Array.from(selectedFiles)
      .filter((file) => file.name !== ".DS_Store") // Skip macOS metadata files
      .map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        relativePath: (file as any).webkitRelativePath || file.name,
        progress: 0,
        status: "pending" as const,
      }))

    // Extract all unique directory paths from the files
    const directorySet = new Set<string>()
    newFiles.forEach((item) => {
      if (item.relativePath) {
        const parts = item.relativePath.split("/")
        // Add all parent directories
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join("/")
          directorySet.add(dirPath)
        }
      }
    })

    console.log("[DialogUploadFile] Adding files to list:", newFiles.length)
    console.log("[DialogUploadFile] Found directories:", directorySet.size)

    setFiles((prev) => {
      const updated = [...prev, ...newFiles]
      console.log("[DialogUploadFile] Total files in list:", updated.length)
      return updated
    })
  }

  const createFolder = async () => {
    const path = newFolderPath().trim()
    if (!path) return

    const folderItem: FolderToCreate = {
      path,
      status: "creating",
    }
    setFolders((prev) => [...prev, folderItem])

    try {
      const result = await webFileTransferApi.createDirectory(serverUrl(), path)
      setFolders((prev) =>
        prev.map((f) =>
          f.path === path
            ? { ...f, status: result.success ? "success" : "error", message: result.message }
            : f,
        ),
      )

      if (result.success) {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "文件夹创建成功",
        })
        setNewFolderPath("")
      } else {
        showToast({
          variant: "error",
          title: "文件夹创建失败",
          description: result.message,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建失败"
      setFolders((prev) =>
        prev.map((f) => (f.path === path ? { ...f, status: "error", message } : f)),
      )
      showToast({
        variant: "error",
        title: "文件夹创建失败",
        description: message,
      })
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer?.files ?? null)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFile = async (item: FileUploadItem) => {
    setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" as const } : f)))

    try {
      // Build the full path for the file
      let fullPath = targetPath()
      if (item.relativePath) {
        // Keep the root folder name in the path to preserve folder structure
        const relativePath = item.relativePath

        if (fullPath && relativePath) {
          fullPath = fullPath.endsWith("/") ? fullPath + relativePath : fullPath + "/" + relativePath
        } else if (relativePath) {
          fullPath = relativePath
        }
      }

      const result = await webFileTransferApi.uploadFile(serverUrl(), item.file, fullPath, (progress) => {
        setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, progress } : f)))
      })

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "success" as const, progress: 100, message: result.message } : f,
          ),
        )
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("webFileTransfer.upload.success"),
        })
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error" as const, message: result.message ?? "Upload failed" } : f,
          ),
        )
        showToast({
          variant: "error",
          title: language.t("webFileTransfer.upload.error"),
          description: result.message,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setFiles((prev) => prev.map((f) => (f.id === item.id ? { ...f, status: "error" as const, message } : f)))
      showToast({
        variant: "error",
        title: language.t("webFileTransfer.upload.error"),
        description: message,
      })
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files().filter((f) => f.status === "pending")
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog title={language.t("webFileTransfer.upload.title")} transition class="!max-w-2xl">
      <div class="flex flex-col gap-4 px-5 pb-4 max-h-[70vh] overflow-y-auto">
        {/* Target Path Input */}
        <TextField
          type="text"
          label={language.t("webFileTransfer.upload.targetPath")}
          placeholder="/workspace"
          value={targetPath()}
          onChange={setTargetPath}
        />

        {/* Create New Folder */}
        <div class="flex flex-col gap-2">
          <label class="text-13-medium text-text-strong">创建新文件夹</label>
          <div class="flex items-center gap-2">
            <TextField
              type="text"
              placeholder="输入文件夹路径（如：/workspace/new-folder）"
              value={newFolderPath()}
              onChange={setNewFolderPath}
              class="flex-1"
              onKeyPress={(e: KeyboardEvent) => {
                if (e.key === "Enter" && newFolderPath().trim()) {
                  createFolder()
                }
              }}
            />
            <Button
              onClick={createFolder}
              disabled={!newFolderPath().trim()}
              class="shrink-0"
            >
              <Icon name="plus" size="small" />
              创建
            </Button>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          classList={{
            "relative flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer": true,
            "border-border-weaker-base hover:border-border-weak-base hover:bg-surface-raised-base": !isDragging(),
            "border-border-focus bg-surface-raised-base-active": isDragging(),
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={(e) => {
            // Prevent click when clicking on buttons
            if ((e.target as HTMLElement).tagName !== "BUTTON") {
              document.getElementById("upload-file-input")?.click()
            }
          }}
        >
          <input
            type="file"
            multiple
            class="hidden"
            id="upload-file-input"
            onChange={(e) => handleFileSelect(e.currentTarget.files)}
          />
          <input
            type="file"
            // @ts-ignore - webkitdirectory is not in TypeScript types
            webkitdirectory
            class="hidden"
            id="upload-folder-input"
            onChange={(e) => handleFolderSelect(e.currentTarget.files)}
          />
          <Icon name="cloud-upload" class="size-8 text-icon-base mb-2" />
          <span class="text-14-regular text-text-base mb-3">
            {language.t("webFileTransfer.upload.dropzone")}
          </span>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                document.getElementById("upload-file-input")?.click()
              }}
            >
              {/* @ts-ignore - icon name not in type definition */}
              <Icon name="file" size="small" />
              {language.t("webFileTransfer.upload.selectFiles")}
            </Button>
            <div class="text-text-weaker px-1">或</div>
            <Button
              variant="ghost"
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                document.getElementById("upload-folder-input")?.click()
              }}
            >
              <Icon name="folder" size="small" />
              {language.t("webFileTransfer.upload.selectFolder")}
            </Button>
          </div>
        </div>

        {/* Info Note */}
        <div class="text-12-regular text-text-weak bg-surface-subtle-base rounded px-3 py-2 border border-border-weak-base">
          {/* @ts-ignore - icon name not in type definition */}
          <Icon name="info" size="small" class="text-text-weak mr-1.5 align-middle" />
          <span>选择文件夹时只会上传文件，空文件夹不会被上传。请使用上方"创建新文件夹"功能手动创建空文件夹。</span>
        </div>

        {/* File List */}
        <Show when={files().length > 0}>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between px-1">
              <span class="text-12-medium text-text-strong">文件列表</span>
              <span class="text-12-regular text-text-weak">
                {files().filter((f) => f.status === "pending").length} / {files().length} 待上传
              </span>
            </div>
            <div class="flex flex-col rounded-lg border border-border-weak-base overflow-hidden max-h-64 overflow-y-auto">
              <For each={files()}>
                {(item, index) => (
                  <div
                    classList={{
                      "flex items-center gap-3 px-3 py-2.5 hover:bg-surface-subtle-base transition-colors": true,
                      "border-b border-border-weak-base": index() < files().length - 1,
                      "bg-surface-raised-base": item.status === "success",
                    }}
                  >
                    <FileIcon node={{ path: item.file.name, type: "file" }} class="shrink-0 size-4" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-14-regular text-text-strong truncate">
                          {item.relativePath || item.file.name}
                        </span>
                        <div class="flex items-center gap-2 shrink-0">
                          <Show when={item.status === "uploading"}>
                            <span class="text-12-regular text-text-weak tabular-nums">
                              {item.progress}%
                            </span>
                          </Show>
                          <Show when={item.status === "pending"}>
                            <span class="text-12-regular text-text-weak">{formatSize(item.file.size)}</span>
                          </Show>
                          <Show when={item.status === "success"}>
                            <Icon name="circle-check" size="small" class="text-icon-success-base" />
                          </Show>
                          <Show when={item.status === "error"}>
                            <Icon name="circle-x" size="small" class="text-icon-critical-base" />
                          </Show>
                        </div>
                      </div>
                      <Show when={item.status === "uploading"}>
                        <div class="mt-2 h-1 bg-border-weak-base rounded-full overflow-hidden">
                          <div
                            class="h-full bg-icon-success-base transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </Show>
                      <Show when={item.message && item.status === "error"}>
                        <p class="mt-1 text-12-regular text-icon-critical-base truncate">{item.message}</p>
                      </Show>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <Show when={item.status === "pending" || item.status === "error"}>
                        <Button
                          variant="ghost"
                          size="small"
                          class="!size-7 !p-0"
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            uploadFile(item)
                          }}
                        >
                          <Icon name="arrow-up" size="small" />
                        </Button>
                      </Show>
                      <Button
                        variant="ghost"
                        size="small"
                        class="!size-7 !p-0"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation()
                          removeFile(item.id)
                        }}
                      >
                        <Icon name="close" size="small" />
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Folder Creation Status */}
        <Show when={folders().length > 0}>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between px-1">
              <span class="text-12-medium text-text-strong">文件夹</span>
              <span class="text-12-regular text-text-weak">
                {folders().filter((f) => f.status === "success").length} / {folders().length} 已创建
              </span>
            </div>
            <div class="flex flex-col rounded-lg border border-border-weak-base overflow-hidden max-h-48 overflow-y-auto">
              <For each={folders()}>
                {(folder) => (
                  <div
                    classList={{
                      "flex items-center gap-3 px-3 py-2.5 hover:bg-surface-subtle-base transition-colors": true,
                      "bg-surface-raised-base": folder.status === "success",
                    }}
                  >
                    <Icon name="folder" size="small" class="text-icon-base shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-14-regular text-text-strong truncate">{folder.path}</span>
                        <Show when={folder.status === "creating"}>
                          <Icon name="align-right" size="small" class="text-icon-weak animate-spin" />
                        </Show>
                        <Show when={folder.status === "success"}>
                          <Icon name="circle-check" size="small" class="text-icon-success-base" />
                        </Show>
                        <Show when={folder.status === "error"}>
                          <Icon name="circle-x" size="small" class="text-icon-critical-base" />
                        </Show>
                      </div>
                      <Show when={folder.message && folder.status === "error"}>
                        <p class="mt-1 text-12-regular text-icon-critical-base truncate">{folder.message}</p>
                      </Show>
                    </div>
                    <Button
                      variant="ghost"
                      size="small"
                      class="!size-7 !p-0"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        setFolders((prev) => prev.filter((f) => f.path !== folder.path))
                      }}
                    >
                      <Icon name="close" size="small" />
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Actions */}
        <Show when={files().length > 0 || folders().length > 0}>
          <div class="flex items-center justify-between pt-2 border-t border-border-weak-base">
            <div class="text-12-regular text-text-weak">
              <Show when={files().length > 0}>
                <span>文件：{files().length} 个</span>
                <Show when={files().filter((f) => f.status === "pending").length > 0}>
                  <span class="text-icon-warning-base ml-2">
                    ({files().filter((f) => f.status === "pending").length} 个待上传)
                  </span>
                </Show>
              </Show>
              <Show when={folders().length > 0 && files().length > 0}>
                <span class="mx-2">|</span>
              </Show>
              <Show when={folders().length > 0}>
                <span>文件夹：{folders().length} 个</span>
              </Show>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setFiles([])
                  setFolders([])
                }}
              >
                <Icon name="close" size="small" />
                清空
              </Button>
              <Show when={files().filter((f) => f.status === "pending").length > 0}>
                <Button onClick={uploadAll}>
                  <Icon name="cloud-upload" size="small" />
                  {language.t("webFileTransfer.upload.uploadAll")}
                </Button>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Dialog>
  )
}
