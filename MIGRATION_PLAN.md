# 旧项目 → 新项目 差异修复计划

> 旧项目: `E:\code\cimicode\cimicode`
> 新项目: `e:\code\new_cimicode\cimicode`
> 方向: 旧 → 新（将旧项目的自定义内容迁移到新项目）

---

## Phase 1: 品牌与配置 (packages/app)

### 1.1 环境变量文件（仅旧项目存在）
- [ ] **复制** `packages/app/.env.development`
  - 内容: `VITE_CIMI_SKILL_DOWNLOAD_BASE=http://t-app.cdtp.com/api/agi/chat`
- [ ] **复制** `packages/app/.env.production`
  - 内容: `VITE_CIMI_SKILL_DOWNLOAD_BASE=http://app.cxmt.com/api/agi/chat`

### 1.2 index.html 品牌修改
- [ ] **还原** `packages/app/index.html`
  - viewport meta: 移除 `interactive-widget=resizes-content` 属性
  - 标题: `OpenCode` → `CimiCode`
  - noscript 块: 恢复双语（英文+中文）样式化回退消息

### 1.3 .gitignore 还原
- [ ] **还原** `packages/app/.gitignore`
  - 添加回 `dist-development` 和 `dist-production` 两行

### 1.4 README.md 还原
- [ ] **还原** `packages/app/README.md`
  - 恢复 iframe embedding 章节（7 行 CSP 和同源代理说明）
  - 恢复 Playwright webServer 描述
  - 恢复 `bunx playwright install`（不带 `chromium`）

### 1.5 e2e/tsconfig.json 还原
- [ ] **还原** `packages/app/e2e/tsconfig.json`
  - include 数组中添加回 `"../src/testing/terminal.ts"`

---

## Phase 2: E2E 测试套件 (packages/app)

### 2.1 复制 E2E 基础文件（仅旧项目存在）
- [ ] **复制** `packages/app/e2e/AGENTS.md`
- [ ] **复制** `packages/app/e2e/actions.ts`
- [ ] **复制** `packages/app/e2e/fixtures.ts`
- [ ] **复制** `packages/app/e2e/selectors.ts`
- [ ] **复制** `packages/app/e2e/utils.ts`

### 2.2 复制 E2E 子目录（仅旧项目存在，共 55 个 .spec.ts 文件）
- [ ] **复制** `packages/app/e2e/app/` (6 个 spec)
  - `home.spec.ts`, `navigation.spec.ts`, `palette.spec.ts`, `server-default.spec.ts`, `session.spec.ts`, `titlebar-history.spec.ts`
- [ ] **复制** `packages/app/e2e/commands/` (3 个 spec)
  - `input-focus.spec.ts`, `panels.spec.ts`, `tab-close.spec.ts`
- [ ] **复制** `packages/app/e2e/files/` (3 个 spec)
  - `file-open.spec.ts`, `file-tree.spec.ts`, `file-viewer.spec.ts`
- [ ] **复制** `packages/app/e2e/models/` (2 个 spec)
  - `model-picker.spec.ts`, `models-visibility.spec.ts`
- [ ] **复制** `packages/app/e2e/projects/` (5 个 spec)
  - `project-edit.spec.ts`, `projects-close.spec.ts`, `projects-switch.spec.ts`, `workspace-new-session.spec.ts`, `workspaces.spec.ts`
- [ ] **复制** `packages/app/e2e/prompt/` (11 个 spec)
  - `context.spec.ts`, `prompt-async.spec.ts`, `prompt-drop-file-uri.spec.ts`, `prompt-drop-file.spec.ts`, `prompt-history.spec.ts`, `prompt-mention.spec.ts`, `prompt-multiline.spec.ts`, `prompt-shell.spec.ts`, `prompt-slash-open.spec.ts`, `prompt-slash-share.spec.ts`, `prompt-slash-terminal.spec.ts`, `prompt.spec.ts`
