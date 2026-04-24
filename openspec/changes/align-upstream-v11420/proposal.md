## Why

当前仓库是基于 `anomalyco/opencode` `v1.2.27` 迁出代码后的产品化分叉，已在品牌化、SSO、Skills 体系、文件工作台、桌面运行时等方面形成完整的产品增量。上游已演进到 `v1.14.20`（约 1,380 commits、1,482 files changed），本分支已无法安全地通过直接 merge 同步。需要以 `v1.14.20` 为新基线，将本分支已验证的产品能力重新对齐到上游新版本，同时将桌面主线从 Tauri 收敛到 Electron。

## What Changes

- **上游对齐**：以 `anomalyco/opencode` `v1.14.20` 为新代码基线，替代当前基于 `v1.2.27` 的分叉
- **桌面收敛**：桌面主线从 Tauri 切换到 Electron，不再维护双桌面壳
- **品牌保留**：Cimi/CimiCode 品牌体系通过配置覆盖和构建期替换保留，不侵入核心代码
- **SSO 迁移**：将 Tauri-only 的 SSO gate（iframe + postMessage + 全屏门禁）迁移到 Electron BrowserWindow 实现
- **Skills 保留**：保留 marketplace 对接、本地 skills 管理、预置 skills 分发等产品能力，对齐上游 skill 数据模型
- **文件工作台保留**：保留 docx/xlsx/pptx/pdf 预览、Web 文件传输、附件发送等产品能力
- **运行时链路迁移**：CLI PATH 注入、无需预装 Node、内置 ripgrep、registry 写入等迁到 Electron 主进程
- **Web 产品化保留**：iframe 访问限制、Web loading 优化、页签标题定制等保留

## Capabilities

### New Capabilities

- `desktop-electron-convergence`: 桌面主线从 Tauri 收敛到 Electron，包括宿主能力迁移（SSO、CLI pathing、预置 skills、registry 写入、品牌协议）
- `upstream-alignment`: 以 v1.14.20 为基线的上游对齐策略，包括共享层（app/sdk/opencode）的语义对齐和本分支产品增量的重新挂载

### Modified Capabilities

## Impact

- **packages/desktop（Tauri）**：降为过渡资产，不再承载未来主路径，最终冻结退场
- **packages/desktop-electron**：成为唯一桌面主线，需补齐 SSO、预置 skills、registry 写入等 Tauri 独有能力
- **packages/app**：共享前端壳，需对齐上游 v1.14.20 的 API 契约和 UI 变化
- **packages/opencode**：核心后端/CLI，需对齐上游 v1.14.20 的 server routes、skill 模型、session 管理
- **packages/sdk/js**：SDK 协议面，需对齐上游 v1.14.20 的 API schema
- **packages/web**：Web 产品化能力保留
- **sdks/vscode**：独立维护的品牌扩展
- **构建/发布流水线**：需适配 Electron 打包、分发、自动更新
