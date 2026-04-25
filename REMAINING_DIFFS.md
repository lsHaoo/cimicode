# 剩余差异逐文件清单

> 旧项目: `E:\code\cimicode\cimicode` → 新项目: `e:\code\new_cimicode\cimicode`
> 日期: 2026-04-25
> 共 185 个文件有差异

---

## 组 A: 仅旧项目存在的文件 — 建议复制到新项目（20 个）

这些文件在旧项目中存在但在新项目中完全缺失，是 CimiCode 的业务功能。

### A1. 组件（8 个）
| # | 文件 | 行数 | 说明 | 操作 |
|---|------|------|------|------|
| 1 | `packages/app/src/components/app-loading.tsx` | 178 | CimiCode 品牌启动屏（带动画 logo 和进度条） | 复制 |
| 2 | `packages/app/src/components/dialog-download-file.tsx` | 1873 | Studio 风格文件浏览器（远程工作区文件下载/上传/创建目录） | 复制 |
| 3 | `packages/app/src/components/dialog-upload-file.tsx` | 536 | 文件/文件夹上传对话框（拖拽、进度、批量上传） | 复制 |
| 4 | `packages/app/src/components/dialog-quick-setup-preset.tsx` | 357 | 预设 AI 模型快捷设置对话框（从远程获取模型列表） | 复制 |
| 5 | `packages/app/src/components/dialog-skills.tsx` | 421 | Skills 市场对话框（"我的技能"/"市场"标签、安装/卸载） | 复制 |
| 6 | `packages/app/src/components/dialog-skills-state.ts` | 94 | Skills 对话框状态逻辑（搜索、选择同步、按钮状态） | 复制 |
| 7 | `packages/app/src/components/web-file-transfer.tsx` | 98 | Web 平台标题栏上传/下载/重启按钮 Portal | 复制 |
| 8 | `packages/app/src/components/window-controls.tsx` | 126 | Windows 最小化/最大化/关闭标题栏按钮（Tauri） | 复制 |

### A2. Hooks（1 个）
| # | 文件 | 行数 | 说明 | 操作 |
|---|------|------|------|------|
| 9 | `packages/app/src/hooks/use-preset-models.ts` | 95 | 预设模型列表获取 hook（远程 JSON + 5 分钟自动刷新） | 复制 |

### A3. Pages（2 个）
| # | 文件 | 行数 | 说明 | 操作 |
|---|------|------|------|------|
| 10 | `packages/app/src/pages/session/file-tabs-preview.ts` | 15 | 判断文件标签是否可预览的工具函数 | 复制 |
| 11 | `packages/app/src/pages/session/review-panel.tsx` | 296 | 桌面端可调整大小的侧边面板（文件标签 + 拖拽排序） | 复制 |

### A4. Utils（4 个）
| # | 文件 | 行数 | 说明 | 操作 |
|---|------|------|------|------|
| 12 | `packages/app/src/utils/cimi.ts` | 56 | Cimi 认证 token 读写（URL query → sessionStorage） | 复制 |
| 13 | `packages/app/src/utils/reload.ts` | 12 | iframe 上下文检测 + 重启服务消息 | 复制 |
| 14 | `packages/app/src/utils/skills.ts` | 481 | Skills API 客户端（市场浏览、安装、卸载、状态检查） | 复制 |
| 15 | `packages/app/src/utils/web-file-transfer.ts` | 229 | Web 文件操作 API（列表、上传、下载、创建目录） | 复制 |

### A5. Assets（1 个）
| # | 文件 | 说明 | 操作 |
|---|------|------|------|
| 16 | `packages/app/src/assets/cimicode-icon.svg` | CimiCode 应用图标 | 复制 |

### A6. Testing（4 个）
| # | 文件 | 行数 | 说明 | 操作 |
|---|------|------|------|------|
| 17 | `packages/app/src/testing/model-selection.ts` | 81 | E2E 模型选择状态探针 | 复制 |
| 18 | `packages/app/src/testing/prompt.ts` | 57 | E2E prompt 弹出状态探针 | 复制 |
| 19 | `packages/app/src/testing/session-composer.ts` | 85 | E2E session composer 状态探针 | 复制 |
| 20 | `packages/app/src/testing/terminal.ts` | 119 | E2E terminal 实例状态探针 | 复制 |

---

## 组 B: 品牌还原文件 — 建议用旧项目覆盖（~26 个）

这些文件的新版本将 CimiCode 品牌恢复为 OpenCode，需要用旧版本覆盖。

