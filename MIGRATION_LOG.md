# 迁移变更与验证记录 (最终版)

> 旧项目: `E:\code\cimicode\cimicode` → 新项目: `e:\code\new_cimicode\cimicode`
> 执行日期: 2026-04-25

---

## Phase 1: 品牌与配置 (packages/app) ✅ 已完成

### 1.1 复制 .env.development
- **操作**: `cp E:/code/cimicode/.../app/.env.development → 新项目`
- **变更**: 添加 `VITE_CIMI_SKILL_DOWNLOAD_BASE=http://t-app.cdtp.com/api/agi/chat`
- **功能**: 开发环境技能下载 API 地址
- **验证**: `cat packages/app/.env.development`
- **回滚**: `rm packages/app/.env.development`

### 1.2 复制 .env.production
- **操作**: `cp E:/code/cimicode/.../app/.env.production → 新项目`
- **变更**: 添加 `VITE_CIMI_SKILL_DOWNLOAD_BASE=http://app.cxmt.com/api/agi/chat`
- **功能**: 生产环境技能下载 API 地址
- **验证**: `cat packages/app/.env.production`
- **回滚**: `rm packages/app/.env.production`

### 1.3 还原 index.html
- **操作**: Edit 3 处
- **变更明细**:
  - viewport meta: 移除 `interactive-widget=resizes-content`
  - title: `OpenCode` → `CimiCode`
  - noscript: 简单文本 → 双语样式化回退消息
- **功能**: 浏览器标签标题显示 "CimiCode"，JS 禁用时显示中英文提示
- **验证**: 打开应用查看标签标题；禁用 JS 查看回退消息
- **⚠️ 注意**: `interactive-widget=resizes-content` 移除后，移动端虚拟键盘弹出时页面布局行为可能不同。如需恢复，在 viewport meta 添加 `, interactive-widget=resizes-content`
- **回滚**: `git checkout packages/app/index.html`

### 1.4 还原 .gitignore
- **操作**: Edit 添加 2 行
- **变更**: 添加 `dist-development` 和 `dist-production`
- **功能**: 忽略不同环境的构建输出目录
- **验证**: `cat packages/app/.gitignore`
- **回滚**: `git checkout packages/app/.gitignore`

### 1.5 还原 README.md
- **操作**: 整文件覆盖
- **变更**: 恢复 iframe embedding 章节（CSP 和同源代理说明），恢复 Playwright 完整安装命令
- **功能**: 文档中包含 iframe 嵌入和 CSP 配置说明
- **验证**: 搜索 `iframe embedding` 关键词
- **回滚**: `git checkout packages/app/README.md`

### 1.6 e2e/tsconfig.json
- **操作**: ⏭️ 跳过
- **原因**: `../src/testing/terminal.ts` 在新项目中不存在

---

## Phase 2: E2E 测试套件 (packages/app) ✅ 已完成

### 2.1 整体替换 e2e 目录
- **操作**: `rm -rf e2e && cp -r 旧项目/e2e 新项目/e2e`
- **变更**: 新项目原有 `todo.spec.ts` + `tsconfig.json` → 替换为旧项目完整 E2E 套件（56 个文件，12 个子目录）
- **包含的测试模块**:
  - `app/` (6 spec): 首页、导航、命令面板、服务器默认、会话、标题栏历史
  - `commands/` (3 spec): 输入焦点、面板、标签关闭
  - `files/` (3 spec): 文件打开、文件树、文件查看器
  - `models/` (2 spec): 模型选择器、模型可见性
  - `projects/` (5 spec): 项目编辑、项目关闭、项目切换、工作台新会话、工作台
  - `prompt/` (12 spec): 上下文、异步、拖拽URI、拖拽文件、历史、提及、多行、shell、斜杠命令等
  - `session/` (6 spec): 子导航、composer dock、模型持久化、review、撤销重做、会话
  - `settings/` (4 spec): 快捷键、模型、提供商、设置
  - `sidebar/` (3 spec): 弹出操作、会话链接、侧边栏
  - `status/` (1 spec): 状态弹出
  - `terminal/` (4 spec): 初始化、重连、标签页、终端
  - `thinking-level.spec.ts`
