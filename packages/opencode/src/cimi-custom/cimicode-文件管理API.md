# cimi 自定义新增的文件操作相关接口

# 文件管理接口文档

### 基础配置

| 配置项 | 说明 |
|--------|------|
| 基础路径前缀 | `/file-manager` |
| 工作目录 | 优先使用环境变量 `WORK_DIR`，否则使用项目目录 |
| 路径格式 | 相对路径，不支持绝对路径（以 `/` 开头会被拒绝） |
| 跨平台 | 完全兼容 Windows 和 Linux |

---

### 1. 上传文件

**接口**: `POST /file-manager/upload`

**请求类型**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 要上传的文件（最大 500MB） |
| path | String | 否 | 目标相对路径，不传则使用原文件名 |

**请求示例**:

```bash
curl -X POST http://localhost:4096/file-manager/upload \
  -F "file=@/path/to/file.txt" \
  -F "path=uploads/subdir"
```

**响应示例**:

成功：
```json
{
  "success": true,
  "path": "uploads/subdir/file.txt",
  "size": 1024
}
```

失败：
```json
{
  "success": false,
  "path": "",
  "error": "Absolute paths are not allowed. Use a relative path."
}
```

**说明**:
- 如果 `path` 指向已存在的目录，文件会自动保存到该目录下（使用原文件名）
- 自动创建不存在的父目录
- 最大文件大小：500MB

---

### 2. 列出目录

**接口**: `GET /file-manager/list`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | String | 否 | 相对路径，默认为根目录 `.` |

**请求示例**:

```bash
curl "http://localhost:4096/file-manager/list?path=uploads"
```

**响应示例**:

成功：
```json
{
  "success": true,
  "path": "uploads",
  "items": [
    {
      "name": "folder1",
      "type": "directory",
      "size": 0,
      "modifiedTime": "2026-03-18T10:00:00.000Z",
      "path": "uploads/folder1"
    },
    {
      "name": "file.txt",
      "type": "file",
      "size": 1024,
      "modifiedTime": "2026-03-18T10:30:00.000Z",
      "path": "uploads/file.txt"
    }
  ]
}
```

**说明**:
- `items` 数组按类型排序：目录在前，文件在后
- `path` 字段可直接用于下载接口
- 列根目录：`?path=` 或不传参数

---

### 3. 下载文件

**接口**: `GET /file-manager/download`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | String | 是 | 文件的相对路径 |

**请求示例**:

```bash
curl -o downloaded.txt "http://localhost:4096/file-manager/download?path=uploads/file.txt"
```

**响应**:
- 成功：二进制文件流
- 失败：JSON 错误信息

**响应头**:

| 响应头 | 说明 |
|--------|------|
| Content-Type | application/octet-stream |
| Content-Disposition | attachment; filename="文件名" |
| Content-Length | 文件大小（字节） |

---

### 4. 下载文件夹

**接口**: `GET /file-manager/download-folder`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | String | 是 | 文件夹的相对路径 |

**请求示例**:

```bash
curl -o folder.zip "http://localhost:4096/file-manager/download-folder?path=uploads/folder1"
```

**响应**:
- 成功：zip 压缩包二进制流
- 失败：JSON 错误信息

**响应头**:

| 响应头 | 说明 |
|--------|------|
| Content-Type | application/zip |
| Content-Disposition | attachment; filename="文件夹名.zip" |
| Content-Length | zip 文件大小（字节） |

**文件夹大小限制**:

| 配置方式 | 参数 | 默认值 | 单位 |
|----------|------|--------|------|
| 环境变量 | `FOLDER_DOWNLOAD_SIZE_LIMIT` | 300 | MB |

**响应示例（超限）**:

```json
{
  "error": "Folder size (500MB) exceeds the limit (300MB). Set FOLDER_DOWNLOAD_SIZE_LIMIT environment variable to adjust."
}
```

---

### 5. 创建文件夹

**接口**: `POST /file-manager/mkdir`

**请求类型**: `application/json`

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|
| path | String | 是 | 要创建的文件夹相对路径 |

**请求示例**:

```bash
curl -X POST http://localhost:4096/file-manager/mkdir \
  -H "Content-Type: application/json" \
  -d '{"path": "uploads/newfolder/subfolder"}'
```

**响应示例**:

成功：
```json
{
  "success": true,
  "path": "uploads/newfolder/subfolder"
}
```

失败：
```json
{
  "error": "Directory already exists"
}
```

**说明**:
- 支持递归创建不存在的父目录
- 文件夹已存在返回 409 Conflict
- 路径已存在但不是文件夹返回 409 Conflict

---

### 6. 删除文件或文件夹

**接口**: `DELETE /file-manager/delete`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | String | 是 | 要删除的文件或文件夹相对路径 |

**请求示例**:

```bash
# 删除文件
curl -X DELETE "http://localhost:4096/file-manager/delete?path=uploads/file.txt"

# 删除文件夹（递归删除）
curl -X DELETE "http://localhost:4096/file-manager/delete?path=uploads/folder1"
```

**响应示例**:

成功：
```json
{
  "success": true,
  "path": "uploads/file.txt"
}
```

失败：
```json
{
  "error": "File or directory not found"
}
```

**说明**:
- 自动判断是文件还是文件夹
- 删除文件夹时会递归删除所有内容
- 文件或目录不存在返回 404

---

## 错误码说明

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误（如绝对路径、路径不存在但要求是目录等） |
| 404 | 文件或目录不存在 |
| 409 | 资源冲突（如目录已存在） |
| 500 | 服务器内部错误 |

## 安全说明

- **路径遍历防护**: 拒绝 `../` 等路径遍历尝试
- **绝对路径拒绝**: 不允许以 `/` 开头的路径
- **工作目录限制**: 所有操作限制在工作目录（`WORK_DIR` 或项目目录）内
- **文件大小限制**: 上传文件最大 500MB
- **文件夹大小限制**: 下载文件夹默认最大 300MB，可通过环境变量调整