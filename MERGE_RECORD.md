# CimiCode Merge Record

**Source:** `e:\code\cimicode\cimicode` (old, commit `cb8b2b596^` base)
**Target:** `e:\code\new_cimicode\cimicode` (new, commit `cb8b2b596` - "feat: cimi customizations and enhancements")
**Date:** 2026-04-25
**Author:** lsHaoo

This document records every change made to transform the upstream OpenCode project into CimiCode. Changes are grouped by category.

---

## 1. Brand Changes (Logos, URLs, Names, Deep Links, Env Vars)

### 1.1 `packages/app/index.html`
- **Line 5:** `<title>OpenCode</title>` --> `<title>CimiCode</title>`
- **Line 4:** Removed `interactive-widget=resizes-content` from viewport meta
- **Lines 19-22:** Replaced `<noscript>` text with bilingual (English + Chinese) fallback
- **Why:** Rebranding from OpenCode to CimiCode

### 1.2 `packages/app/.env.development` (NEW FILE)
```
VITE_CIMI_SKILL_DOWNLOAD_BASE=http://t-app.cdtp.com/api/agi/chat
```
- **Why:** Development environment skill download endpoint

### 1.3 `packages/app/.env.production` (NEW FILE)
```
VITE_CIMI_SKILL_DOWNLOAD_BASE=http://app.cxmt.com/api/agi/chat
```
- **Why:** Production environment skill download endpoint

### 1.4 `packages/app/src/env.d.ts`
- Removed `VITE_OPENCODE_CHANNEL?: "dev" | "beta" | "prod"` from `ImportMetaEnv`
- Added `readonly VITE_CIMI_SKILL_DOWNLOAD_BASE: string`
- Changed `export declare module "solid-js"` to `declare module "solid-js"` (removed export)
- Added `import "solid-js"` at top
- **Why:** Replace OpenCode env vars with Cimi-specific ones

### 1.5 `packages/app/src/app.tsx`
- Line 79: `__OPENCODE__` --> `__CIMICODE__` (global window interface)
- Lines 188, 196: Replaced `<Splash>` component with `<AppLoading />` (new custom loading screen)
- Line 237: Replaced `<Splash>` with `<AppLogo>` for connection error page
- Removed import of `{ Splash } from "@opencode-ai/ui/logo"`
- Changed `import { ThemeProvider } from "@opencode-ai/ui/theme/context"` to `from "@opencode-ai/ui/theme"`
- Added imports for `AppLoading` and `AppLogo`
- **Why:** Replace OpenCode splash/logo with CimiCode branded loading screens

### 1.6 `packages/app/src/pages/home.tsx`
- Replaced `<Logo>` component (OpenCode SVG) with remote `<RemoteLogo>` and `<RemoteTxtLogo>` images
- Logo URLs:
  - Icon: `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-icon_beta.svg`
  - Text: `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.svg`
- Removed server connection button from home page
- Removed OpenCode watermark logo (`<Logo class="md:w-xl opacity-12" />`)
- Changed empty state: replaced folder icon + text with CimiCode logo + styled button
- Button styled with `background: rgb(74,149,232), color: white`
- Filtered out `"global"` project from recent projects list
- Changed "Open project" dialog from `DialogSelectDirectory` to `DialogDownloadFile`
- **Why:** Full rebranding of home page for CimiCode

### 1.7 `packages/app/src/pages/error.tsx`
- Replaced `<Logo>` with `<RemoteLogo>` pointing to `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.webp`
- Added `<WindowControls>` for desktop version
- Commented out GitHub issue report link and version display
- **Why:** Rebrand error page, add window controls for desktop

### 1.8 `packages/app/src/components/session/session-new-view.tsx`
- Replaced `<Mark>` (OpenCode logo mark) with `<RemoteLogo>` using `cimicode-icon_beta.svg`
- Wrapped logo in styled gradient container (`from-blue-50 to-indigo-50`)
- Commented out project path display and worktree info
- **Why:** Rebrand new session view

### 1.9 `packages/app/src/entry.tsx`
- Added `import { cimiBoot } from "@/utils/cimi"` and `cimiBoot()` call before rendering
- Added iframe-only access restriction: blocks direct access (not in iframe) unless on localhost
- Chinese error message: "此页面仅支持在智多鑫-CimiCode内访问"
- **Why:** Security restriction -- CimiCode web version must run inside parent iframe

### 1.10 `packages/app/src/pages/session.tsx`
- Added empty state logos (`https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-none.svg`) in session empty views
- Added floating sidebar toggle button at top-left of session panel
- **Why:** Branding for empty states, UI improvement for sidebar toggle

