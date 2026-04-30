import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { uploadHandler, downloadHandler, listHandler, createDirectoryHandler, deleteHandler } from "../file-manager"
// import { downloadFolderHandler } from "../file-manager" // 已合并到 /download
import { lazy } from "@/util/lazy"

export const FileManagerRoutes = lazy(() =>
  new Hono()
    // POST /upload - 上传文件
    .post(
      "/upload",
      describeRoute({
        summary: "Upload file",
        description: "Upload a file to the specified path in the project directory. Supports files up to 500MB.",
        operationId: "file.upload",
        responses: {
          200: {
            description: "Upload result",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    path: z.string(),
                    size: z.number().optional(),
                    error: z.string().optional(),
                  }),
                ),
              },
            },
          },
        },
      }),
      async (c) => {
        const result = await uploadHandler(c)
        return c.json(result)
      },
    )
    // POST /mkdir - 创建文件夹
    .post(
      "/mkdir",
      describeRoute({
        summary: "Create directory",
        description: "Create a directory at the specified path in the project directory.",
        operationId: "file.mkdir",
        responses: {
          200: {
            description: "Directory created successfully",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    path: z.string(),
                    error: z.string().optional(),
                  }),
                ),
              },
            },
          },
          400: {
            description: "Invalid path",
          },
          409: {
            description: "Directory already exists or path is not a directory",
          },
          500: {
            description: "Internal server error",
          },
        },
      }),
      async (c) => {
        return createDirectoryHandler(c)
      },
    )
    // GET /list - 列出目录
    .get(
      "/list",
      describeRoute({
        summary: "List directory",
        description: "List all files and directories in the specified path.",
        operationId: "file.list",
        responses: {
          200: {
            description: "Directory contents",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    path: z.string(),
                    items: z.array(
                      z.object({
                        name: z.string(),
                        type: z.enum(["file", "directory"]),
                        size: z.number(),
                        modifiedTime: z.string(),
                        path: z.string(),
                      }),
                    ),
                  }),
                ),
              },
            },
          },
          400: {
            description: "Invalid path",
          },
          404: {
            description: "Directory not found",
          },
        },
      }),
      async (c) => {
        return listHandler(c)
      },
    )
    // GET /download - 下载文件或文件夹（文件夹自动打包为 zip）
    .get(
      "/download",
      describeRoute({
        summary: "Download file or folder",
        description: "Download a file or folder from the specified path. Folders are automatically packaged as a zip archive.",
        operationId: "file.download",
        responses: {
          200: {
            description: "File content or zip archive",
            content: {
              "application/octet-stream": {
                schema: resolver(z.any()),
              },
            },
          },
          400: {
            description: "Invalid path or folder size exceeds limit",
          },
          404: {
            description: "File or directory not found",
          },
          500: {
            description: "Failed to create zip archive",
          },
        },
      }),
      async (c) => {
        return downloadHandler(c)
      },
    )
    // [已废弃] /download-folder 已合并到 /download，后端自动判断文件/文件夹
    // .get(
    //   "/download-folder",
    //   describeRoute({
    //     summary: "Download folder as zip",
    //     description: "Download a folder as a zip archive from the specified path in the project directory.",
    //     operationId: "file.downloadFolder",
    //     responses: {
    //       200: {
    //         description: "Zip archive",
    //         content: {
    //           "application/zip": {
    //             schema: resolver(z.any()),
    //           },
    //         },
    //       },
    //       400: {
    //         description: "Invalid path or not a directory",
    //       },
    //       404: {
    //         description: "Directory not found",
    //       },
    //       500: {
    //         description: "Failed to create zip archive",
    //       },
    //     },
    //   }),
    //   async (c) => {
    //     return downloadFolderHandler(c)
    //   },
    // )
    // DELETE /delete - 删除文件或文件夹
    .delete(
      "/delete",
      describeRoute({
        summary: "Delete file or folder",
        description: "Delete a file or folder at the specified path in the project directory.",
        operationId: "file.delete",
        responses: {
          200: {
            description: "Deleted successfully",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({
                    success: z.boolean(),
                    path: z.string(),
                    error: z.string().optional(),
                  }),
                ),
              },
            },
          },
          400: {
            description: "Invalid path",
          },
          404: {
            description: "File or directory not found",
          },
          500: {
            description: "Failed to delete",
          },
        },
      }),
      async (c) => {
        return deleteHandler(c)
      },
    )
)