- [ ] **复制** `packages/app/e2e/session/` (6 个 spec)
  - `session-child-navigation.spec.ts`, `session-composer-dock.spec.ts`, `session-model-persistence.spec.ts`, `session-review.spec.ts`, `session-undo-redo.spec.ts`, `session.spec.ts`
- [ ] **复制** `packages/app/e2e/settings/` (4 个 spec)
  - `settings-keybinds.spec.ts`, `settings-models.spec.ts`, `settings-providers.spec.ts`, `settings.spec.ts`
- [ ] **复制** `packages/app/e2e/sidebar/` (3 个 spec)
  - `sidebar-popover-actions.spec.ts`, `sidebar-session-links.spec.ts`, `sidebar.spec.ts`
- [ ] **复制** `packages/app/e2e/status/` (1 个 spec)
  - `status-popover.spec.ts`
- [ ] **复制** `packages/app/e2e/terminal/` (4 个 spec)
  - `terminal-init.spec.ts`, `terminal-reconnect.spec.ts`, `terminal-tabs.spec.ts`, `terminal.spec.ts`
- [ ] **复制** `packages/app/e2e/thinking-level.spec.ts`

---

## Phase 3: 自定义主题与字体 (packages/ui)

### 3.1 自定义主题文件（仅旧项目存在）
- [ ] **复制** `packages/ui/src/theme/themes/cimi-blue.json`
  - Cimi Blue 主题，light/dark 双模式，以蓝色 `#5b9bd5` / `#7cb9e8` 为主色

### 3.2 注册自定义主题
- [ ] **修改** `packages/ui/src/theme/default-themes.ts`
  - 添加 `import cimiBlueThemeJson from "./themes/cimi-blue.json"`
  - 添加 `export const cimiBlueTheme = cimiBlueThemeJson as DesktopTheme`
  - 在 DEFAULT_THEMES map 中添加 `"cimi-blue": cimiBlueTheme`

### 3.3 更改默认主题
- [ ] **修改** `packages/ui/src/theme/context.tsx`
  - 将默认主题从 `"oc-2"` 改为 `"cimi-blue"`

### 3.4 恢复自定义字体
- [ ] **复制** `packages/ui/src/assets/fonts/` 整个目录（68 个字体文件）
  - 包括: Inter, Geist, IBM Plex Mono, Fira Code, JetBrains Mono, Hack, Meslo, Roboto Mono, Source Code Pro, Ubuntu Mono 等
- [ ] **还原** `packages/ui/src/styles/theme.css`
  - 将系统字体栈恢复为旧项目的 Web 字体: `"Inter"` / `"IBM Plex Mono"`
  - 恢复 `font-feature-settings: "ss03" 1` / `"ss01" 1`

---

## Phase 4: 文档预览组件 (packages/ui)

### 4.1 恢复 HTML 预览组件（仅旧项目存在）
- [ ] **复制** `packages/ui/src/components/html-preview.tsx` (191 行)
  - CSP 注入、DOMPurify 清理、script/iframe 移除、ResizeObserver iframe
- [ ] **复制** `packages/ui/src/components/html-preview.test.ts`
  - 测试 CSP 注入和 script 剥离

### 4.2 恢复文档预览组件（仅旧项目存在）
- [ ] **复制** `packages/ui/src/components/previews/docx-preview.tsx` (~115 行)
  - 使用 docx-preview 库渲染
- [ ] **复制** `packages/ui/src/components/previews/pdf-preview.tsx` (~175 行)
  - 使用 pdfjs-dist 渲染，带翻页和缩放
- [ ] **复制** `packages/ui/src/components/previews/pptx-preview.tsx` (~100 行)
  - 使用 pptx-preview 库渲染
- [ ] **复制** `packages/ui/src/components/previews/xlsx-preview.tsx` (~260 行)
  - 使用 ExcelJS 渲染，带多 sheet 切换和样式

### 4.3 恢复文档媒体类型
- [ ] **还原** `packages/ui/src/pierre/media.ts`
  - `MediaKind` 恢复为 `"image" | "audio" | "svg" | "pdf" | "docx" | "xlsx" | "xls" | "pptx" | "ppt"`
  - 恢复文档扩展名检测逻辑
  - 恢复 base64 文档内容处理