### 1.11 `packages/app/src/i18n/en.ts` (and all locale files)
Brand string replacements across the entire i18n system:
- `"Archive session"` --> `"Delete session"` (rebranding the action)
- `"dialog.provider.opencode.note"` key --> `"dialog.provider.cimi.note"`
- `"dialog.provider.opencode.tagline"` key --> `"dialog.provider.cimi.tagline"`
- `"dialog.provider.opencodeGo.tagline"` key --> `"dialog.provider.cimigo.tagline"`
- `"Free models provided by OpenCode"` --> `"Free models provided by Cimi"`
- `"use {{provider}} models in OpenCode"` --> `"use {{provider}} models in Cimi"` (multiple instances)
- `"OpenCode Zen"` references --> `"CimiCodeZen"` / `"Cimi Zen"`
- `"opencode.ai/zen"` --> `"Cimi.ai/zen"`
- `"Switch which OpenCode server"` --> `"Switch which Cimi server"`
- `"Plugins configured in opencode.json"` --> `"Configure plugins in the .cimi/cimicode folder"`
- `"Add files"` --> `"Add file"`
- Removed keys: `"command.project.previous"`, `"command.project.next"`, `"common.continue"`, `"session.child.promptDisabled"`, `"session.child.backToParent"`
- Added keys for `webFileTransfer.*`, `toast.reload.embed.*`, custom provider edit toasts, font options, `settings.permissions.tool.todoread.*`
- `"Cimi 启动时自动检查更新"` and `"你正在使用最新版本的 CimiCode。"`
- `workspace.reset.archived.*` changed from "归档" to "删除"
- **Why:** Complete rebranding of all user-facing strings

### 1.12 Deep Links
- `packages/app/src/pages/layout/helpers.test.ts`: All deep link scheme references changed from `opencode://` to `cimicode://`
- Window global changed from `__OPENCODE__` to `__CIMICODE__`

---

## 2. UI Layout Changes (Titlebar, Sidebar, Session Header, Project List Row)

### 2.1 `packages/app/src/components/titlebar.tsx`
Major restructuring of the title bar:
- **Line 1:** Added `onCleanup` import, removed `useSettings` import
- **Line 9:** Changed theme import from `"@opencode-ai/ui/theme/context"` to `"@opencode-ai/ui/theme"`
- **Lines 42, 79:** Removed `hasProjects` and `nav` memos (beta channel gating logic)
- **Lines 203-215:** Sidebar toggle button hidden via `class="hidden"` (but still present in DOM)
- **Lines 218-255:** Commented out the entire left-side navigation block (back/forward buttons, project name, sidebar toggle, back/forward with conditional rendering). Replaced with fixed back/forward buttons that always show.
- **Lines 253-260:** Added CimiCode logo image in titlebar: `<img src="https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.webp">`
- **Line 263:** Titlebar center: changed `justify-center` to `justify-start`
- **Why:** Simplified titlebar with CimiCode logo, removed conditional beta channel logic

### 2.2 `packages/app/src/components/window-controls.tsx` (NEW FILE)
- 125 lines, provides minimize/maximize/close buttons for Windows desktop
- Detects Tauri native vs web via `__TAURI__` global
- SVG icons for minimize (line), maximize (rectangle), restore (overlapping rectangles), close (X)
- Chinese aria-labels: "最小化", "还原", "最大化", "关闭"
- **Why:** Custom window controls for desktop web version

### 2.3 `packages/app/src/pages/layout.tsx`
Major layout restructuring:
- Added imports for `createMediaQuery`, `WebFileTransfer`, `DialogDownloadFile`, `servicePost`, `serviceReady`
- Added `desktop` media query (768px breakpoint) and `titlebar` memo that shows titlebar only on desktop or small screens
- Added `canReload` memo for web platform restart capability
- **Lines 589-632:** Added `restartNow()` and `DialogRestartService()` functions for restarting the CimiCode backend service
- **Lines 1523-1548:** Changed "Open project" from `DialogSelectDirectory` to `DialogDownloadFile`
- **Lines 2406-2460:** Added new `projectListRow` -- a horizontal scrollable project list row at the top of the main area with drag-drop support
- **Lines 2482:** Conditional titlebar rendering with `<Show when={titlebar()}>`
- Added `<WebFileTransfer>` component
- Sidebar hidden when no projects exist (`layout.projects.list().length === 0`)
- Resize handle moved inside sidebar nav
- Main content area left offset set to `0px` when no projects or sidebar closed (was `4rem`)
- Removed the separate ResizeHandle outside sidebar
- **Why:** Major layout change -- project tabs become a horizontal row, sidebar is hidden when empty, web file transfer controls added

### 2.4 `packages/app/src/pages/layout/sidebar-shell.tsx`
- **Line 53:** Changed sidebar rail class from `"w-16 shrink-0 bg-background-base flex flex-col items-center overflow-hidden"` to `"hidden"`
- **Why:** Hide the sidebar rail (icon strip) completely in CimiCode

### 2.5 `packages/app/src/components/session/session-header.tsx`
- Removed `useSettings` import and dependency
- Removed `isDesktopBeta`, `search`, `tree`, `term`, `status` conditional memos (beta feature gating)
- All toolbar items (search, terminal, file tree, status) now always show (not gated by beta settings)
- Search button moved from titlebar-center portal to right panel portal
- Added magnifying glass icon to search button
- Portal target changed: uses `"opencode-project-row-actions"` on web desktop, `"opencode-titlebar-right"` otherwise
- **Why:** Remove beta feature gating, consolidate header actions, adapt to new layout

### 2.6 `packages/app/src/components/app-loading.tsx` (NEW FILE)
- 177 lines, custom branded loading screen
- Uses `AppLogo` component with CimiCode icon from remote URL
- Desktop version: elaborate loading card with gradient, pulsing animation, progress bar
- Web version: simple centered spinner with text
- **Why:** Replace OpenCode splash with CimiCode branded loading experience

---

## 3. Chat Input Area Changes (Config Bar, Buttons, Attachments)