### B1. packages/app 核心品牌文件（10 个）
| # | 文件 | 旧→新变化 | 操作 |
|---|------|-----------|------|
| 1 | `src/entry.tsx` | 移除 `cimiBoot()`、iframe 限制、中文"访问受限"页面 | 覆盖 |
| 2 | `src/env.d.ts` | `VITE_CIMI_SKILL_DOWNLOAD_BASE` → `VITE_OPENCODE_CHANNEL` | 覆盖 |
| 3 | `src/utils/persist.ts` | 存储键 `cimicode.*` → `opencode.*` | 覆盖 |
| 4 | `src/context/prompt.tsx` | 移除 CimiCode provider/env 过滤 | 覆盖⚠️ |
| 5 | `src/context/terminal-title.ts` | 移除 i18n locale 导入，简化为英文模板 | 覆盖 |
| 6 | `src/components/titlebar.tsx` | 移除 CXMT 远程 logo、标题居左→居中 | 覆盖⚠️ |
| 7 | `src/components/dialog-select-provider.tsx` | 移除 "CXMT Cimi" 预设、cimi→opencode i18n 键 | 覆盖⚠️ |
| 8 | `src/components/dialog-select-model-unpaid.tsx` | cimi/cimigo tagline → opencode/opencodeGo | 覆盖 |
| 9 | `src/components/settings-providers.tsx` | 移除 Cimi 编辑路由和 DialogQuickSetupPreset | 覆盖⚠️ |
| 10 | `src/pages/session/session-new-view.tsx` | 移除中文"智多鑫Cimi"回退，使用 OpenCode Logo | 覆盖⚠️ |

### B2. packages/app 品牌相关（5 个）
| # | 文件 | 旧→新变化 | 操作 |
|---|------|-----------|------|
| 11 | `src/pages/home.tsx` | 远程 CimiCode logo → OpenCode Logo，移除 DialogDownloadFile | 覆盖⚠️ |
| 12 | `src/pages/error.tsx` | 远程 CimiCode logo → OpenCode Logo | 覆盖 |
| 13 | `src/pages/layout/deep-links.ts` | `cimicode://` → `opencode://`、`__CIMICODE__` → `__OPENCODE__` | 覆盖 |
| 14 | `src/components/dialog-settings.tsx` | 移除 `"Cimi Web"` 平台名 | 覆盖 |
| 15 | `src/components/prompt-input.tsx` | 移除 web-only "Skills" 按钮、取消注释 variant 控件 | 覆盖⚠️ |

### B3. packages/app i18n（18 个）
所有语言文件都有品牌键名差异。旧项目使用 `cimi`/`cimigo`，新项目使用 `opencode`/`opencodeGo`。

| # | 文件 | 操作 |
|---|------|------|
| 16-33 | `src/i18n/ar.ts`, `br.ts`, `bs.ts`, `da.ts`, `de.ts`, `en.ts`, `es.ts`, `fr.ts`, `ja.ts`, `ko.ts`, `no.ts`, `pl.ts`, `ru.ts`, `th.ts`, `tr.ts`, `zh.ts`, `zht.ts` | 全部覆盖 |

### B4. packages/ui 品牌相关（差异已在 Phase 7 处理，但 packages/app 的 i18n 未处理）

---

## 组 C: 功能升级文件 — 建议保留新项目版本（~90 个）

这些文件包含新项目的重要功能升级，**不建议覆盖**：

### C1. packages/app 组件功能升级（17 个）
| # | 文件 | 新项目升级内容 |
|---|------|---------------|
| 1 | `src/components/debug-bar.tsx` | CSS design tokens 替代硬编码颜色 |
| 2 | `src/components/dialog-connect-provider.tsx` | useMutation 重构、MCP 自动检测、loading spinner |
| 3 | `src/components/dialog-custom-provider-form.ts` | 移除冗余类型，内联到其他文件 |
| 4 | `src/components/dialog-custom-provider.tsx` | 简化为仅创建模式 |
| 5 | `src/components/dialog-edit-project.tsx` | useMutation 重构 |
| 6 | `src/components/dialog-select-mcp.tsx` | useMutation 替代手动信号 |
| 7 | `src/components/dialog-select-model.tsx` | 懒加载导入、移除自定义 provider 编辑 |
| 8 | `src/components/dialog-select-server.tsx` | useMutation、布局改进 |
| 9 | `src/components/prompt-input/attachments.ts` | 共享常量提取 |
| 10 | `src/components/prompt-input/build-request-parts.ts` | @-mention 解析 |
| 11 | `src/components/prompt-input/files.ts` | 移除 web 上传逻辑 |
| 12 | `src/components/prompt-input/image-attachments.tsx` | Tooltip 显示完整文件名 |
| 13 | `src/components/prompt-input/submit.ts` | variant 内联、batch() 优化 |
| 14 | `src/components/session/session-header.tsx` | 工具栏可见性控制 |
| 15 | `src/components/session/session-context-tab.tsx` | 取消注释 provider 显示 |
| 16 | `src/components/session-context-usage.tsx` | 取消注释 cost 显示 |
| 17 | `src/components/settings-general.tsx` | 字体设置拆分（sans/mono/terminal） |

