import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { FileIcon } from "@opencode-ai/ui/file-icon"
import { List } from "@opencode-ai/ui/list"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { showToast } from "@opencode-ai/ui/toast"
import { getFilename, getDirectory } from "@opencode-ai/core/util/path"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { createEffect, createMemo, createSignal, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useLanguage } from "@/context/language"
import { useGlobalSync } from "@/context/global-sync"
import { useServer } from "@/context/server"
import { useLayout } from "@/context/layout"
import { webFileTransferApi, triggerDownload } from "@/utils/web-file-transfer"

interface FileItem {
  id: string
  path: string
  name: string
  type: "file" | "directory"
  size?: number
  modifiedTime?: string
  children?: FileItem[]
  expanded?: boolean
  loading?: boolean
  level: number
}

export function DialogDownloadFile() {
  const language = useLanguage()
  const dialog = useDialog()
  const globalSync = useGlobalSync()
  const server = useServer()
  const layout = useLayout()
  const navigate = useNavigate()

  const [isDownloading, setIsDownloading] = createSignal(false)
  const [isUploading, setIsUploading] = createSignal(false)
  const [uploadTargetPath, setUploadTargetPath] = createSignal<string | null>(null)
  const [folderUploadTargetPath, setFolderUploadTargetPath] = createSignal<string | null>(null)
  const [isCreatingDir, setIsCreatingDir] = createSignal(false)
  const [newDirPath, setNewDirPath] = createSignal<string | null>(null)
  const [showCreateInput, setShowCreateInput] = createSignal(false)
  const [newDirName, setNewDirName] = createSignal("")
  const [filter, setFilter] = createSignal("")
  const [fileTree, setFileTree] = createSignal<FileItem[]>([])
  const [treeVersion, setTreeVersion] = createSignal(0)
  const [uploadProgress, setUploadProgress] = createSignal<{ current: number; total: number } | null>(null)
  const [currentPath, setCurrentPath] = createSignal<string>("studio")
  const [currentView, setCurrentView] = createSignal<FileItem[]>([])
  const [selectedModule, setSelectedModule] = createSignal<string>("cimicode")
  const [searchQuery, setSearchQuery] = createSignal<string>("")
  const [hoveredItemPath, setHoveredItemPath] = createSignal<string | null>(null)

  // Function modules for left sidebar
  const functionModules = [
    { id: "agent", name: "智能体", icon: "bot" },
    { id: "knowledge", name: "知识库", icon: "book" },
    { id: "image", name: "图像生成", icon: "image" },
    { id: "ppt", name: "AI PPT", icon: "presentation" },
    { id: "reading", name: "AI阅读", icon: "book-open" },
    { id: "writing", name: "帮我写作", icon: "pencil" },
    { id: "cimicode", name: "CimiCode", icon: "code" },
  ]

  // History items
  const historyItems = [
    { id: "long-text", name: "长文本编辑", icon: "file-text", time: "2小时前" },
    { id: "work-summary", name: "工作总结助手", icon: "clipboard-text", time: "昨天" },
  ]

  // Filter files based on search query
  const filteredView = createMemo(() => {
    const query = searchQuery().toLowerCase().trim()
    if (!query) return currentView()
    return currentView().filter(item =>
      item.name.toLowerCase().includes(query)
    )
  })

  const ensurePrefix = (value: string) => {
    return value.trim()
  }

  // Load directory contents and expand tree
  const loadDirectory = async (item: FileItem): Promise<FileItem[]> => {
    try {
      const url = serverUrl()
      // Extract path relative to /studio
      let relativePath: string
      if (item.path === "studio") {
        // Root studio directory
        relativePath = ""
      } else if (item.path.startsWith("studio/")) {
        // Nested directory under studio
        relativePath = item.path.slice("studio/".length)
      } else {
        // Fallback
        relativePath = item.path
      }

      console.log("[Load Directory] Parent path:", item.path)
      console.log("[Load Directory] Relative path:", relativePath)

      const items = await webFileTransferApi.listFiles(url, relativePath)

      console.log("[Load Directory] API returned items:", items)

      return items.map((child, index) => {
        // The API returns paths that include the queried directory prefix
        // For example, when querying "test", it returns:
        // - "test/.gitattributes" for a file directly in test
        // - "test/subfolder" for a subdirectory

        // We need to build the full path by using the parent's path + child's name
        const childPath = `${item.path}/${child.name}`

        // Use full path as unique ID to avoid conflicts with same-named files in different directories
        // Use encodeURIComponent to handle unicode characters, then btoa for base64 encoding
        const uniqueId = btoa(encodeURIComponent(childPath))

        console.log("[Load Directory] Child:", child.path, "parent:", item.path, "->", childPath, "id:", uniqueId)

        return {
          id: uniqueId,
          path: childPath,
          name: child.name,
          type: child.type,
          size: child.size,
          modifiedTime: child.modifiedTime,
          level: item.level + 1,
          expanded: false,
          loading: false,
        }
      })
    } catch (error) {
      console.error("Failed to load directory:", error)
      return []
    }
  }

  // Find a file item by path recursively
  const findFileItem = (items: FileItem[], path: string): FileItem | null => {
    for (const item of items) {
      if (item.path === path) {
        return item
      }
      if (item.children) {
        const found = findFileItem(item.children, path)
        if (found) return found
      }
    }
    return null
  }

  // Find a file item by path from the root tree
  const findFileItemByPath = (path: string): FileItem | null => {
    return findFileItem(fileTree(), path)
  }

  // Toggle directory expansion (for tree view)
  const toggleDirectory = async (item: FileItem) => {
    if (item.expanded) {
      // Collapse: set expanded to false
      updateFileTree(item.path, { expanded: false })
      setTreeVersion(treeVersion() + 1)
    } else {
      // Expand: load children if not loaded
      updateFileTree(item.path, { loading: true, expanded: true })
      setTreeVersion(treeVersion() + 1)

      const children = await loadDirectory(item)

      updateFileTree(item.path, {
        loading: false,
        children: children.length > 0 ? children : undefined,
      })
      setTreeVersion(treeVersion() + 1)
    }
  }

  // Navigate to directory (for main view)
  const navigateToDirectory = async (item: FileItem) => {
    if (item.type !== "directory") return

    setCurrentPath(item.path)

    // Load children for the main view
    updateFileTree(item.path, { loading: true, expanded: true })
    setTreeVersion(treeVersion() + 1)

    const children = await loadDirectory(item)

    updateFileTree(item.path, {
      loading: false,
      children: children.length > 0 ? children : undefined,
      expanded: true,
    })
    setTreeVersion(treeVersion() + 1)

    // Update current view
    setCurrentView(children)
  }

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    const path = currentPath()
    if (path === "studio") return [{ name: "studio", path: "studio" }]

    const parts = path.split("/")
    const breadcrumbs = [{ name: "studio", path: "studio" }]

    for (let i = 1; i < parts.length; i++) {
      breadcrumbs.push({
        name: parts[i],
        path: parts.slice(0, i + 1).join("/"),
      })
    }

    return breadcrumbs
  }

  // Update a specific node in the tree
  const updateFileTree = (path: string, updates: Partial<FileItem>) => {
    const updateNode = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.path === path) {
          return { ...item, ...updates }
        }
        if (item.children) {
          return { ...item, children: updateNode(item.children) }
        }
        return item
      })
    }

    setFileTree(updateNode(fileTree()))
  }

  // Flatten tree for List component
  const flattenTree = (items: FileItem[]): FileItem[] => {
    const result: FileItem[] = []

    const traverse = (item: FileItem) => {
      result.push(item)
      if (item.expanded && item.children) {
        item.children.forEach(traverse)
      }
    }

    items.forEach(traverse)
    return result
  }

  // Get the server URL
  const serverUrl = () => {
    const current = server.current
    if (!current) {
      throw new Error("No server available")
    }
    return current.http.url
  }

  const homedir = createMemo(() => globalSync.data.path.home)

  const searchFiles = async (): Promise<FileItem[]> => {
    try {
      const url = serverUrl()

      // Build initial tree with studio root
      const studioRoot: FileItem = {
        id: btoa(encodeURIComponent("studio")),
        path: "studio",
        name: "studio",
        type: "directory",
        level: 0,
        expanded: true,
        loading: false,
      }

      // Update the file tree state only on initial search
      if (fileTree().length === 0) {
        setFileTree([studioRoot])

        // Load studio's children for initial view
        const children = await loadDirectory(studioRoot)
        updateFileTree("studio", {
          children: children.length > 0 ? children : undefined,
          expanded: true,
        })
        setCurrentView(children)
      }

      // Return flattened tree for display
      return flattenTree(fileTree().length > 0 ? fileTree() : [studioRoot])
    } catch (error) {
      console.error("Failed to list files:", error)
      return []
    }
  }

  // Initialize studio directory on mount
  createEffect(async () => {
    if (fileTree().length === 0) {
      await searchFiles()
    }
  })

  const handleDownload = async (item: FileItem | undefined) => {
    if (!item || item.type !== "file") return false

    setIsDownloading(true)

    try {
      // Remove studio/ prefix for API call
      let filePath: string
      if (item.path.startsWith("studio/")) {
        filePath = item.path.slice("studio/".length)
      } else {
        filePath = item.path
      }

      const result = await webFileTransferApi.downloadFile(serverUrl(), filePath)

      if (result.success && result.data) {
        triggerDownload(result.data, result.filename ?? item.name)
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("webFileTransfer.download.success"),
        })
        return true
      } else {
        showToast({
          variant: "error",
          icon: "circle-x",
          title: language.t("webFileTransfer.download.error"),
          description: result.message,
        })
        return false
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed"
      showToast({
        variant: "error",
        icon: "circle-x",
        title: language.t("webFileTransfer.download.error"),
        description: message,
      })
      return false
    } finally {
      setIsDownloading(false)
    }
  }

  const handleUploadClick = (item: FileItem) => {
    if (item.type !== "directory") return
    setUploadTargetPath(item.path)
    document.getElementById("folder-upload-input")?.click()
  }

  const handleFolderUploadClick = (item: FileItem) => {
    if (item.type !== "directory") return
    setFolderUploadTargetPath(item.path)
    document.getElementById("folder-folder-upload-input")?.click()
  }

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0 || !uploadTargetPath()) return

    setIsUploading(true)

    try {
      const targetDirectory = uploadTargetPath()!

      // Helper function to build complete path from file tree
      const buildCompletePath = (targetPath: string): string => {
        // Handle studio root directory
        if (targetPath === "studio") {
          return ""
        }

        // Find the target item in the file tree
        const targetItem = fileTree().find((item) => item.path === targetPath)
        if (!targetItem) {
          // Fallback: remove studio prefix
          return targetPath.startsWith("studio/")
            ? targetPath.slice("studio/".length)
            : targetPath
        }

        // The path in fileTree should already be complete
        // Just remove the studio/ prefix
        return targetItem.path.startsWith("studio/")
          ? targetItem.path.slice("studio/".length)
          : targetItem.path
      }

      const directoryPath = buildCompletePath(targetDirectory)

      console.log("[Upload] Target directory:", targetDirectory)
      console.log("[Upload] Directory path:", directoryPath)
      console.log("[Upload] File tree:", fileTree())

      for (const file of Array.from(selectedFiles)) {
        // Build complete path with filename
        // Example: 文件1/文件2 + / + filex.txt = 文件1/文件2/filex.txt
        const fullPath = directoryPath
          ? `${directoryPath}/${file.name}`
          : file.name

        console.log("[Upload] Uploading file:", file.name, "to path:", fullPath)

        const result = await webFileTransferApi.uploadFile(serverUrl(), file, fullPath)

        if (!result.success) {
          showToast({
            variant: "error",
            icon: "circle-x",
            title: `${file.name} 上传失败`,
            description: result.message,
          })
        }
      }

      showToast({
        variant: "success",
        icon: "circle-check",
        title: `成功上传 ${selectedFiles.length} 个文件`,
      })

      // Refresh the file tree and reload the target directory
      const targetItem = findFileItem(fileTree(), targetDirectory)
      if (targetItem) {
        // Set loading state
        updateFileTree(targetDirectory, { loading: true })
        setTreeVersion(treeVersion() + 1)

        // Reload directory contents
        const children = await loadDirectory(targetItem)

        // Update with new children and ensure it stays expanded
        updateFileTree(targetDirectory, {
          loading: false,
          children: children.length > 0 ? children : undefined,
          expanded: true, // Ensure it stays expanded
        })
        setTreeVersion(treeVersion() + 1)

        // Update current view if we're still in the same directory
        if (currentPath() === targetDirectory) {
          setCurrentView(children)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      showToast({
        variant: "error",
        icon: "circle-x",
        title: "上传失败",
        description: message,
      })
    } finally {
      setIsUploading(false)
      setUploadTargetPath(null)
    }
  }

  const handleFolderSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0 || !folderUploadTargetPath()) return

    setIsUploading(true)
    const filesArray = Array.from(selectedFiles)
    setUploadProgress({ current: 0, total: filesArray.length })

    try {
      const targetDirectory = folderUploadTargetPath()!

      // Helper function to build complete path from file tree
      const buildCompletePath = (targetPath: string): string => {
        // Handle studio root directory
        if (targetPath === "studio") {
          return ""
        }

        // Find the target item in the file tree
        const targetItem = fileTree().find((item) => item.path === targetPath)
        if (!targetItem) {
          // Fallback: remove studio prefix
          return targetPath.startsWith("studio/")
            ? targetPath.slice("studio/".length)
            : targetPath
        }

        // The path in fileTree should already be complete
        // Just remove the studio/ prefix
        return targetItem.path.startsWith("studio/")
          ? targetItem.path.slice("studio/".length)
          : targetItem.path
      }

      const directoryPath = buildCompletePath(targetDirectory)

      console.log("[Folder Upload] Target directory:", targetDirectory)
      console.log("[Folder Upload] Directory path:", directoryPath)

      let successCount = 0
      let failCount = 0

      // Process files with webkitRelativePath
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]

        // Update progress
        setUploadProgress({ current: i + 1, total: filesArray.length })

        // Get relative path from webkitRelativePath
        // This preserves the folder structure including the root folder name
        const relativePath = (file as any).webkitRelativePath || file.name

        // Build complete path, keeping the root folder name
        // For example: "MyFolder/subfolder/file.txt" stays as "MyFolder/subfolder/file.txt"
        const fullPath = directoryPath
          ? `${directoryPath}/${relativePath}`
          : relativePath

        console.log("[Folder Upload] Uploading file:", relativePath, "to path:", fullPath)

        const result = await webFileTransferApi.uploadFile(serverUrl(), file, fullPath)

        if (!result.success) {
          failCount++
        } else {
          successCount++
        }
      }

      // Clear progress before showing toast
      setUploadProgress(null)

      if (failCount > 0) {
        showToast({
          variant: "error",
          icon: "warning",
          title: `上传完成：成功 ${successCount} 个，失败 ${failCount} 个`,
        })
      } else {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: `成功上传 ${successCount} 个文件`,
        })
      }

      // Refresh the file tree and reload the target directory
      const targetItem = findFileItem(fileTree(), targetDirectory)
      if (targetItem) {
        // Set loading state
        updateFileTree(targetDirectory, { loading: true })
        setTreeVersion(treeVersion() + 1)

        // Reload directory contents
        const children = await loadDirectory(targetItem)

        // Update with new children and ensure it stays expanded
        updateFileTree(targetDirectory, {
          loading: false,
          children: children.length > 0 ? children : undefined,
          expanded: true, // Ensure it stays expanded
        })
        setTreeVersion(treeVersion() + 1)

        // Update current view if we're still in the same directory
        if (currentPath() === targetDirectory) {
          setCurrentView(children)
        }
      }
    } catch (error) {
      setUploadProgress(null)
      const message = error instanceof Error ? error.message : "Upload failed"
      showToast({
        variant: "error",
        icon: "circle-x",
        title: "上传文件夹失败",
        description: message,
      })
    } finally {
      setIsUploading(false)
      setFolderUploadTargetPath(null)
    }
  }

  const handleCreateDir = (item: FileItem) => {
    if (item.type !== "directory") return
    setNewDirPath(item.path)
    setShowCreateInput(true)
    setNewDirName("")
    // Focus input after render
    setTimeout(() => {
      const input = document.getElementById(`create-dir-input-${item.id}`)
      input?.focus()
    }, 50)
  }

  const handleCreateDirConfirm = async () => {
    const dirName = newDirName().trim()
    if (!dirName || !newDirPath()) return

    setIsCreatingDir(true)

    try {
      const parentPath = newDirPath()!
      // Remove "studio/" prefix or handle studio root
      let directoryPath: string
      if (parentPath === "studio") {
        // Root studio directory
        directoryPath = ""
      } else if (parentPath.startsWith("studio/")) {
        // Nested directory under studio
        directoryPath = parentPath.slice("studio/".length)
      } else {
        directoryPath = parentPath
      }

      // Build complete path
      const fullPath = directoryPath
        ? `${directoryPath}/${dirName}`
        : dirName

      const result = await webFileTransferApi.createDirectory(serverUrl(), fullPath)

      if (result.success) {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: "文件夹创建成功",
        })
        setShowCreateInput(false)
        setNewDirName("")

        // Refresh the file tree and reload the parent directory
        const targetItem = findFileItem(fileTree(), parentPath)
        if (targetItem) {
          // Set loading state
          updateFileTree(parentPath, { loading: true })
          setTreeVersion(treeVersion() + 1)

          // Reload directory contents
          const children = await loadDirectory(targetItem)

          // Update with new children and ensure it stays expanded
          updateFileTree(parentPath, {
            loading: false,
            children: children.length > 0 ? children : undefined,
            expanded: true, // Ensure it stays expanded
          })
          setTreeVersion(treeVersion() + 1)

          // Update current view if we're still in the same directory
          if (currentPath() === parentPath) {
            setCurrentView(children)
          }
        }
      } else {
        showToast({
          variant: "error",
          icon: "circle-x",
          title: "文件夹创建失败",
          description: result.message,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建失败"
      showToast({
        variant: "error",
        icon: "circle-x",
        title: "文件夹创建失败",
        description: message,
      })
    } finally {
      setIsCreatingDir(false)
      setNewDirPath(null)
    }
  }

  const handleCreateDirCancel = () => {
    setShowCreateInput(false)
    setNewDirName("")
    setNewDirPath(null)
  }

  const formatSize = (bytes: number | undefined) => {
    if (bytes === undefined || bytes === 0) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)

    // 格式化为 YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const handleOpenProject = async (item: FileItem) => {
    try {
      // Build the complete path with /studio root prefix
      let projectPath: string
      if (item.path === "studio") {
        // Root studio directory
        projectPath = "/studio"
      } else if (item.path.startsWith("studio/")) {
        // Remove studio prefix and add /studio root
        const relativePath = item.path.slice("studio/".length)
        projectPath = `/studio/${relativePath}`
      } else {
        // Fallback: add /studio prefix
        projectPath = `/studio/${item.path}`
      }

      // Normalize the path (convert to absolute path format)
      const normalizedPath = projectPath.replace(/\\/g, "/")

      // Open the project
      layout.projects.open(normalizedPath)

      // Mark this project as the last used project (to make it active)
      // server.projects.touch(normalizedPath)

      dialog.close()

      // Navigate to the project page (use client-side routing to avoid page refresh)
      const encodedPath = base64Encode(normalizedPath)
      navigate(`/${encodedPath}/session`)

      showToast({
        variant: "success",
        icon: "circle-check",
        title: "项目已打开",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "打开失败"
      showToast({
        variant: "error",
        icon: "circle-x",
        title: "打开失败",
        description: message,
      })
    }
  }

  return (
    <>
      <style>{`
        /* CimiCode Studio 文件管理界面样式 */
        .cimicode-studio-wrapper {
          display: flex;
          width: 100%;
          height: 100%;
          background: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        }

        /* 左侧边栏 */
        .cimicode-sidebar {
          width: 200px;
          min-width: 200px;
          background: #F8F9FA;
          border-right: 1px solid #E0E0E0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cimicode-sidebar-header {
          padding: 20px 16px 12px;
          border-bottom: 1px solid #E0E0E0;
        }

        .cimicode-logo {
          font-size: 18px;
          font-weight: 600;
          color: #4285F4;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cimicode-nav-section {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
        }

        .cimicode-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          color: #333333;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .cimicode-nav-item:hover {
          background-color: #E8F0FE;
        }

        .cimicode-nav-item.active {
          background-color: #4285F4;
          color: #FFFFFF;
        }

        .cimicode-nav-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .cimicode-history-section {
          border-top: 1px solid #E0E0E0;
          padding: 12px 8px;
        }

        .cimicode-history-header {
          font-size: 12px;
          color: #666666;
          font-weight: 500;
          padding: 4px 12px 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cimicode-history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          color: #333333;
          font-size: 14px;
        }

        .cimicode-history-item:hover {
          background-color: #E8F0FE;
        }

        .cimicode-history-time {
          font-size: 12px;
          color: #999999;
          margin-left: auto;
        }

        .cimicode-user-profile {
          padding: 12px 16px;
          border-top: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cimicode-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #4285F4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .cimicode-user-info {
          flex: 1;
        }

        .cimicode-user-name {
          font-size: 14px;
          color: #333333;
          font-weight: 500;
        }

        .cimicode-user-email {
          font-size: 12px;
          color: #999999;
        }

        /* 右侧主内容区 */
        .cimicode-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #FFFFFF;
        }

        /* 顶部导航栏 */
        .cimicode-top-navbar {
          height: 56px;
          border-bottom: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
        }

        .cimicode-navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cimicode-tab-indicator {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #F8F9FA;
          border: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #666666;
        }

        .cimicode-navbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .cimicode-search-bar {
          width: 100%;
          max-width: 400px;
          position: relative;
        }

        .cimicode-search-input {
          width: 100%;
          height: 36px;
          padding: 0 40px 0 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          background: #F8F9FA;
          font-size: 14px;
          color: #333333;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .cimicode-search-input:focus {
          border-color: #4285F4;
          background: #FFFFFF;
        }

        .cimicode-search-shortcut {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          color: #999999;
          background: #F0F0F0;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cimicode-navbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cimicode-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease;
          color: #666666;
        }

        .cimicode-nav-btn:hover {
          background-color: #F0F0F0;
        }

        .cimicode-window-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        }

        .cimicode-window-btn {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          cursor: pointer;
        }

        .cimicode-window-btn.close {
          background: #FF5F57;
        }

        .cimicode-window-btn.minimize {
          background: #FFBD2E;
        }

        .cimicode-window-btn.maximize {
          background: #28C940;
        }

        /* 内容区域 */
        .cimicode-content-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .cimicode-section-header {
          margin-bottom: 20px;
        }

        .cimicode-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #333333;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .cimicode-content-search {
          margin-bottom: 16px;
        }

        .cimicode-content-search-input {
          width: 100%;
          height: 40px;
          padding: 0 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          background: #F8F9FA;
          font-size: 14px;
          color: #333333;
          outline: none;
        }

        .cimicode-content-search-input:focus {
          border-color: #4285F4;
          background: #FFFFFF;
        }

        .cimicode-action-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .cimicode-action-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease;
          color: #4285F4;
          border: 1px solid #E0E0E0;
          background: #FFFFFF;
        }

        .cimicode-action-btn:hover {
          background-color: #F8F9FA;
        }

        /* 文件夹网格布局 */
        .cimicode-folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 16px;
        }

        .cimicode-folder-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          padding: 12px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          box-sizing: border-box;
        }

        .cimicode-folder-item:hover {
          background-color: #F8F9FA;
          border-color: #E0E0E0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .cimicode-folder-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 4px;
          color: #4285F4;
          flex-shrink: 0;
        }

        .cimicode-folder-name {
          font-size: 11px;
          color: #333333;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
        }

        /* 空状态 */
        .cimicode-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999999;
        }

        .cimicode-empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .cimicode-empty-text {
          font-size: 14px;
          color: #999999;
        }

        /* 文件项样式 */
        .cimicode-file-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          padding: 12px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          border: 1px solid transparent;
          box-sizing: border-box;
        }

        .cimicode-file-item:hover {
          background-color: #F8F9FA;
          border-color: #E0E0E0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .cimicode-file-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 4px;
          color: #666666;
          flex-shrink: 0;
        }

        .cimicode-file-name {
          font-size: 11px;
          color: #333333;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
        }

        /* 打开项目按钮样式 */
        .cimicode-open-project-btn {
          font-size: 12px;
          color: #666666;
          font-weight: 400;
          text-align: center;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #E0E0E0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cimicode-open-project-btn:hover {
          background: #4285F4;
          color: #FFFFFF;
          border-color: #4285F4;
        }

        /* 滚动条样式 */
        .cimicode-nav-section::-webkit-scrollbar,
        .cimicode-content-area::-webkit-scrollbar {
          width: 6px;
        }

        .cimicode-nav-section::-webkit-scrollbar-track,
        .cimicode-content-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .cimicode-nav-section::-webkit-scrollbar-thumb,
        .cimicode-content-area::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 3px;
        }

        .cimicode-nav-section::-webkit-scrollbar-thumb:hover,
        .cimicode-content-area::-webkit-scrollbar-thumb:hover {
          background: #CCCCCC;
        }

        /* 响应式 */
        @media (max-width: 1024px) {
          .cimicode-folder-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .cimicode-sidebar {
            display: none;
          }
          .cimicode-folder-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    <Dialog>
      {/* Upload Progress Modal */}
      <Show when={uploadProgress()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center upload-progress-modal">
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          {/* Modal Container */}
          <div class="relative w-full max-w-sm mx-4">
            {/* Card */}
            <div class="relative bg-surface-raised-stronger-non-alpha border border-border-base rounded-md shadow-md overflow-hidden">

              {/* Content */}
              <div class="p-8">

                {/* Header */}
                <div class="text-center mb-8">
                  <h3 class="text-20-semibold text-text-base mb-2">正在上传文件夹</h3>
                  <p class="text-14-regular text-text-weak">正在传输文件到服务器</p>
                </div>

                {/* File Count Display */}
                <div class="flex justify-center mb-8">
                  <div class="relative">
                    {/* Animated dots */}
                    <div class="flex items-center justify-center gap-2 mb-6">
                      <div class="w-2 h-2 bg-icon-base rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div class="w-2 h-2 bg-icon-base rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div class="w-2 h-2 bg-icon-base rounded-full animate-bounce" />
                    </div>

                    {/* File count */}
                    <div class="flex items-baseline justify-center gap-2">
                      <span class="text-6xl font-bold text-text-strong tabular-nums tracking-tight">
                        {uploadProgress()?.current}
                      </span>
                      <span class="text-3xl font-medium text-text-weak">/</span>
                      <span class="text-6xl font-bold text-text-weak tabular-nums tracking-tight">
                        {uploadProgress()?.total}
                      </span>
                    </div>

                    {/* Label */}
                    <div class="text-center mt-3">
                      <span class="text-16-regular text-text-weak">个文件</span>
                    </div>
                  </div>
                </div>

                {/* Status info */}
                <div class="grid grid-cols-2 gap-3 mb-6">
                  <div class="text-center p-4 bg-surface-subtle-base rounded-lg border border-border-weak-base">
                    <div class="text-3xl font-semibold text-text-strong tabular-nums">
                      {uploadProgress()?.current}
                    </div>
                    <div class="text-12-regular text-text-weak mt-1">已完成</div>
                  </div>
                  <div class="text-center p-4 bg-surface-subtle-base rounded-lg border border-border-weak-base">
                    <div class="text-3xl font-semibold text-text-strong tabular-nums">
                      {(uploadProgress()?.total ?? 0) - (uploadProgress()?.current || 0)}
                    </div>
                    <div class="text-12-regular text-text-weak mt-1">剩余</div>
                  </div>
                </div>

                {/* Footer message */}
                <div class="text-center">
                  <p class="text-12-regular text-text-weak">上传完成后将自动关闭</p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </Show>
      <div class="file-transfer-fullscreen-wrapper">
        <input
          type="file"
          multiple
          class="hidden"
          id="folder-upload-input"
          onChange={(e) => handleFileSelect(e.currentTarget.files)}
        />
        <input
          type="file"
          // @ts-ignore - webkitdirectory is not in TypeScript types
          webkitdirectory
          directory
          multiple
          class="hidden"
          id="folder-folder-upload-input"
          onChange={(e) => handleFolderSelect(e.currentTarget.files)}
        />
        <div class="file-transfer-content" style={{ "padding-top": "0" }}>
          <div class="cimicode-studio-wrapper">

            {/* 右侧主内容区域 */}
            <div class="cimicode-main-content">
              {/* 面包屑导航 */}
              <div style={{
                height: "48px",
                "border-bottom": "2px solid #E8E8E8",
                display: "flex",
                "align-items": "center",
                padding: "0 20px",
                background: "#FFFFFF",
                "justify-content": "space-between",
              }}>
                <div style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                }}>
                  {getBreadcrumbs().map((crumb, index) => (
                    <>
                      {index > 0 && (
                        <Icon
                          name="chevron-right"
                          size="small"
                          style={{
                            color: "#D0D0D0",
                            "flex-shrink": 0,
                          }}
                        />
                      )}
                      <div
                        style={{
                          "font-size": "14px",
                          color: index === getBreadcrumbs().length - 1 ? "#1A1A1A" : "#666666",
                          "font-weight": index === getBreadcrumbs().length - 1 ? "500" : "400",
                          cursor: index === getBreadcrumbs().length - 1 ? "default" : "pointer",
                          padding: "6px 10px",
                          "border-radius": "6px",
                          transition: "all 0.15s ease",
                          display: "flex",
                          "align-items": "center",
                          gap: "6px",
                          "max-width": "200px",
                        }}
                        onClick={async () => {
                          if (index < getBreadcrumbs().length - 1) {
                            // Find the item in the tree recursively
                            let item = findFileItemByPath(crumb.path)

                            // If not found in tree, create a temporary item for navigation
                            if (!item) {
                              item = {
                                id: btoa(encodeURIComponent(crumb.path)),
                                path: crumb.path,
                                name: crumb.name,
                                type: "directory" as const,
                                level: crumb.path.split("/").length - 1,
                                expanded: false,
                                loading: false,
                              }

                              // Add the item to the tree if it doesn't exist
                              if (fileTree().length === 0) {
                                setFileTree([item])
                              }
                            }

                            // Navigate to the directory
                            await navigateToDirectory(item)
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (index < getBreadcrumbs().length - 1) {
                            e.currentTarget.style.background = "#F5F5F5"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index < getBreadcrumbs().length - 1) {
                            e.currentTarget.style.background = "transparent"
                          }
                        }}
                      >
                        {index === 0 && (
                          <Icon
                            name="folder"
                            size="small"
                            style={{
                              color: index === getBreadcrumbs().length - 1 ? "#4285F4" : "#999999",
                              "flex-shrink": 0,
                            }}
                          />
                        )}
                        <span style={{
                          overflow: "hidden",
                          "text-overflow": "ellipsis",
                          "white-space": "nowrap",
                        }}>
                          {crumb.name}
                        </span>
                      </div>
                    </>
                  ))}
                </div>

                {/* 搜索和操作按钮 */}
                <div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
                  <input
                    type="text"
                    placeholder="搜索文件..."
                    value={searchQuery()}
                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    style={{
                      width: "200px",
                      height: "32px",
                      padding: "0 12px",
                      border: "1px solid #E0E0E0",
                      "border-radius": "6px",
                      background: "#F8F9FA",
                      "font-size": "13px",
                      color: "#333333",
                      outline: "none",
                      transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#4285F4"
                      e.currentTarget.style.background = "#FFFFFF"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#E0E0E0"
                      e.currentTarget.style.background = "#F8F9FA"
                    }}
                  />
                  <Tooltip value="刷新" placement="top">
                    <button
                      style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "6px",
                        border: "1px solid #E0E0E0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        transition: "background-color 0.15s ease",
                      }}
                      onClick={() => {
                        const item = findFileItemByPath(currentPath())
                        if (item) navigateToDirectory(item)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F5F5"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                      }}
                    >
                      <Icon name="refresh" size="small" />
                    </button>
                  </Tooltip>
                  <Tooltip value="上传文件" placement="top">
                    <button
                      style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "6px",
                        border: "1px solid #E0E0E0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        transition: "background-color 0.15s ease",
                      }}
                      disabled={isUploading()}
                      onClick={() => {
                        const item = findFileItemByPath(currentPath())
                        if (item && item.type === "directory") handleUploadClick(item)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F5F5"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                      }}
                    >
                      <Icon name="cloud-upload" size="small" />
                    </button>
                  </Tooltip>
                  <Tooltip value="上传文件夹" placement="top">
                    <button
                      style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "6px",
                        border: "1px solid #E0E0E0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        transition: "background-color 0.15s ease",
                      }}
                      disabled={isUploading()}
                      onClick={() => {
                        const item = findFileItemByPath(currentPath())
                        if (item && item.type === "directory") handleFolderUploadClick(item)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F5F5"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                      }}
                    >
                      <Icon name="folder" size="small" />
                    </button>
                  </Tooltip>
                  <Tooltip value="新建文件夹" placement="top">
                    <button
                      style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "6px",
                        border: "1px solid #E0E0E0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        transition: "background-color 0.15s ease",
                      }}
                      disabled={isCreatingDir()}
                      onClick={() => {
                        const item = findFileItemByPath(currentPath())
                        if (item && item.type === "directory") handleCreateDir(item)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F5F5"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                      }}
                    >
                      <Icon name="plus" size="small" />
                    </button>
                  </Tooltip>
                  <Tooltip value="关闭" placement="top">
                    <button
                      style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "6px",
                        border: "1px solid #E0E0E0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        transition: "background-color 0.15s ease",
                      }}
                      onClick={() => dialog.close()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F5F5F5"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF"
                      }}
                    >
                      <Icon name="close" size="small" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* 内容区域 */}
              <div class="cimicode-content-area" style={{
                "border-top": "1px solid #F0F0F0",
              }}>
                {/* 创建文件夹弹框 */}
                {showCreateInput() && (
                  <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    "z-index": 1000,
                  }}>
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "#FFFFFF",
                      "border-radius": "12px",
                      padding: "20px",
                      width: "460px",
                      height: "240px",
                      "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.15)",
                      display: "flex",
                      "flex-direction": "column",
                      "justify-content": "space-between",
                      "align-items": "center",
                    }}>
                      {/* 标题 */}
                      <div style={{
                        "font-size": "24px",
                        "font-weight": "700",
                        color: "#333333",
                        "text-align": "center",
                        "margin-top": "12px",
                      }}>
                        新建文件夹
                      </div>

                      {/* 输入框 */}
                      <input
                        type="text"
                        placeholder="请输入文件夹名称"
                        value={newDirName()}
                        onInput={(e) => setNewDirName(e.currentTarget.value)}
                        onKeyDown={(e: KeyboardEvent) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleCreateDirConfirm()
                          } else if (e.key === "Escape") {
                            e.preventDefault()
                            handleCreateDirCancel()
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "36px",
                          padding: "0 12px",
                          border: "1px solid #E0E0E0",
                          "border-radius": "6px",
                          background: "#F8F9FA",
                          "font-size": "13px",
                          color: "#333333",
                          outline: "none",
                          "box-sizing": "border-box",
                          transition: "border-color 0.15s ease",
                          flex: "0 0 auto",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#4285F4"
                          e.currentTarget.style.background = "#FFFFFF"
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#E0E0E0"
                          e.currentTarget.style.background = "#F8F9FA"
                        }}
                        autofocus
                      />

                      {/* 按钮 */}
                      <div style={{
                        display: "flex",
                        gap: "40px",
                        "justify-content": "center",
                      }}>
                        <button
                          onClick={handleCreateDirCancel}
                          disabled={isCreatingDir()}
                          style={{
                            height: "32px",
                            padding: "0 20px",
                            "border-radius": "6px",
                            border: "none",
                            background: isCreatingDir() ? "#E0E0E0" : "#A6A6A6",
                            color: "#FFFFFF",
                            "font-size": "14px",
                            "font-weight": "400",
                            cursor: isCreatingDir() ? "not-allowed" : "pointer",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isCreatingDir()) {
                              e.currentTarget.style.background = "#909090"
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#A6A6A6"
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={handleCreateDirConfirm}
                          disabled={isCreatingDir() || !newDirName().trim()}
                          style={{
                            height: "32px",
                            padding: "0 20px",
                            "border-radius": "6px",
                            border: "none",
                            background: (isCreatingDir() || !newDirName().trim()) ? "#CCCCCC" : "#2A82E4",
                            color: "#FFFFFF",
                            "font-size": "14px",
                            "font-weight": "400",
                            cursor: (isCreatingDir() || !newDirName().trim()) ? "not-allowed" : "pointer",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isCreatingDir() && newDirName().trim()) {
                              e.currentTarget.style.background = "#1A6FC4"
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = (isCreatingDir() || !newDirName().trim()) ? "#CCCCCC" : "#2A82E4"
                          }}
                        >
                          {isCreatingDir() ? "创建中..." : "确定"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 文件/文件夹网格 */}
                {filteredView().length === 0 ? (
                  <div class="cimicode-empty-state">
                    <div class="cimicode-empty-icon">
                      <Icon name="archive" size="large" />
                    </div>
                    <div class="cimicode-empty-text">
                      {searchQuery() ? "未找到匹配的文件" : "暂无数据"}
                    </div>
                  </div>
                ) : (
                  <div class="cimicode-folder-grid">
                    {filteredView().map((item) => (
                      <Tooltip
                        value={
                          <div style={{ padding: "8px 0" }}>
                            <div style={{ "font-weight": "600", "margin-bottom": "4px", "font-size": "13px" }}>
                              {item.name}
                            </div>
                            {item.modifiedTime && (
                              <div style={{ "font-size": "11px", opacity: 0.8 }}>
                                修改日期: {formatTime(item.modifiedTime)}
                              </div>
                            )}
                            {item.type === "file" && item.size && (
                              <div style={{ "font-size": "11px", opacity: 0.8 }}>
                                大小: {formatSize(item.size)}
                              </div>
                            )}
                            <div style={{ "font-size": "11px", opacity: 0.8 }}>
                              类型: {item.type === "directory" ? "文件夹" : "文件"}
                            </div>
                          </div>
                        }
                        placement="top"
                      >
                        <div
                          class={item.type === "directory" ? "cimicode-folder-item" : "cimicode-file-item"}
                          onMouseEnter={() => setHoveredItemPath(item.path)}
                          onMouseLeave={() => setHoveredItemPath(null)}
                          onClick={() => {
                            // 点击文件区域时，如果是文件则下载，文件夹则进入
                            if (item.type === "directory") {
                              navigateToDirectory(item)
                            } else {
                              handleDownload(item)
                            }
                          }}
                        >
                          <FileIcon
                            node={{ path: item.path, type: item.type }}
                            class={item.type === "directory" ? "cimicode-folder-icon" : "cimicode-file-icon"}
                            style={{ "font-size": item.type === "directory" ? "48px" : "40px" }}
                          />
                          {item.type === "directory" && hoveredItemPath() === item.path ? (
                            <div
                              class="cimicode-open-project-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenProject(item)
                              }}
                            >
                              打开项目
                            </div>
                          ) : (
                            <div class={item.type === "directory" ? "cimicode-folder-name" : "cimicode-file-name"}>
                              {item.name}
                            </div>
                          )}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
    </>
  )
}