### 4.4 恢复文档预览依赖
- [ ] **修改** `packages/ui/package.json`
  - 添加回 `docx-preview`
  - 添加回 `exceljs`
  - 添加回 `pdfjs-dist`
  - 添加回 `pptx-preview`
  - 添加回 `marked-katex-extension`

---

## Phase 5: CSS 与样式还原 (packages/ui)

### 5.1 恢复 Tauri 拖拽区域选择器
- [ ] **还原** `packages/ui/src/styles/base.css`
  - `#root:not([aria-hidden]) *[data-tauri-drag-region]` → `*[data-tauri-drag-region]`

### 5.2 恢复 Dialog 全屏面板样式
- [ ] **还原** `packages/ui/src/components/dialog.css`
  - 添加回 ~310 行全屏面板 CSS（`.settings-fullscreen-wrapper`, `.skills-fullscreen-wrapper`, `.skills-header`, `.skills-shell`, `.skills-list`, `.skills-item` 等）
  - 添加回 `slideInFromRight` / `slideOutToRight` 关键帧动画

### 5.3 恢复 Accordion 禁用状态样式
- [ ] **还原** `packages/ui/src/components/accordion.css`
  - 移除 `:not([data-disabled])` 修饰符，恢复为普通 `&:hover` / `&:active`

### 5.4 恢复 Pierre 滚动条样式
- [ ] **还原** `packages/ui/src/pierre/index.ts`
  - 用 ~35 行自定义 webkit/Firefox 滚动条 CSS 替换简化的 `overflow` 指令

---

## Phase 6: 组件与上下文还原 (packages/ui)

### 6.1 恢复组件 classList 防御性代码
所有核心组件的 `...split.classList` 恢复为 `...(split.classList ?? {})`。涉及文件（~50+ 个 .tsx）：
- [ ] `accordion.tsx`
- [ ] `animated-number.tsx`
- [ ] `app-icon.tsx`
- [ ] `avatar.tsx`
- [ ] `basic-tool.tsx`
- [ ] `button.tsx`
- [ ] `card.tsx`
- [ ] `checkbox.tsx`
- [ ] `collapsible.tsx`
- [ ] `context-menu.tsx`
- [ ] `dialog.tsx`
- [ ] `diff-changes.tsx`
- [ ] `dock-surface.tsx`
- [ ] `dropdown-menu.tsx`
- [ ] `favicon.tsx`
- [ ] `file-icon.tsx`
- [ ] `file-media.tsx`
- [ ] `file-search.tsx`
- [ ] `file-ssr.tsx`
- [ ] `file.tsx`
- [ ] `font.tsx`
- [ ] `hover-card.tsx`
- [ ] `icon-button.tsx`
- [ ] `icon.tsx`
- [ ] `image-preview.tsx`
- [ ] `inline-input.tsx`
- [ ] `keybind.tsx`
- [ ] `line-comment.tsx`
- [ ] `list.tsx`
- [ ] `logo.tsx`
- [ ] `markdown.tsx`
- [ ] `message-nav.tsx`
- [ ] `message-part.tsx`
- [ ] `motion-spring.tsx`
- [ ] `popover.tsx`
- [ ] `progress-circle.tsx`
- [ ] `progress.tsx`
- [ ] `provider-icon.tsx`
- [ ] `radio-group.tsx`
- [ ] `resize-handle.tsx`
- [ ] `scroll-view.tsx`
- [ ] `select.tsx`
- [ ] `session-retry.tsx`
- [ ] `session-review.tsx`
- [ ] `session-turn.tsx`
- [ ] `shell-submessage.css` (对应 tsx)
- [ ] `spinner.tsx`
- [ ] `sticky-accordion-header.tsx`
- [ ] `switch.tsx`
- [ ] `tabs.tsx`
- [ ] `tag.tsx`
- [ ] `text-field.tsx`
- [ ] `text-reveal.tsx`
- [ ] `text-shimmer.tsx`
- [ ] `text-strikethrough.tsx`
- [ ] `toast.tsx`
- [ ] `tool-count-label.tsx`
- [ ] `tool-count-summary.tsx`
- [ ] `tool-error-card.tsx`
- [ ] `tool-status-title.tsx`
- [ ] `tooltip.tsx`
- [ ] `typewriter.tsx`