### C2. packages/app 上下文功能升级（24 个）
| # | 文件 | 新项目升级内容 |
|---|------|---------------|
| 18-41 | `src/context/command.tsx`, `file.tsx`, `file/tree-store.ts`, `global-sdk.tsx`, `global-sync.tsx`, `global-sync/bootstrap.ts`, `child-store.ts`, `event-reducer.ts`, `queue.ts`, `session-cache.ts`, `types.ts`, `utils.ts`, `language.tsx`, `layout.tsx`, `local.tsx`, `models.tsx`, `notification.tsx`, `platform.tsx`, `server.tsx`, `settings.tsx`, `sync.tsx`, `terminal.tsx`, `src/hooks/use-providers.ts`, `src/utils/agent.ts` | tanstack-query 迁移、makeEventListener、SnapshotFileDiff、字体设置拆分、懒加载 locale、健康检查缓存、agent 标准化等 |

### C3. packages/app 页面功能升级（15 个）
| # | 文件 | 新项目升级内容 |
|---|------|---------------|
| 42-56 | `src/pages/directory-layout.tsx`, `layout.tsx`, `helpers.ts`, `sidebar-items.tsx`, `sidebar-project.tsx`, `sidebar-shell.tsx`, `sidebar-workspace.tsx`, `session.tsx`, `session/composer/*.tsx` (4个), `file-tabs.tsx`, `helpers.ts`, `message-timeline.tsx`, `session-side-panel.tsx`, `terminal-panel.tsx`, `use-session-commands.tsx`, `use-session-hash-scroll.ts` | tanstack-query、拖拽排序、滚动同步、懒加载、resize observer 等 |

### C4. packages/app 其他功能升级（8 个）
| # | 文件 | 新项目升级内容 |
|---|------|---------------|
| 57-64 | `src/utils/server-health.ts`, `server.ts`, `sound.ts`, `src/index.css`, `src/index.ts`, `src/pages/session/review-tab.tsx`, `src/components/terminal.tsx`, `src/components/file-tree.tsx` | 健康检查缓存、动态音频加载、字体注册、SnapshotFileDiff、terminal auth |

### C5. packages/app 代码清理（10 个）
| # | 文件 | 说明 |
|---|------|------|
| 65-74 | `dialog-select-directory.tsx`, `dialog-select-file.tsx`, `file-tree.tsx`, `model-tooltip.tsx`, `prompt-input/history.ts`, `server/server-row.tsx`, `session-sortable-terminal-tab.tsx`, `settings-keybinds.tsx`, `settings-list.tsx`, `custom-elements.d.ts` | import 整理、void 前缀、类型简化、makeEventListener 迁移 |

### C6. packages/ui 组件差异（52 个）
| # | 说明 |
|---|------|
| 75-126 | 约 52 个 UI 组件文件有差异，主要是 classList `?? {}` 清理、CSS flex 安全改进、solid-primitives 迁移、sprite 重新生成等。**全部建议保留新项目版本。** |

---

## ⚠️ 标记说明

标记 `⚠️` 的文件（组 B 中的 1, 4, 6, 7, 9, 10, 11, 15）是**混合变化**——既有品牌还原（需要用旧版），又有功能升级（需要保留新版）。这些文件不能直接覆盖，需要手动合并：

- `src/context/prompt.tsx` — 品牌过滤 + provider_ready 逻辑
- `src/components/titlebar.tsx` — 远程 logo + 可见性控制
- `src/components/dialog-select-provider.tsx` — CXMT Cimi 预设 + useProviders hook
- `src/components/settings-providers.tsx` — Cimi 路由 + 宽度约束
- `src/pages/session/session-new-view.tsx` — Cimi logo + 取消注释内容
- `src/pages/home.tsx` — Cimi logo + 服务状态点
- `src/components/prompt-input.tsx` — Skills 按钮 + agent 查询
- `src/pages/layout/deep-links.ts` — 纯品牌，可直接覆盖

---

## 推荐执行顺序

1. **先复制组 A（20 个缺失文件）** — 直接 cp，无冲突
2. **再覆盖组 B（26 个品牌文件）** — 其中 7 个标记 ⚠️ 的需手动合并
3. **跳过组 C（90 个功能升级文件）** — 保留新项目版本
