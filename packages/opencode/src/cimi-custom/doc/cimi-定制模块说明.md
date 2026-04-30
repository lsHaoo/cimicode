# CimiCode 定制模块说明

## 概述

`cimi-custom/` 目录包含 CimiCode 的所有定制/业务逻辑，与上游 opencode 源码隔离，方便后续源码升级时减少冲突。

## 目录结构

```
cimi-custom/
├── index.ts                        # 统一导出入口
├── routes/                         # Hono 路由定义
│   ├── index.ts                    # 路由聚合入口（CimiCustomRoutes），被 server.ts 调用
│   ├── file-manager.ts             # 文件管理 API
│   ├── skill-manager.ts            # Skill 管理 API
│   ├── restart.ts                  # 服务重启 API
│   ├── agi-proxy.ts                # AGI 接口代理
│   └── web-ui-proxy.ts             # 自定义 WebUI 代理
├── file-manager/                   # 文件管理业务逻辑
│   ├── index.ts
│   ├── upload.ts                   # 上传（含 YST 解密）
│   ├── download.ts                 # 单文件下载
│   ├── download-folder.ts          # [已废弃] 合并到 download.ts
│   ├── list.ts                     # 目录列表
│   ├── mkdir.ts                    # 创建目录
│   ├── delete.ts                   # 删除文件或目录
│   ├── types.ts                    # 类型定义
│   └── utils.ts                    # 工具函数（路径校验、安全检查）
├── skill-manager/                  # Skill 管理业务逻辑
│   ├── index.ts
│   ├── status.ts                   # 查询 skill 状态
│   ├── install.ts                  # 安装 skill（从 URL 下载 zip）
│   ├── uninstall.ts                # 卸载 skill
│   ├── enable.ts                   # 启用 skill（修改全局配置）
│   ├── disable.ts                  # 禁用 skill
│   └── types.ts                    # Zod schema 定义
├── doc/                            # 文档
│   ├── cimi-定制模块说明.md         # 本文件
│   ├── cimi-文件管理API.md          # 文件管理 API 文档
│   ├── cimi-skill管理API.md         # Skill 管理 API 文档
│   └── 老版本迁移说明.md            # 迁移注意事项
└── scripts/                        # 运维脚本
    ├── start.sh                    # 启动服务
    ├── stop.sh                     # 停止服务
    ├── restart.sh                  # 重启服务
    ├── build-for-coder.ts          # Coder 平台构建脚本
    └── batch-update-workspace.cjs  # Coder workspace 批量更新
```

## 集成方式

定制路由通过 `server.ts` 集成，路由注册在 InstanceMiddleware 之后，自动拥有 Instance 上下文。

> **⚠️ 对上游代码的侵入修改（仅 1 个文件，约 4 行）：**
>
> | 文件 | 改动 | 说明 |
> |------|------|------|
> | `packages/opencode/src/server/server.ts` | 新增 1 行 import + 2 个分支各 1 行 `.route()` 调用；注释掉分支 2 的 `UIRoutes()` | 上游合并时搜索 `[CimiCode 定制]` 定位所有改动 |
>
> ```diff
>  + // [CimiCode 定制] 合并上游代码时务必保留此 import
>  + import { CimiCustomRoutes } from "@/cimi-custom/routes"
>
>   // 分支 1（OPENCODE_WORKSPACE_ID 模式）：
>   .route("/", InstanceRoutes(runtime.upgradeWebSocket))
>  + // [CimiCode 定制] 合并上游代码时务必保留此行
>  + .route("/", CimiCustomRoutes())
>
>   // 分支 2（普通模式）：
>   .route("/", InstanceRoutes(runtime.upgradeWebSocket))
>  - .route("/", UIRoutes())
>  + // [CimiCode 定制] UIRoutes 已被自定义 WebUI 代理替代，合并时保留注释
>  + // .route("/", UIRoutes())
>  + // [CimiCode 定制] 合并上游代码时务必保留此行
>  + .route("/", CimiCustomRoutes())
> ```
>
> **上游升级时注意**：合并上游代码时在 `server.ts` 中搜索 `[CimiCode 定制]` 即可定位所有改动点。

**adapter 文件（adapter.bun.ts、adapter.node.ts）无任何修改。** 所有定制代码均在 `cimi-custom/` 目录内，对上游的侵入仅上述 1 个文件。

## 功能模块详细说明

### 1. 文件管理 API

**路由前缀**: `/file-manager`

| 端点 | 方法 | 说明 |
|------|------|------|
| `/file-manager/upload` | POST | 上传文件，支持 YST 解密 |
| `/file-manager/mkdir` | POST | 创建目录 |
| `/file-manager/list` | GET | 列出目录内容 |
| `/file-manager/download` | GET | 下载文件或文件夹（文件夹自动打包为 zip） |
| ~~`/file-manager/download-folder`~~ | ~~GET~~ | ~~已废弃，合并到 `/download`~~ |
| `/file-manager/delete` | DELETE | 删除文件或目录 |

**安全机制**:
- 所有路径操作基于 `WORK_DIR` 环境变量或 `Instance.directory`
- 禁止绝对路径，防止路径逃逸（`validatePath` 检查路径必须在工作目录内）
- 上传文件大小限制 500MB
- 文件夹下载大小限制 300MB（可通过 `FOLDER_DOWNLOAD_SIZE_LIMIT` 环境变量调整）