- **功能**: 完整的 Playwright E2E 测试套件
- **验证**: `bunx playwright test --list` 列出所有测试
- **⚠️ 注意**: 测试可能依赖旧项目的 API 接口或页面结构，部分测试可能无法直接通过。需先启动后端服务。
- **回滚**:
  ```bash
  rm -rf packages/app/e2e
  cp -r packages/app/e2e_old_backup packages/app/e2e
  ```
  (备份目录: `packages/app/e2e_old_backup`)

---

## Phase 3: 自定义主题与字体 (packages/ui) ✅ 已完成

### 3.1 复制 cimi-blue 主题
- **操作**: `cp 旧项目/cimi-blue.json → 新项目`
- **变更**: 添加 `src/theme/themes/cimi-blue.json`（Cimi Blue 主题，light/dark 双模式）
- **功能**: 蓝色品牌主题（light 主色 `#5b9bd5`，dark 主色 `#7cb9e8`）
- **验证**: 设置中主题选择器应出现 "Cimi Blue" 选项
- **回滚**: `rm packages/ui/src/theme/themes/cimi-blue.json`

### 3.2 注册 cimi-blue 主题
- **操作**: Edit `default-themes.ts` 添加 3 行
- **变更**: 添加 import、export、DEFAULT_THEMES 注册
- **功能**: 主题系统识别并加载 cimi-blue 主题
- **验证**: TypeScript 编译无报错
- **回滚**: `git checkout packages/ui/src/theme/default-themes.ts`

### 3.3 更改默认主题为 cimi-blue
- **操作**: Edit `context.tsx` 修改 2 处默认主题 ID
- **变更**: `"oc-2"` → `"cimi-blue"`（第 166 行和第 252 行）
- **功能**: 首次打开应用默认使用 Cimi Blue 主题
- **⚠️ 注意**: 新项目使用了 lazy loading 重构（`import.meta.glob`），只修改了默认 ID 而非整个文件，保留了新项目的改进
- **验证**: 清除 localStorage 后打开应用，应显示蓝色主题
- **回滚**: `git checkout packages/ui/src/theme/context.tsx`

### 3.4 复制字体文件
- **操作**: `cp -r 旧项目/fonts/ → 新项目/fonts/`
- **变更**: 添加 70 个字体文件（Inter, Geist, IBM Plex Mono, Fira Code, JetBrains Mono, Hack, Meslo, Roboto Mono, Source Code Pro, Ubuntu Mono 等）
- **功能**: 应用使用 Web 字体渲染（Inter 正文字体 + IBM Plex Mono 代码字体）
- **⚠️ 注意**: 字体文件体积较大，可能显著增加构建产物大小
- **验证**: 浏览器 DevTools → Computed → font-family 应为 `"Inter"` / `"IBM Plex Mono"`
- **回滚**: `rm -rf packages/ui/src/assets/fonts`

### 3.5 恢复自定义字体 CSS
- **操作**: Edit `theme.css` 前 6 行
- **变更**:
  - `--font-family-sans`: 系统字体栈 → `"Inter", "Inter Fallback"`
  - `--font-family-mono`: 系统字体栈 → `"IBM Plex Mono", "IBM Plex Mono Fallback"`
  - `--font-family-sans--font-feature-settings`: `normal` → `"ss03" 1`
  - `--font-family-mono--font-feature-settings`: `normal` → `"ss01" 1`
- **功能**: 全局使用 Inter 和 IBM Plex Mono 字体及 OpenType 特性
- **验证**: 同 3.4
- **回滚**: `git checkout packages/ui/src/styles/theme.css`

---

## Phase 4: 文档预览组件 (packages/ui) ✅ 已完成

### 4.1 复制 HTML 预览组件
- **操作**: `cp html-preview.tsx` + `html-preview.test.ts`
- **变更**: 添加 CSP 注入、DOMPurify 清理、script/iframe 移除的 HTML 预览组件
- **功能**: 在应用内安全预览 HTML 文件
- **验证**: 打开 HTML 文件时显示 iframe 预览而非源码
- **回滚**: `rm packages/ui/src/components/html-preview.tsx packages/ui/src/components/html-preview.test.ts`

### 4.2 复制文档预览组件
- **操作**: `cp previews/*.tsx` (4 个文件)
- **变更**:
  - `docx-preview.tsx` (~115 行): 使用 docx-preview 库渲染 Word 文档
  - `pdf-preview.tsx` (~175 行): 使用 pdfjs-dist 渲染 PDF，支持翻页和缩放
  - `pptx-preview.tsx` (~100 行): 使用 pptx-preview 库渲染 PPT
  - `xlsx-preview.tsx` (~260 行): 使用 ExcelJS 渲染 Excel，支持多 sheet 和样式