### 3.1 `packages/app/src/components/prompt-input.tsx`
Major restructuring of the prompt input area:
- **Line 1:** Removed `createResource` import
- **Line 906:** `addPart` signature changed to accept `opts?: { close?: boolean }` parameter
- **Line 1289:** Container changed from `flex-col` to `flex-col-reverse` (config bar moves to bottom)
- **Lines 1333-1339:** Image attachments hidden on web platform with `<Show when={platform.platform !== "web"}>`
- **Lines 1351:** Added `data-action="prompt-permissions"` to mousedown guard
- **Lines 1449-1513:** Complete button area redesign:
  - Attach file button wrapped in platform check (`desktop || web`)
  - Added **slash command button** (flash icon, inserts "/" into editor)
  - Added **auto-accept toggle button** (shield icon, toggles permission auto-accept)
  - Shield icon turns green (`text-icon-success-base`) when accepting
- **Lines 1535:** Config bar top padding changed from `pt-5.5` to `pt-2`
- **Lines 1640-1660:** **Variant selector commented out** (the prompt-variant-control dropdown)
- **Lines 1670-1695:** Added **Skills management button** (web-only, opens skills dialog)
- Removed `promptReady` resource (was awaiting prompt initialization)
- **Why:** Redesigned prompt input with new slash command, auto-accept, and skills buttons; variant selector removed; web file attachments handled differently

### 3.2 `packages/app/src/components/prompt-input/attachments.ts`
- Added imports for `useServer`, `usePlatform`, `useFile`, `webFileTransferApi`, `getFilename`
- Added `sessionDirectory` to `PromptAttachmentsInput` interface
- Web platform: uploads files to server via `/file-manager/upload` before attaching
- Adds `serverPath` field to `ImageAttachmentPart`
- Web platform: adds `@filename` text reference in message input after upload
- Refreshes file tree after upload on web
- Changed from `makeEventListener` to manual `addEventListener`/`removeEventListener` with `onCleanup`
- **Why:** Web version needs server-side file upload since it can't access local filesystem

### 3.3 `packages/app/src/context/prompt.tsx`
- Added `serverPath?: string` field to `ImageAttachmentPart` interface
- **Why:** Track server-side path for web-uploaded files

### 3.4 `packages/app/src/pages/session/composer/session-composer-region.tsx`
- Added `margin-bottom: 60px` to composer style
- **Why:** Extra bottom margin for the composer region (layout adjustment)

---

## 4. Settings Changes (Plugin Paths, Storage Keys, Provider Settings)

### 4.1 `packages/app/src/utils/persist.ts`
- **Line 8:** Simplified `PersistedWithReady` type -- removed `promise` field from 4th element
- **Line 18:** `GLOBAL_STORAGE` changed from `"opencode.global.dat"` to `"cimicode.global.dat"`
- **Line 19:** `LOCAL_PREFIX` changed from `"opencode."` to `"cimicode."`
- **Line 209:** Workspace storage prefix changed from `"opencode.workspace."` to `"cimicode.workspace."`
- **Lines 463-467:** Simplified `persisted()` return value -- removed `promise` wrapper, returns plain `() => ready() === true`
- **Why:** All localStorage keys renamed to CimiCode namespace; simplified async readiness tracking

### 4.2 `packages/app/src/context/language.tsx`
- **Line 180:** Changed localStorage key from `"opencode.global.dat:language"` to `"cimicode.global.dat:language"`
- **Why:** Match renamed storage key

### 4.3 `packages/app/src/components/status-popover-body.tsx`
- **Line 246:** Plugin path reference changed from `"opencode.json"` to `".cimi/cimicode"`
- **Why:** CimiCode uses `.cimi/cimicode` folder for plugin configuration instead of `opencode.json`

### 4.4 `packages/app/src/components/dialog-settings.tsx`
- Settings dialog converted from modal to fullscreen slide-in wrapper
- Added close button (`IconButton icon="close"`) in header
- Web platform shows "Cimi Web" instead of desktop app name
- Wrapped in `settings-fullscreen-wrapper` CSS class
- **Why:** Full-screen settings experience for CimiCode web version

### 4.5 `packages/app/src/components/settings-providers.tsx`
- Provider notes mapping: `"opencode"` now maps to `"dialog.provider.cimi.note"`, `"opencode-go"` to `"dialog.provider.cimigo.tagline"`
- Added `edit()` function for editing providers, with special handling for "CXMT Cimi" provider
- Added CXMT Cimi preset provider section at top of popular providers list with "推荐" (Recommended) tag
- Added "Edit" button for custom/config-based providers
- CXMT Cimi uses `DialogQuickSetupPreset` for setup
- **Why:** Add CXMT Cimi as default recommended provider with custom setup flow

### 4.6 `packages/app/src/components/dialog-select-provider.tsx`
- Added `PRESET_ID = "_preset"` for CXMT Cimi provider
- CXMT Cimi appears first in provider selection list (sorted before custom provider)
- Preset option shows "推荐" tag
- Selecting preset opens `DialogQuickSetupPreset`
- **Why:** Prioritize CXMT Cimi provider in selection UI

### 4.7 `packages/app/src/components/dialog-quick-setup-preset.tsx` (NEW FILE)
- 341 lines, quick setup dialog for CXMT Cimi provider
- Fetches preset models from `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-models.json`
- Fallback models: `GLM-4.7-fp8` and `GLM-4.7-flash` via `http://agi-gateway.cxmt.com/v1`
- Auto-refreshes model list every 5 minutes
- Supports both create and edit modes
- Configures provider with `@ai-sdk/openai-compatible` npm package
- **Why:** Streamlined setup for CXMT's own AI model service