### 6.2 恢复 Markdown 解析器
- [ ] **还原** `packages/ui/src/context/marked.tsx`
  - 恢复 `import { Marked }` class-based API
  - 恢复 `escape()`, `decode()`, `kind()`, `mermaid()`, `shiki()`, `highlight()` 辅助函数
  - 恢复 `highlightCodeBlocks` 的手动字符串切片实现
  - 恢复 `renderMathExpressions` 和 `highlightCodeBlocks` 的 export
  - 恢复 `createMarkdownParser` 工厂函数和 `MarkdownParser` 类型
  - 恢复 `marked-katex-extension` 的使用

### 6.3 恢复 marked 测试（仅旧项目存在）
- [ ] **复制** `packages/ui/src/context/marked.test.ts`

### 6.4 恢复 data.tsx 中的类型
- [ ] **还原** `packages/ui/src/context/data.tsx`
  - `SnapshotFileDiff` → `FileDiff`
  - 移除 `agent` 字段

### 6.5 恢复 Hooks
- [ ] **还原** `packages/ui/src/hooks/create-auto-scroll.tsx`
  - 恢复旧版本实现（252 行 → 237 行的反向操作）

### 6.6 恢复 Pierre 模块
- [ ] **还原** `packages/ui/src/pierre/commented-lines.ts`
  - 恢复 `findDiffSide` 的 import
- [ ] **还原** `packages/ui/src/pierre/worker.ts`
  - `void pool.initialize()` → `pool.initialize()`

---

## Phase 7: 国际化还原 (packages/ui)

### 7.1 恢复 i18n 翻译键
所有 17 个 i18n 文件都有差异，需要恢复 HTML preview 相关键值并移除新增的键：
- [ ] `src/i18n/ar.ts`
- [ ] `src/i18n/br.ts`
- [ ] `src/i18n/bs.ts`
- [ ] `src/i18n/da.ts`
- [ ] `src/i18n/de.ts`
- [ ] `src/i18n/en.ts`
  - 恢复: `ui.htmlPreview.mode.source`, `ui.htmlPreview.mode.preview`, `ui.htmlPreview.restore`, `ui.htmlPreview.openInBrowser`
  - 移除: `ui.sessionReview.title.git`, `ui.sessionReview.title.branch`, `ui.sessionTurn.diffs.*`
- [ ] `src/i18n/es.ts`
- [ ] `src/i18n/fr.ts`
- [ ] `src/i18n/ja.ts`
- [ ] `src/i18n/ko.ts`
- [ ] `src/i18n/no.ts`
- [ ] `src/i18n/pl.ts`
- [ ] `src/i18n/ru.ts`
- [ ] `src/i18n/th.ts`
- [ ] `src/i18n/tr.ts`
- [ ] `src/i18n/zh.ts`
- [ ] `src/i18n/zht.ts`

---

## Phase 8: SVG 图标资源 (packages/ui)

所有图标文件（app/file-types/provider）均有差异，主要是行尾格式化。需逐一确认是否有实质内容变化：

### 8.1 App 图标（10 个）
- [ ] `android-studio.svg`, `antigravity.svg`, `cursor.svg`, `file-explorer.svg`
- [ ] `ghostty.svg`, `iterm2.svg`, `powershell.svg`, `sublimetext.svg`
- [ ] `vscode.svg`, `zed-dark.svg`, `zed.svg`