**YST 解密流程**（upload）:
```
上传文件 → 写入临时文件 → 调用 YST 解密服务
  ├─ returnFlag=0 → 解密成功，用解密后数据
  ├─ returnFlag=2 → 无需解密，用原始数据
  └─ 其他 → 抛出异常
→ 原子重命名到目标路径（跨驱动器时 copy+delete）
```

YST 服务地址优先级：`CXMT_YST_URL` 环境变量 > Config 配置 > 默认值

**下载流程**（download，统一接口）:
```
校验路径和目标存在 → stat 判断类型
  ├─ 文件 → 流式返回文件
  └─ 文件夹 → du -sb 计算文件夹大小
  └─ 文件夹超过限制（默认 300MB）→ 拒绝
→ 递归遍历目录 → @zip.js/zip.js 打包为 zip
→ 返回 zip 流
```

> 注意：`getFolderSize` 使用 Linux `du -sb` 命令，Windows 本地开发时该命令不存在，会跳过大小检查。生产环境（Coder Linux 容器）不受影响。

### 2. Skill 管理 API

**路由前缀**: `/skill-manager`

| 端点 | 方法 | 说明 |
|------|------|------|
| `/skill-manager/status` | GET | 查询 skill 状态（是否存在、是否启用） |
| `/skill-manager/install` | POST | 从 URL 下载 zip 安装 skill |
| `/skill-manager/uninstall` | DELETE | 卸载 skill（删除目录） |
| `/skill-manager/enable` | PUT | 启用 skill（修改全局配置中的权限） |
| `/skill-manager/disable` | PUT | 禁用 skill |

**Skill 安装流程**:
```
下载 zip → 校验 SKILL.md 存在 → 防止 Zip Slip 攻击
→ 解压到临时目录 → 原子重命名到目标目录
→ dispose 实例触发重载
```

Skill 安装目录: `{Global.Path.config}/skills/{skillName}/`

**权限控制**: 通过 Config 的 `permission.skill` 字段管理，值为 `"allow"` / `"deny"` 或按 skill 名称细粒度控制。

### 3. 服务重启 API

**路由前缀**: `/reload`

| 端点 | 方法 | 说明 |
|------|------|------|
| `/reload` | POST | 重启服务 |

流程：先返回响应，延迟 1 秒后执行 `nohup bash /tmp/scripts/restart.sh`，确保响应已发送。

> 仅用于 Web 端部署场景。依赖 Bun 运行时的 `Bun.spawn`，在独立二进制和 Bun 运行时中可用。

### 4. AGI 代理

**路由前缀**: `/api/agi`

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/agi/*` | ALL | 透传代理到 AGI 后端 |

根据 `OC_ENVIRONMENT` 环境变量选择目标：
- `test` → `http://t-app.cdtp.com`
- 其他 → `http://app.cxmt.com`

请求 headers、body、query 全部透传，日志记录 headers 时过滤敏感信息（authorization, cookie 等）。

### 5. 自定义 WebUI 代理

**路由前缀**: `/`（catch-all）

通过 `CIMICODE_WEB_URL` 环境变量控制：
- **未设置**: 不注册路由，上游 `UIRoutes()` 正常生效（代理到 `app.opencode.ai` 或嵌入式 UI）
- **已设置**: 注册 `/*` catch-all，代理到自定义 WebUI 地址

```
请求 "/" → 补 index.html → 代理到 CIMICODE_WEB_URL
请求 "/xxx" → 代理到 CIMICODE_WEB_URL/xxx
  └─ 非 200 且无 "." → fallback 到 /index.html（SPA 路由）
```

所有响应添加 CSP 和 Cache-Control headers。

## 请求流程总览

```
HTTP 请求
  ↓
server.ts 中间件（Auth、CORS、Logger、Compression）
  ↓
adapter.create(app)                 ← 无定制改动
  ↓
InstanceMiddleware                  ← 创建 Instance 上下文
  ↓
上游路由: ControlPlane → Workspace → InstanceRoutes
  ↓ (未匹配的请求继续)
CimiCustomRoutes()                  ← 定制路由（有 Instance 上下文）
  ├─ /file-manager/*    → FileManagerRoutes
  ├─ /skill-manager/*   → SkillManagerRoutes
  ├─ /reload            → RestartRoutes
  ├─ /api/agi/*         → AgiProxyRoutes
  └─ /* (可选)          → WebUIProxyRoutes (仅当 CIMICODE_WEB_URL 有值)
```

## 环境变量

| 变量 | 用途 | 示例 |
|------|------|------|
| `CIMICODE_WEB_URL` | 自定义 WebUI 代理地址 | `http://127.0.0.1:13001` |
| `OC_ENVIRONMENT` | AGI 代理环境（test/其他） | `test` |
| `CXMT_YST_URL` | YST 解密服务地址 | `http://10.128.246.22:8081/...` |
| `WORK_DIR` | 文件管理根目录 | `/home/user/project` |
| `FOLDER_DOWNLOAD_SIZE_LIMIT` | 文件夹下载大小限制（MB） | `300` |

## 关键技术决策

1. **Effect 适配**: 新版 opencode 大量使用 Effect 框架管理服务。cimi-custom 中通过 `AppRuntime.runPromise(Service.use(...))` 在 Hono 路由处理函数中访问 Effect 服务（Config、Skill 等）。
2. **路径别名**: 使用 `@/` 代替相对路径引用（`@/` = `packages/opencode/src/`），避免目录层级变动导致路径错误。
3. **模块来源变更**: 部分模块从 opencode 包迁到了 core 包，如 `NamedError` 从 `@opencode-ai/util/error` → `@opencode-ai/core/util/error`，`Global` 从 `@/global` → `@opencode-ai/core/global`。