### 4.8 `packages/app/src/hooks/use-preset-models.ts` (NEW FILE)
- 94 lines, hook for managing preset model data
- Fetches from remote JSON with timestamp cache-busting
- Falls back to hardcoded `GLM-4.7-fp8` and `GLM-4.7-flash`
- Auto-refresh interval of 5 minutes
- **Why:** Dynamic model configuration for CXMT Cimi provider

### 4.9 `packages/ui/src/theme/context.tsx`
- Default theme changed from `"oc-2"` to `"cimi-blue"` (lines 166, 252)
- **Why:** Use CimiCode's custom theme as default

### 4.10 `packages/ui/src/theme/default-themes.ts`
- Added import and export of `cimiBlueTheme` from `./themes/cimi-blue.json`
- Added `"cimi-blue": cimiBlueTheme` as first entry in `DEFAULT_THEMES` record
- **Why:** Register Cimi Blue as a built-in theme

### 4.11 `packages/ui/src/theme/themes/cimi-blue.json` (NEW FILE)
- 89 lines, custom theme definition
- Light palette: neutral `#f8fbff`, ink `#2c3e50`, primary `#5b9bd5`, accent `#7cb9e8`
- Dark palette: neutral `#0d141f`, ink `#e8f0f8`, primary `#7cb9e8`, accent `#5b9bd5`
- Full syntax highlighting and markdown color overrides for both light and dark
- **Why:** Custom blue-themed color scheme matching CimiCode brand

---

## 5. New CimiCode Features (Skills System, File Transfer, Reload Service)

### 5.1 Skills System

#### `packages/app/src/utils/skills.ts` (NEW FILE)
- 480 lines, complete skills API client
- Types: `SkillAsset`, `SkillPage`, `EnabledSkill`, `SkillState`
- API endpoints:
  - Marketplace: `/api/agi/chat/v1/marketplace/assets/skills`
  - Local skills: `/skill`
  - Status: `/skill-manager/status`
  - Enable/Disable: `/skill-manager/enable`, `/skill-manager/disable`
  - Install/Uninstall: `/skill-manager/install`, `/skill-manager/uninstall`
- Uses `X-Access-Token` header with Cimi token
- Functions: `skillMarket`, `skillRead`, `skillLocal`, `skillStatus`, `skillEnable`, `skillDisable`, `skillInstall`, `skillUninstall`
- Utility functions: `skillJoin`, `skillHas`, `skillPickId`, `skillSet`, `skillSnap`, `skillMine`

#### `packages/app/src/utils/cimi.ts` (NEW FILE)
- 55 lines, CimiCode authentication/token management
- Storage key: `"cimi.skills.token"`
- `cimiBoot()`: Reads token from URL query param, persists to sessionStorage, cleans URL
- `cimiToken()`: Reads token from sessionStorage
- `cimiUrl()`: Extracts token from URL and returns cleaned href

#### `packages/app/src/components/dialog-skills.tsx` (NEW FILE)
- 420 lines, Skills management dialog
- Two tabs: "我的技能" (My Skills) and "技能广场" (Skills Marketplace)
- Full skill browsing, searching, installing, uninstalling UI
- Markdown content preview for skill descriptions

#### `packages/app/src/components/dialog-skills-state.ts` (NEW FILE)
- 93 lines, pure state logic for skills dialog
- Functions: `skillsSearch`, `skillsSelect`, `skillsSync`, `skillsReadId`, `skillsNote`, `skillsMissing`, `skillsAction`

### 5.2 Web File Transfer

#### `packages/app/src/utils/web-file-transfer.ts` (NEW FILE)
- 228 lines, file transfer API client
- Endpoints:
  - `GET /file-manager/list?path=<path>` -- list directory
  - `POST /file-manager/upload` -- upload file (FormData with XHR progress tracking)
  - `GET /file-manager/download?path=<path>` -- download file
  - `POST /file-manager/mkdir` -- create directory
- Helper `triggerDownload()` for browser download trigger

#### `packages/app/src/components/dialog-download-file.tsx` (NEW FILE)
- 1872 lines, comprehensive file browser/download dialog
- Tree view of workspace files, recursive directory listing
- File download with progress, path input, workspace creation
- Upload from download dialog, project creation from downloaded workspace

#### `packages/app/src/components/dialog-upload-file.tsx` (NEW FILE)
- 535 lines, file upload dialog
- Drag-and-drop zone, file/folder selection
- Progress tracking per file, batch upload
- Folder creation capability
- Target path configuration

#### `packages/app/src/components/web-file-transfer.tsx` (NEW FILE)
- 97 lines, floating toolbar for web file transfer
- Portal-mounts to either project-row-left or titlebar-right depending on screen size
- Shows download button (cloud icon) and restart service button
- Upload button present but hidden (`<Show when={false}>`)

### 5.3 Reload Service

#### `packages/app/src/utils/reload.ts` (NEW FILE)
- 11 lines, service restart communication
- Message type: `"cimicode:web:restart-service"`
- `serviceReady()`: Checks if running in iframe
- `servicePost()`: Posts restart message to parent window

---

## 6. Test File Changes