- **功能**: 在应用内预览 DOCX、PDF、PPTX、XLSX 文件
- **验证**: 分别打开对应格式文件确认预览正常
- **回滚**: `rm -rf packages/ui/src/components/previews`

### 4.3 恢复文档媒体类型
- **操作**: Edit `media.ts` 3 处
- **变更**:
  - `MediaKind` 添加 `"pdf" | "docx" | "xlsx" | "xls" | "pptx" | "ppt"`
  - `mediaKindFromPath` 添加文档扩展名检测
  - `dataUrlFromMediaValue` 添加文档类型 base64 直接返回逻辑
- **功能**: 文件列表中 PDF/DOCX/XLSX/PPTX 文件被识别为可预览媒体
- **验证**: 文件查看器中打开文档类型文件应触发预览组件
- **回滚**: `git checkout packages/ui/src/pierre/media.ts`

### 4.4 恢复文档预览依赖
- **操作**: Edit `package.json` 添加 4 个依赖
- **变更**:
  - `"docx-preview": "0.3.7"`
  - `"exceljs": "4.4.0"`
  - `"pdfjs-dist": "5.5.207"`
  - `"pptx-preview": "1.0.7"`
- **功能**: 安装文档预览所需的运行时库
- **验证**: `bun install` 无报错，import 不报错
- **⚠️ 注意**: 需执行 `bun install` 安装新依赖
- **回滚**: `git checkout packages/ui/package.json && rm -rf node_modules && bun install`

---

## Phase 5: CSS 与样式还原 (packages/ui) ✅ 已完成

### 5.1 还原 base.css
- **操作**: 整文件覆盖
- **变更**: `#root:not([aria-hidden]) *[data-tauri-drag-region]` → `*[data-tauri-drag-region]`
- **功能**: Tauri 桌面应用标题栏拖拽功能
- **⚠️ 注意**: 新项目添加了 `:not([aria-hidden])` 限制是为修复 modal 打开时拖拽冲突的 bug，移除后可能重现。如遇问题恢复新版本。
- **验证**: Tauri 桌面应用中拖拽标题栏移动窗口
- **回滚**: `git checkout packages/ui/src/styles/base.css`

### 5.2 恢复 Dialog 全屏面板样式
- **操作**: 整文件覆盖
- **变更**: 添加回 ~310 行全屏面板 CSS（settings/skills/file-transfer 面板样式、slideInFromRight/slideOutToRight 动画）
- **功能**: 设置面板、技能面板全屏打开时有滑入动画和正确样式
- **⚠️ 注意**: 这些 CSS 类需要对应的 tsx 中使用才有效。如果新项目的 dialog.tsx 不引用这些类名，CSS 不会生效但也不会造成问题。
- **验证**: 打开设置面板，检查是否有全屏滑入效果
- **回滚**: `git checkout packages/ui/src/components/dialog.css`

### 5.3 恢复 Accordion 禁用状态样式
- **操作**: 整文件覆盖
- **变更**: 移除 `:not([data-disabled])` 修饰符
- **功能**: 禁用的 accordion 项 hover/active 效果
- **⚠️ 注意**: 新项目添加此修饰符是 CSS 改进。恢复旧版后，禁用的 accordion 项 hover 时可能出现视觉异常。如遇问题恢复新版本。
- **验证**: 查看包含禁用项的 accordion 组件
- **回滚**: `git checkout packages/ui/src/components/accordion.css`

### 5.4 恢复 Pierre 滚动条样式
- **操作**: 整文件覆盖
- **变更**: 用 ~35 行自定义 webkit/Firefox 滚动条 CSS 替换简化的 overflow 指令
- **功能**: diff 视图中代码区域的滚动条有自定义样式
- **验证**: 打开 diff 视图，检查代码区域滚动条样式
- **回滚**: `git checkout packages/ui/src/pierre/index.ts`

---

## Phase 6: 组件与上下文还原 (packages/ui) ✅ 已完成

