## 1. Phase 0：准备工作

- [ ] 1.1 添加 upstream remote（`anomalyco/opencode`），fetch tag `v1.14.20`
- [ ] 1.2 从 `v1.14.20` tag 创建新集成分支 `integrate-v11420`
- [ ] 1.3 备份当前开发线：`git tag backup/lsh-dev-before-v11420`
- [ ] 1.4 完成能力盘点矩阵：逐项对照 `v1.14.20` 代码，标记"上游已支持 / 需保留 / 需新建"
- [ ] 1.5 梳理 `v1.14.20` 的 package graph 变化（是否有包合并/重命名/删除）

## 2. Phase 1：对齐上游 shared/app/core

- [ ] 2.1 对齐 `packages/opencode` 核心后端到 `v1.14.20`（server routes、session、config、skill 模型）
- [ ] 2.2 对齐 `packages/sdk/js` API 契约到 `v1.14.20`（schema、types、client）
- [ ] 2.3 对齐 `packages/ui` 组件库到 `v1.14.20`
- [ ] 2.4 对齐 `packages/app` 共享前端到 `v1.14.20`（context、pages、components）
- [ ] 2.5 对齐 `packages/util` 工具库到 `v1.14.20`
- [ ] 2.6 对齐 `packages/web` Web 包到 `v1.14.20`
- [ ] 2.7 对齐根 workspace 配置（package.json、tsconfig、bun workspace 等）
- [ ] 2.8 验证：核心 CLI + TUI 在新基线上可正常构建和运行

## 3. Phase 2：品牌与命名层恢复

- [ ] 3.1 恢复 Cimi 品牌到 `packages/desktop-electron`（electron-builder productId、productName、appId）
- [ ] 3.2 恢复 i18n 中的 Cimi 品牌文案（`packages/app/src/i18n/`）
- [ ] 3.3 恢复自定义协议 scheme `cimicode://`（Electron main process + deep-link 注册）
- [ ] 3.4 恢复 VS Code 扩展的 CimiCode 品牌（`sdks/vscode/package.json`）
- [ ] 3.5 恢复安装器/图标/资源文件的品牌元素
- [ ] 3.6 验证：Electron 桌面端启动后显示 Cimi 品牌，deep-link 可唤起

## 4. Phase 3：Electron 桌面运行时链路迁移

- [ ] 4.1 迁移 CLI PATH 注入到 Electron main process（首次启动自动安装 CLI）
- [ ] 4.2 迁移"无需预装 Node"到 Electron 打包（bundled Node/resources）
- [ ] 4.3 迁移内置 ripgrep 到 Electron resources
- [ ] 4.4 迁移安装报错优化/重试提示到 Electron 安装流程
- [ ] 4.5 迁移 CLI sidecar 用真正 CLI 替换占位 `cli.cjs`
- [ ] 4.6 实现 CLI 路径双读兼容（支持 `.cimi/cimicode` 和新路径）
- [ ] 4.7 验证：Electron 桌面端冷启动、CLI 可用、sidecar 正常连接

## 5. Phase 4：SSO 迁移到 Electron

- [ ] 5.1 将 `SSOGate.tsx` 迁移到 Electron renderer 层（iframe + postMessage + origin 校验）
- [ ] 5.2 实现 Electron BrowserWindow 承载 SSO 全屏门禁
- [ ] 5.3 对齐 SSO 回调到 Electron deep-link 链路（callback 监听修复）
- [ ] 5.4 注册自定义 Provider（CXMI/Cimi）到 `v1.14.20` 的 provider 体系
- [ ] 5.5 验证：SSO 登录/登出/首次门禁在 Electron 上完整闭环

## 6. Phase 5：npm/bun registry 写入迁移

- [ ] 6.1 将 registry 写入逻辑从 Tauri Rust 迁到 Electron main process
- [ ] 6.2 实现 `~/.npmrc` 和 `~/.bunfig.toml` 的安全写入（不覆盖用户已有配置）
- [ ] 6.3 验证：启动后 registry 配置正确，包安装走内部源

## 7. Phase 6：预置 Skills 分发迁移

- [ ] 7.1 将预置 skills 资源加入 Electron 打包配置（electron-builder extraResources）
- [ ] 7.2 实现首次启动时 skills 复制到用户目录的逻辑（不覆盖已有）
- [ ] 7.3 验证：首次启动后用户 skills 目录包含所有预置 skills

## 8. Phase 7：Skills 产品线恢复

- [ ] 8.1 对齐 `v1.14.20` 的 skill 发现/扫描模型（`.claude/.agents/.opencode` 目录结构）
- [ ] 8.2 恢复 skills 前端管理页面（dialog-skills.tsx）
- [ ] 8.3 恢复 marketplace 对接（skills.ts 中的 URL/token/下载逻辑）
- [ ] 8.4 恢复 skills 重启/卸载生命周期控制
- [ ] 8.5 恢复 skills 展示简化行为（只显示名称）
- [ ] 8.6 验证：skills 浏览/安装/卸载/重启完整可用，marketplace 可下载

## 9. Phase 8：文件工作台能力恢复

- [ ] 9.1 恢复 markdown/html 文件预览
- [ ] 9.2 恢复 docx/xlsx/pptx/pdf 文件预览
- [ ] 9.3 恢复文件下载功能（dialog-download-file.tsx）
- [ ] 9.4 恢复文件上传/目录创建（dialog-upload-file.tsx）
- [ ] 9.5 恢复 Web 附件发送（web-file-transfer.tsx + prompt-input attachments）
- [ ] 9.6 恢复附件按钮位置调整
- [ ] 9.7 对齐 `v1.14.20` 的 file-manager 路由（`/file-manager/*`）
- [ ] 9.8 验证：文件预览/上传/下载/附件在 Desktop 和 Web 端完整可用

## 10. Phase 9：Web 产品化能力恢复

- [ ] 10.1 恢复 iframe 访问限制（middleware 检查）
- [ ] 10.2 恢复 Web loading 优化
- [ ] 10.3 恢复浏览器页签标题定制
- [ ] 10.4 恢复 Web 版本隐藏服务信息
- [ ] 10.5 验证：Web 版在 iframe 中正常工作，访问限制生效

## 11. Phase 10：数据迁移兼容与产品化收尾

- [ ] 11.1 实现从 Tauri 到 Electron 的数据目录迁移（配置/skills/默认服务器）
- [ ] 11.2 恢复模型配置编辑支持
- [ ] 11.3 恢复配置页面显示优化
- [ ] 11.4 恢复文案/通知/提示词定制
- [ ] 11.5 验证：从 Tauri 版本升级到 Electron 版本后用户数据完整保留

## 12. Phase 11：构建发布流水线与最终验证

- [ ] 12.1 适配 Electron 打包流水线（Windows/macOS/Linux）
- [ ] 12.2 配置 Electron 自动更新（electron-updater）
- [ ] 12.3 配置 Cimi 品牌的安装器/图标/协议注册
- [ ] 12.4 端到端验收：启动、登录(SSO)、对话、skills、文件工作台、deep-link、更新
- [ ] 12.5 冻结 Tauri 桌面包（标记为 deprecated，不再接受新功能）
- [ ] 12.6 清理分支，合并 `integrate-v11420` 到 `lsh-dev`