### 6.1 New Test Files

| File | Lines | Purpose |
|------|-------|---------|
| `packages/app/src/utils/cimi.test.ts` | 53 | Tests token extraction, URL cleaning, persistence |
| `packages/app/src/utils/skills.test.ts` | 600 | Tests all skills API helpers, URL builders, payload normalizers |
| `packages/app/src/utils/reload.test.ts` | 45 | Tests iframe detection and restart message posting |
| `packages/app/src/components/dialog-skills.test.tsx` | 183 | Tests skills dialog state logic |
| `packages/ui/src/context/marked.test.ts` | 34 | Tests markdown parser with mermaid and math |
| `packages/ui/src/components/html-preview.test.ts` | 19 | Tests HTML preview component |

### 6.2 Modified Test Files

#### `packages/app/src/utils/persist.test.ts`
- Storage key assertion changed from `"opencode.workspace."` to `"cimicode.workspace."`

#### `packages/app/src/pages/layout/helpers.test.ts`
- All deep link URLs changed from `opencode://` to `cimicode://`
- Window global changed from `__OPENCODE__` to `__CIMICODE__`

### 6.3 E2E Test Files (Complete Rewrite)

All e2e test files in `packages/app/e2e/` were rewritten. Key changes include:
- `fixtures.ts`: Updated to support CimiCode-specific setup
- `selectors.ts`: Updated selectors for new UI structure
- `utils.ts`: Updated utility functions
- `tsconfig.json`: Changed module settings
- `todo.spec.ts`: Removed (11 lines deleted)
- All spec files updated to match new component structure and branding

---

## 7. UI Package Changes (`packages/ui/`)

### 7.1 `packages/ui/src/styles/theme.css`
- Font families changed:
  - Sans: `ui-sans-serif, system-ui, ...` --> `"Inter", "Inter Fallback"`
  - Mono: `ui-monospace, SFMono-Regular, ...` --> `"IBM Plex Mono", "IBM Plex Mono Fallback"`
- Font feature settings: `"ss03" 1` for sans, `"ss01" 1` for mono
- **Why:** Use CimiCode's chosen fonts (Inter + IBM Plex Mono)

### 7.2 `packages/ui/src/styles/base.css`
- Line 85: Removed `#root:not([aria-hidden])` wrapper from tauri-drag-region CSS
- **Why:** Allow drag region to work outside of root element context

### 7.3 `packages/ui/src/components/dialog.css`
- Added ~314 lines of new CSS for:
  - `.settings-fullscreen-wrapper` -- fullscreen settings overlay
  - `.skills-fullscreen-wrapper` -- fullscreen skills overlay
  - `.settings-header` / `.skills-header` -- close button positioning
  - `.settings-close-button` / `.skills-close-button` -- styled close buttons
  - `.skills-content`, `.skills-shell`, `.skills-side`, `.skills-main` -- skills layout
  - `.skills-list`, `.skills-item`, `.skills-empty` -- skills list styling
  - `.skills-main-head`, `.skills-main-body`, `.skills-block`, `.skills-label`, `.skills-copy` -- skills detail
  - `@keyframes slideInFromRight` / `@keyframes slideOutToRight` -- slide animations
- **Why:** Custom CSS for fullscreen settings and skills dialogs

### 7.4 `packages/ui/src/components/icon.tsx`
- Added 4 new icons: `flash`, `refresh`, `project-space`, `shield-check`
- Added custom viewBox map for icons with non-standard viewboxes (`flash`: 1024x1024, `project-space`: 1024x1024)
- **Why:** Icons needed for slash command, restart, file transfer, and permission buttons

### 7.5 `packages/ui/src/components/html-preview.tsx` (NEW FILE)
- 183 lines, secure HTML preview component
- Uses DOMPurify with strict CSP and sanitization config
- Iframe-based rendering with sandbox restrictions
- Source/Preview mode toggle

### 7.6 `packages/ui/src/components/previews/` (NEW FILES)
- `docx-preview.tsx` (113 lines) -- DOCX file preview via mammoth.js
- `pdf-preview.tsx` (165 lines) -- PDF file preview via pdf.js
- `pptx-preview.tsx` (110 lines) -- PPTX file preview
- `xlsx-preview.tsx` (273 lines) -- XLSX file preview via SheetJS
- **Why:** Support previewing common document types in file viewer

### 7.7 `packages/ui/src/context/marked.tsx`
- Changed `import { marked }` to `import { Marked }` (named import)
- Added mermaid diagram support (`<pre class="mermaid">`)
- Exported `renderMathExpressions()` and `highlightCodeBlocks()` functions
- Added standalone `highlight()` function for code blocks
- **Why:** Enable mermaid diagrams in markdown rendering; expose rendering utilities

### 7.8 `packages/ui/src/hooks/create-auto-scroll.tsx`
- Replaced reactive `store.scrollRef` with plain `let scroll` variable
- Replaced `createEventListener` with manual `addEventListener`/`removeEventListener`
- Added `cleanup` function pattern for proper teardown
- **Why:** Simplify scroll handling, fix potential memory leaks

### 7.9 `packages/ui/src/i18n/en.ts`
- Removed keys: `ui.sessionReview.title.git`, `ui.sessionReview.title.branch`, `ui.sessionTurn.diffs.*`
- Added keys: `ui.htmlPreview.mode.source`, `ui.htmlPreview.mode.preview`, `ui.htmlPreview.restore`, `ui.htmlPreview.openInBrowser`