### 6.1 恢复组件 classList 防御性代码
- **操作**: 批量 sed 替换
- **变更**: `...split.classList` → `...(split.classList ?? {})` (9 个文件)
  - `accordion.tsx`, `avatar.tsx`, `button.tsx`, `card.tsx`, `dock-surface.tsx`, `icon-button.tsx`, `progress-circle.tsx`, `tabs.tsx`, `tag.tsx`
- **功能**: 防御性空值检查（Solid splitProps 实际不返回 undefined，功能无影响）
- **验证**: 应用运行正常，组件渲染无报错
- **⚠️ 注意**: 分析显示仅 9 个文件包含此模式（而非预期的 60+），其余文件可能本身就有 `?? {}` 或不含 classList。功能无实际影响。
- **回滚**:
  ```bash
  cd packages/ui/src/components
  sed -i 's/\.\.\.(split\.classList) ?? {}/...\1/g' accordion.tsx avatar.tsx button.tsx card.tsx dock-surface.tsx icon-button.tsx progress-circle.tsx tabs.tsx tag.tsx
  ```

### 6.2 恢复 Markdown 解析器
- **操作**: 整文件覆盖 `context/marked.tsx`
- **变更**: 恢复 class-based `Marked` API、`escape/decode/kind/mermaid/shiki/highlight` 辅助函数、`createMarkdownParser` 工厂函数
- **功能**: Markdown 渲染、代码高亮、数学公式、Mermaid 图表
- **⚠️ 注意**: 新项目重构了 markdown 解析为更简洁的实现。恢复旧版本后需确认 marked-katex-extension 兼容性。
- **验证**: 发送包含代码块、数学公式 `$x^2$`、Markdown 格式的消息，确认渲染正确
- **回滚**: `git checkout packages/ui/src/context/marked.tsx`

### 6.3 复制 marked 测试
- **操作**: `cp context/marked.test.ts`
- **功能**: Markdown 解析相关单元测试
- **验证**: `bun test packages/ui/src/context/marked.test.ts`
- **回滚**: `rm packages/ui/src/context/marked.test.ts`

### 6.4 恢复 data.tsx 类型
- **操作**: 整文件覆盖
- **变更**: `SnapshotFileDiff` → `FileDiff`，移除 `agent` 字段
- **⚠️ 注意**: 新项目 SDK 可能已将 `FileDiff` 重命名为 `SnapshotFileDiff`。如果新 SDK 不再导出 `FileDiff`，会导致编译错误。
- **验证**: TypeScript 编译无报错
- **回滚**: `git checkout packages/ui/src/context/data.tsx`

### 6.5 恢复 create-auto-scroll hook
- **操作**: 整文件覆盖
- **变更**: 恢复 252 行版本（新版本 237 行）
- **功能**: 自动滚动跟踪（接口不变，内部实现差异）
- **验证**: 发送长消息，检查自动滚动是否跟随到底部
- **回滚**: `git checkout packages/ui/src/hooks/create-auto-scroll.tsx`

### 6.6 恢复 Pierre commented-lines.ts
- **操作**: 整文件覆盖
- **变更**: 恢复 `findDiffSide` 的 import（虽然未使用）
- **功能**: Diff 视图行评论功能
- **验证**: 在 diff 视图中添加行评论
- **回滚**: `git checkout packages/ui/src/pierre/commented-lines.ts`

### 6.7 恢复 Pierre worker.ts
- **操作**: 整文件覆盖
- **变更**: `void pool.initialize()` → `pool.initialize()`
- **功能**: Worker 池初始化
- **验证**: Diff 视图渲染正常
- **回滚**: `git checkout packages/ui/src/pierre/worker.ts`

---

## Phase 7: 国际化还原 (packages/ui) ✅ 已完成

### 7.1 恢复全部 17 个 i18n 文件
- **操作**: 整文件覆盖全部 17 个语言文件
- **文件**: `ar.ts`, `br.ts`, `bs.ts`, `da.ts`, `de.ts`, `en.ts`, `es.ts`, `fr.ts`, `ja.ts`, `ko.ts`, `no.ts`, `pl.ts`, `ru.ts`, `th.ts`, `tr.ts`, `zh.ts`, `zht.ts`
- **变更**:
  - 恢复 `ui.htmlPreview.*` 4 个键（HTML 预览相关）
  - 移除 `ui.sessionReview.title.git`, `ui.sessionReview.title.branch`（新项目新增）
  - 移除 `ui.sessionTurn.diffs.*`（新项目新增）