### 8.2 File Type 图标（50+ 个）
- [ ] `auto_light.svg`, `cursor.svg`, `cursor_light.svg`, `drone_light.svg`
- [ ] `folder-*.svg` 系列（admin, circleci, flow, gh-workflows, github, intellij, macos, next, nuxt, open, scripts, target, turborepo, vercel 等）
- [ ] `go_gopher.svg`, `nano-staged_light.svg`, `opa.svg`, `quarto.svg`
- [ ] `rome.svg`, `stitches_light.svg`, `stylelint_light.svg`, `unocss.svg`, `vlang.svg`

### 8.3 Provider 图标（60+ 个）
所有 provider SVG 都有差异，大部分为行尾差异。
- [ ] 从 `302ai.svg` 到 `xai.svg` 全部确认并还原

### 8.4 Favicon
- [ ] `src/assets/favicon/favicon-v3.svg`
- [ ] `src/assets/favicon/favicon.svg`
- [ ] `src/assets/favicon/site.webmanifest`

### 8.5 新增 Provider 图标（仅新项目存在，需决定是否保留）
这些是新增的 provider 图标，旧项目没有：
- [ ] `alibaba-coding-plan-cn.svg`
- [ ] `alibaba-coding-plan.svg`
- [ ] `clarifai.svg`
- [ ] `dinference.svg`
- [ ] `drun.svg`
- [ ] `perplexity-agent.svg`
- [ ] `tencent-coding-plan.svg`

---

## Phase 9: 其他文件

### 9.1 类型定义
- [ ] **确认** `packages/ui/src/custom-elements.d.ts` — 仅行尾差异，无需操作

### 9.2 Storybook
- [ ] **确认** `packages/ui/src/storybook/fixtures.ts` — 仅行尾差异
- [ ] **确认** `packages/ui/src/storybook/scaffold.tsx` — 仅行尾差异
- [ ] **确认** 所有 `.stories.tsx` 文件 — 仅行尾差异，无需操作

### 9.3 类型文件
- [ ] **确认** `packages/ui/src/components/app-icons/types.ts` — 仅行尾差异
- [ ] **确认** `packages/ui/src/components/file-icons/types.ts` — 仅行尾差异
- [ ] **确认** `packages/ui/src/components/provider-icons/types.ts` — 仅行尾差异

### 9.4 新增文件（仅新项目存在，需决定是否保留）
- [ ] `packages/ui/src/components/apply-patch-file.ts` + `.test.ts` — patch 应用组件
- [ ] `packages/ui/src/components/markdown-stream.ts` + `.test.ts` — Markdown 流式组件
- [ ] `packages/ui/src/components/session-diff.ts` + `.test.ts` — Session diff 组件
- [ ] `packages/ui/src/components/timeline-playground.stories.tsx` — Timeline playground story

---

## 优先级建议

| 优先级 | Phase | 说明 |
|--------|-------|------|
| **P0 高** | Phase 1 | 品牌配置，影响应用外观和 API 连接 |
| **P0 高** | Phase 3 | 自定义主题和字体，影响视觉一致性 |
| **P1 中** | Phase 4 | 文档预览功能恢复 |
| **P1 中** | Phase 5 | CSS 样式还原 |
| **P1 中** | Phase 6 | 组件和上下文还原 |
| **P2 低** | Phase 2 | E2E 测试（不影响运行） |
| **P2 低** | Phase 7 | i18n 还原 |
| **P3 可选** | Phase 8 | SVG 图标（大部分仅行尾差异） |
| **P3 可选** | Phase 9 | 其他文件确认 |

---

## 注意事项

1. **行尾差异**: 大量文件仅因 CRLF/LF 行尾不同而报告差异，这些无需处理
2. **新项目改进**: 部分 change 是新项目的改进（如 theme lazy loading、SDK 类型更新），需确认是否保留
3. **依赖冲突**: 恢复文档预览组件需同时恢复 package.json 中的依赖，且需执行 `bun install`
4. **Phase 6.1 工作量大**: 约 60+ 个组件文件需要将 `...split.classList` 改回 `...(split.classList ?? {})`，建议用脚本批量处理