### 7.10 `packages/ui/src/i18n/zh.ts` / `packages/ui/src/i18n/zht.ts`
- Added Chinese translations for HTML preview keys

### 7.11 Font Assets (NEW FILES)
Added 30+ font files in `packages/ui/src/assets/fonts/`:
- Geist family (regular, medium, italic, mono)
- IBM Plex Mono
- Inter (regular, italic)
- Nerd Font variants (Fira Code, Hack, Inconsolata, Intel One Mono, Iosevka, JetBrains Mono, Meslo LGS, Roboto Mono, Source Code Pro, Ubuntu Mono)
- **Why:** Self-hosted fonts for CimiCode to avoid external dependencies

### 7.12 Other UI Changes
- `accordion.css` / `accordion.tsx`: Minor styling adjustments
- `avatar.tsx`, `button.tsx`, `card.tsx`, `icon-button.tsx`, `progress-circle.tsx`, `tag.tsx`: Minor changes
- `dock-surface.tsx`: Minor adjustments
- `tabs.tsx`: Minor adjustments
- `provider-icons/sprite.svg` + `types.ts`: Added new provider icon (zenmux)
- `pierre/index.ts`, `pierre/media.ts`, `pierre/worker.ts`, `pierre/commented-lines.ts`: Minor updates
- `file-icons/sprite.svg` + `types.ts`: Added new file type icons

---

## 8. Other Changes

### 8.1 `packages/app/.gitignore`
- Added `dist-development` and `dist-production` to gitignore
- **Why:** Ignore build output directories

### 8.2 `packages/app/src/context/terminal-title.ts`
- Rewrote to use i18n dictionaries instead of hardcoded strings
- Imports all locale dictionaries to build `numbered` array
- **Why:** Consistency with i18n system

### 8.3 `packages/app/src/custom-elements.d.ts`
- Changed from symlink (`../../ui/src/custom-elements.d.ts`) to `/// <reference path="..." />` directive
- **Why:** Symlink may not work across all platforms/environments

### 8.4 `packages/app/README.md`
- Updated for CimiCode project

### 8.5 `packages/app/src/components/dialog-select-model-unpaid.tsx`
- Changed from dynamic imports to direct imports for `DialogConnectProvider` and `DialogSelectProvider`
- Updated i18n keys from `opencode.tagline` to `cimi.tagline` and `opencodeGo.tagline` to `cimigo.tagline`

### 8.6 `packages/app/src/testing/` files
- `model-selection.ts`, `prompt.ts`, `session-composer.ts`, `terminal.ts`: Updated test utilities

### 8.7 `packages/app/src/components/session/session-header.tsx`
- Removed conditional rendering based on `isDesktopBeta` settings
- All controls (search, terminal, file tree, status) now always visible

---

## 9. Summary of Key URLs and Endpoints

| Purpose | URL/Value |
|---------|-----------|
| CimiCode icon logo | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-icon_beta.svg` |
| CimiCode text logo | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.svg` |
| CimiCode webp logo | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-logo.webp` |
| CimiCode empty state | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-none.svg` |
| Preset models JSON | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-models.json` |
| Dev skill download base | `http://t-app.cdtp.com/api/agi/chat` |
| Prod skill download base | `http://app.cxmt.com/api/agi/chat` |
| AI model gateway | `http://agi-gateway.cxmt.com/v1` |
| Skill marketplace API | `/api/agi/chat/v1/marketplace/assets/skills` |
| Skill manager (local) | `/skill`, `/skill-manager/status`, `/skill-manager/enable`, etc. |
| File manager (local) | `/file-manager/list`, `/file-manager/upload`, `/file-manager/download`, `/file-manager/mkdir` |
| Restart service message | `cimicode:web:restart-service` |
| Token storage key | `cimi.skills.token` |
| Global storage key | `cimicode.global.dat` |
| Workspace storage prefix | `cimicode.workspace.` |
| Deep link scheme | `cimicode://` |
| Window global | `__CIMICODE__` |

---

## 10. Files Changed Count

- **Total files changed:** 303
- **Lines added:** ~27,429
- **Lines removed:** ~4,596
- **New files created:** ~80+ (including fonts, tests, components, utilities)
- **New components:** DialogSkills, DialogQuickSetupPreset, DialogDownloadFile, DialogUploadFile, WebFileTransfer, AppLoading, WindowControls
- **New utilities:** cimi.ts, skills.ts, web-file-transfer.ts, reload.ts, use-preset-models.ts
- **New theme:** cimi-blue.json

---

## 11. Electron Desktop Branding Changes (commit `3547f3912` on main)

> **重要：** 这些修改在 main 分支的 commit `3547f3912 品牌修改` 中，需要合并到 dev-new 分支。
> 如果再次合并上游代码丢失品牌，参考本节逐项恢复。

### 11.0 品牌规范速查