- **功能**: 所有语言翻译恢复到旧项目状态
- **⚠️ 注意**: 移除了新项目新增的 sessionReview 和 sessionTurn 翻译键，如果新项目有组件使用这些键，会显示裸键名。
- **验证**: 切换各语言检查 UI 文案，特别是 HTML 预览和 Session Review 区域
- **回滚**: `git checkout packages/ui/src/i18n/`

---

## Phase 8: SVG 图标资源 (packages/ui) ✅ 已完成

### 8.1 覆盖全部图标
- **操作**: `cp -r 旧项目/icons/* → 新项目/icons/` + 覆盖 favicon
- **变更**: 1204 个 SVG 文件 + 3 个 favicon 文件从旧项目覆盖
- **功能**: 恢复旧项目品牌图标和文件类型图标
- **⚠️ 注意**:
  - 新项目新增的 7 个 provider 图标（alibaba-coding-plan 等）被保留（旧项目图标覆盖 + 新增图标仍在）
  - 大部分差异仅为行尾格式（CRLF vs LF），无实质内容变化
- **验证**: 检查应用中各处图标显示是否正常
- **回滚**: `git checkout packages/ui/src/assets/icons/ packages/ui/src/assets/favicon/`

---

## Phase 9: 其他文件确认 ✅ 已完成

### 9.1 保留的新增组件（不删除）
以下文件仅在新项目中存在，属于新功能，**保留不删除**：
- `src/components/apply-patch-file.ts` + `.test.ts` — Patch 文件应用组件
- `src/components/markdown-stream.ts` + `.test.ts` — Markdown 流式渲染组件
- `src/components/session-diff.ts` + `.test.ts` — Session diff 组件
- `src/components/timeline-playground.stories.tsx` — Timeline playground story

### 9.2 仅行尾差异的文件（无需处理）
以下文件仅 CRLF/LF 行尾不同，**内容完全一致**，未做修改：
- `.gitignore`, `tsconfig.json`, `vite.config.ts`, `sst-env.d.ts`
- `script/colors.txt`, `script/tailwind.ts`
- `src/custom-elements.d.ts`
- `src/storybook/fixtures.ts`, `src/storybook/scaffold.tsx`
- 所有 `.stories.tsx` 文件
- `src/theme/color.ts`, `loader.ts`, `resolve.ts`, `types.ts`, `desktop-theme.schema.json`, `index.ts`
- 除 `oc-2.json` 外的所有主题 JSON（`oc-2.json` 新项目新增了约 30 个颜色 token）

---

## ⚠️ 需要特别验证的不确定项汇总

| # | 项目 | 风险 | 建议 |
|---|------|------|------|
| 1 | `interactive-widget` 移除 | 移动端虚拟键盘体验 | 如无移动端需求可忽略 |
| 2 | `base.css` 拖拽区域 | modal 打开时拖拽冲突 | 如遇问题 `git checkout base.css` |
| 3 | `dialog.css` 全屏样式 | CSS 类可能无对应 tsx 使用 | 无效 CSS 不影响功能 |
| 4 | `accordion.css` 禁用样式 | 禁用项 hover 可能异常 | 如遇问题 `git checkout accordion.css` |
| 5 | `data.tsx` SDK 类型 | `FileDiff` 可能不存在于新 SDK | 检查编译是否报错 |
| 6 | `marked.tsx` 重构 | marked-katex-extension 兼容性 | 检查数学公式渲染 |
| 7 | i18n 键移除 | sessionReview/diffs 可能显示裸键 | 检查相关 UI |
| 8 | `oc-2.json` 差异 | 新项目新增了 30 个颜色 token，旧版覆盖后丢失 | 主题可能缺少部分语义色 |
| 9 | 新增依赖安装 | 需手动 `bun install` | 执行后验证构建 |

---

## 迁移后必做操作

1. **安装依赖**: `cd packages/ui && bun install`
2. **验证构建**: `bun run build`（在项目根目录）
3. **验证 TypeScript**: 检查编译无报错
4. **验证主题**: 清除 localStorage，打开应用确认 Cimi Blue 主题
5. **验证字体**: 检查文本使用 Inter / IBM Plex Mono
6. **验证文档预览**: 分别打开 PDF/DOCX/XLSX/PPTX/HTML 文件
7. **验证 E2E**: 启动后端后 `bunx playwright test`
