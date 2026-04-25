/**
 * Web File Transfer API
 *
 * This module provides file upload and download functionality for the web version.
 */

export interface FileInfo {
  name: string
  path: string
  type: "file" | "directory"
  size?: number
  modifiedTime?: string
  children?: FileInfo[]
}

export interface UploadResult {
  success: boolean
  message?: string
  path?: string
}

export interface DownloadResult {
  success: boolean
  message?: string
  data?: Blob
  filename?: string
}

/**
 * File Transfer API client
 */
export const webFileTransferApi = {
  /**
   * List files in a directory
   * GET /file-manager/list?path=<path>
   * @param serverUrl - The base URL of the server (e.g., "http://localhost:4096")
   * @param path - The path to list (default: /workspace)
   */
  async listFiles(serverUrl: string, path: string = ""): Promise<FileInfo[]> {
    try {
      const url = new URL("/file-manager/list", serverUrl)
      if (path) {
        url.searchParams.set("path", path)
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error("[WebFileTransfer] listFiles error:", error)
      throw error
    }
  },

  /**
   * Upload a file to the workspace
   * POST /file-manager/upload
   * @param serverUrl - The base URL of the server (e.g., "http://localhost:4096")
   * @param file - The file to upload
   * @param path - The target path (optional, default: /workspace)
   * @param onProgress - Progress callback
   */
  async uploadFile(
    serverUrl: string,
    file: File,
    path: string = "",
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      if (path) {
        formData.append("path", path)
      }

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error("Invalid response from server"))
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"))
      })

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was aborted"))
      })

      xhr.open("POST", `${serverUrl}/file-manager/upload`)
      xhr.send(formData)
    })
  },

  /**
   * Download a file from the workspace
   * GET /file-manager/download?path=<path>
   * @param serverUrl - The base URL of the server (e.g., "http://localhost:4096")
   * @param filePath - The path of the file to download
   */
  async downloadFile(serverUrl: string, filePath: string): Promise<DownloadResult> {
    try {
      const url = new URL("/file-manager/download", serverUrl)
      url.searchParams.set("path", filePath)

      const response = await fetch(url.toString(), {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = filePath.split("/").pop() || "download"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
        }
      }

      const blob = await response.blob()

      return {
        success: true,
        data: blob,
        filename,
      }
    } catch (error) {
      console.error("[WebFileTransfer] downloadFile error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Download failed",
      }
    }
  },

  /**
   * Create a directory
   * POST /file-manager/mkdir
   * @param serverUrl - The base URL of the server (e.g., "http://localhost:4096")
   * @param path - The directory path to create
   */
  async createDirectory(serverUrl: string, path: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${serverUrl}/file-manager/mkdir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create directory: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("[WebFileTransfer] createDirectory error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create directory",
      }
    }
  },

  /**
   * Download a directory as a zip file
   * Note: This feature is not available in the current API specification.
   * Users should download individual files instead.
   * @param serverUrl - The base URL of the server (e.g., "http://localhost:4096")
   * @param directoryPath - The path of the directory
   */
  async downloadDirectory(serverUrl: string, directoryPath: string): Promise<DownloadResult> {
    // Note: The current API specification does not include directory download
    // This would require server-side zip creation functionality
    console.warn("[WebFileTransfer] downloadDirectory is not supported by the current API")
    return {
      success: false,
      message: "Directory download is not supported. Please download individual files.",
    }
  },
}

/**
 * Helper function to trigger browser download
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