| 项目 | 值 |
|------|-----|
| 产品名 (productName) | `Cimi` (dev: `Cimi Dev`, beta: `Cimi Beta`) |
| appId | `ai.cimicode.desktop.dev` / `ai.cimicode.desktop.beta` / `ai.cimicode.desktop` |
| 深度链接 scheme | `cimi://` |
| 渲染器协议 | `cimi://renderer` |
| 服务器认证用户名 | `cimi` |
| CORS | `cimi://renderer` |
| 数据目录 | `~/.cimi/cimicode` |
| 数据库文件 | `~/.local/share/cimicode/cimicode.db` |
| 缓存目录 | `~/.cache/cimicode` |
| 状态目录 | `~/.local/state/cimicode` |
| Electron store 名 | `cimicode.settings` |
| 桌面图标源文件 | `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-desktop-icon.jpg` |
| NSIS 安装包名 | `cimicode-electron-${os}-${arch}.${ext}` |

### 11.1 `packages/desktop-electron/electron-builder.config.ts`
- `artifactName`: `"opencode-electron-${os}-${arch}.${ext}"` --> `"cimicode-electron-${os}-${arch}.${ext}"`
- `protocols`: `{ name: "OpenCode", schemes: ["opencode"] }` --> `{ name: "Cimi", schemes: ["cimi"] }`
- `win.icon`: 保持 `resources/icons/icon.ico`（图标文件已替换）
- **关键：** `win.signAndEditExecutable: false` — 禁用 electron-builder 自带的 rcedit（它会损坏 exe 导致无法启动）
- **关键：** `win.signtoolOptions: {}` — 不用签名（非 GitHub Actions 环境）
- **关键：** `win.target: ["nsis", "dir"]` — 同时生成 NSIS 安装包和解压目录
- `afterPack` hook：在 exe 写入后、NSIS 打包前用 rcedit 注入图标（重试机制，5次）
- `appId` (dev): `ai.cimicode.desktop.dev`
- `appId` (beta): `ai.cimicode.desktop.beta`
- `appId` (prod): `ai.cimicode.desktop`
- `productName` (dev): `Cimi Dev`
- `productName` (beta): `Cimi Beta`
- `productName` (prod): `Cimi`
- **为什么 `signAndEditExecutable: false`：** electron-builder 26.x 的 rcedit 在 Windows 上与 Electron 41 的 exe 不兼容，会报 "Fatal error: Unable to commit changes" 并损坏 exe 文件

### 11.2 `packages/desktop-electron/electron.vite.config.ts`
- 环境变量：`OPENCODE_CHANNEL` --> `CIMICODE_CHANNEL`
- define: `import.meta.env.CIMICODE_CHANNEL` / `VITE_CIMICODE_CHANNEL`

### 11.3 `packages/desktop-electron/package.json`
- `homepage`: `"https://cimicode.ai"`
- `author.name`: `"CimiCode"`, `author.email`: `"hello@cimicode.ai"`

### 11.4 `packages/desktop-electron/src/main/index.ts`
- `APP_NAMES`: `{ dev: "Cimi Dev", beta: "Cimi Beta", prod: "Cimi" }`
- `APP_IDS`: `{ dev: "ai.cimicode.desktop.dev", beta: "ai.cimicode.desktop.beta", prod: "ai.cimicode.desktop" }`
- **自定义目录结构**（替代默认 Electron 路径）：
  ```ts
  const cimiConfigPath = join(homedir(), ".cimi", "cimicode")
  const cimiDataPath = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share", "cimicode")
  const cimiCachePath = process.env.XDG_CACHE_HOME || join(homedir(), ".cache", "cimicode")
  app.setPath("userData", cimiConfigPath)
  app.setPath("appData", cimiDataPath)
  app.setPath("cache", cimiCachePath)
  app.setPath("logs", join(cimiDataPath, "log"))
  ```
- 深度链接：`app.setAsDefaultProtocolClient("cimi")`
- 深度链接过滤：`argv.filter((arg) => arg.startsWith("cimi://"))`
- 服务器认证：`username: "cimi"`
- 数据库检查：`cimicode.db`（原 `opencode/opencode.db`）

### 11.5 `packages/desktop-electron/src/main/constants.ts`
- `SETTINGS_STORE`: `"opencode.settings"` --> `"cimicode.settings"`

### 11.6 `packages/desktop-electron/src/main/server.ts`
- `username`: `"opencode"` --> `"cimi"`
- `cors`: `["oc://renderer"]` --> `["cimi://renderer"]`
- `OPENCODE_SERVER_USERNAME`: `"opencode"` --> `"cimi"`
- `XDG_STATE_HOME`: 使用自定义路径 `~/.local/state/cimicode`（替代 `app.getPath("userData")`）
- `checkHealth` 认证：`cimi:${password}`（原 `opencode:${password}`）

### 11.7 `packages/desktop-electron/src/main/windows.ts`
- `rendererProtocol`: `"oc"` --> `"cimi"`
- 窗口标题：`"OpenCode"` --> `"Cimi"`

### 11.8 `packages/desktop-electron/src/main/menu.ts`
- 第一个菜单 label：`"OpenCode"` --> `"Cimi"`
- Help 菜单文档链接：`"Cimi Documentation"` --> cimicode.ai/docs
- 反馈链接：github.com/anomalyco/cimicode/issues

### 11.9 `packages/desktop-electron/src/main/migrate.ts`
- `TAURI_APP_IDS`：全部改为 `ai.cimicode.desktop.*`
- store 名映射：`opencode.settings.dat` --> `cimicode.settings.dat`
- store 名常量：`"opencode.settings"` --> `"cimicode.settings"`
- 引用注释中的 `opencode.global.dat` --> `cimicode.global.dat`

### 11.10 `packages/desktop-electron/src/main/store.ts`
- 注释中的路径示例更新为 cimicode 命名空间

### 11.11 `packages/desktop-electron/src/renderer/index.html`
- `<title>CimiCode</title>` --> `<title>Cimi</title>`

### 11.12 `packages/desktop-electron/src/renderer/loading.html`
- `<title>CimiCode</title>` --> `<title>Cimi</title>`

### 11.13 `packages/desktop-electron/src/renderer/index.tsx`
- 通知图标 URL：`https://cimicode.ai/favicon-96x96-v3.png`

### 11.14 `packages/desktop-electron/src/renderer/i18n/*.ts` (15个语言文件)
- 所有 `"OpenCode"` 替换为 `"Cimi"`
- 涉及文件：en.ts, zh.ts, zht.ts, ja.ts, ko.ts, fr.ts, de.ts, es.ts, br.ts, da.ts, bs.ts, ar.ts, ru.ts, pl.ts, no.ts

### 11.15 `packages/desktop-electron/src/renderer/i18n/index.ts`
- 品牌引用更新

### 11.16 `packages/desktop-electron/icons/` (所有三个 channel: dev, beta, prod)
- 所有图标文件已从源图片 `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-desktop-icon.jpg` 重新生成
- 处理方式：加圆角 (radius 22%)，生成 RGBA PNG，再转为各平台格式
- 包含：icon.ico (BMP格式, rcedit兼容), icon.icns, icon.png, dock.png
- 包含：Windows Store 尺寸 PNG, iOS AppIcon, Android mipmap

### 11.17 `packages/app/public/` (Web favicon)
- favicon.ico, favicon-v3.ico — 多尺寸 ICO
- favicon-96x96.png, favicon-96x96-v3.png — 96x96 PNG
- apple-touch-icon.png, apple-touch-icon-v3.png — 180x180
- web-app-manifest-192x192.png, web-app-manifest-512x512.png

### 11.18 `packages/app/src/env.d.ts`
- `VITE_OPENCODE_SERVER_HOST` --> `VITE_CIMICODE_SERVER_HOST`
- `VITE_OPENCODE_SERVER_PORT` --> `VITE_CIMICODE_SERVER_PORT`

### 11.19 `packages/app/src/entry.tsx`
- `DEFAULT_SERVER_URL_KEY`: `"cimicode.settings.dat:defaultServerUrl"`
- 通知图标：`cimicode-icon_beta.svg`
- 服务器 URL 校验：`cimicode.ai` hostname 检查
- 使用 `VITE_CIMICODE_SERVER_HOST/PORT`

### 11.20 `packages/app/AGENTS.md`
- dev proxy URL: `https://app.cimicode.ai`

### 11.21 其他已修改的 app 文件 (opencode.ai --> cimicode.ai)
- `packages/app/src/components/dialog-connect-provider.tsx`
- `packages/app/src/components/dialog-custom-provider.tsx`
- `packages/app/src/components/settings-general.tsx`
- `packages/app/src/context/highlights.tsx` (CHANGELOG_URL)
- `packages/app/src/pages/layout/sidebar-items.tsx` (favicon.svg)
- `packages/app/src/pages/error.tsx` (logo URL)
- `packages/desktop-electron/README.md`

---

## 12. 合并检查清单

当从上游同步代码后，按以下清单检查品牌是否丢失：

- [ ] `electron-builder.config.ts`: `signAndEditExecutable: false`, `afterPack` hook 存在, `Cimi` 品牌, `cimi` scheme
- [ ] `src/main/index.ts`: `APP_NAMES` = Cimi, `APP_IDS` = ai.cimicode.*, 自定义目录路径, `cimi://` 深度链接
- [ ] `src/main/constants.ts`: `SETTINGS_STORE` = `cimicode.settings`
- [ ] `src/main/server.ts`: username = `cimi`, cors = `cimi://renderer`, 自定义 XDG_STATE_HOME
- [ ] `src/main/windows.ts`: rendererProtocol = `cimi`, title = `Cimi`
- [ ] `src/main/menu.ts`: label = `Cimi`, URLs 指向 cimicode.ai
- [ ] `src/main/migrate.ts`: APP_IDS = ai.cimicode.*, store 名 = cimicode.*
- [ ] `electron.vite.config.ts`: `CIMICODE_CHANNEL` 环境变量
- [ ] `src/renderer/*.html`: title = `Cimi`
- [ ] `src/renderer/i18n/*.ts`: 无 "OpenCode" 残留
- [ ] `icons/*/icon.ico`: CimiCode 图标（非 OpenCode）
- [ ] `resources/icons/icon.ico`: 与 icons/dev/ 一致
- [ ] `packages/app/public/favicon*`: CimiCode 图标
- [ ] `packages/app/src/env.d.ts`: `VITE_CIMICODE_*` 变量
- [ ] `packages/app/src/entry.tsx`: cimicode storage keys, URLs
- [ ] 全局搜索 `opencode.ai` 确认无残留（排除 `virtual:opencode-server` 和 `OPENCODE_SERVER_USERNAME` 等内部 API 引用）
- [ ] 全局搜索 `OpenCode` 确认无残留（排除代码注释和第三方引用）
- **New tests:** cimi.test.ts, skills.test.ts, reload.test.ts, dialog-skills.test.tsx, marked.test.ts, html-preview.test.ts
