## ADDED Requirements

### Requirement: Electron 为唯一桌面主线
系统 SHALL 以 `packages/desktop-electron` 作为唯一积极维护的桌面实现。Tauri 桌面包 SHALL 进入冻结状态，不再接受新功能。

#### Scenario: Electron 桌面端正常启动
- **WHEN** 用户启动 Electron 桌面应用
- **THEN** 应用正常加载，显示 Cimi 品牌界面，sidecar 启动成功

#### Scenario: Tauri 桌面不再演进
- **WHEN** 后续版本发布
- **THEN** `packages/desktop` 不再包含新功能提交

### Requirement: SSO 门禁迁到 Electron
系统 SHALL 在 Electron 桌面端提供完整的 SSO 门禁能力，包括 iframe 嵌套、postMessage 通信、origin 校验和登录回调处理。

#### Scenario: 未登录用户看到 SSO 门禁
- **WHEN** 用户首次启动 Electron 桌面端且未登录
- **THEN** 显示全屏 SSO 门禁页面，用户在 iframe 内完成企业 SSO 登录

#### Scenario: SSO 登录成功后回到应用
- **WHEN** 用户在 SSO 门禁中完成登录
- **THEN** 门禁关闭，应用正常显示工作空间

#### Scenario: SSO 登录失败有明确提示
- **WHEN** SSO 认证流程失败
- **THEN** 显示明确的错误信息，提供重试入口

### Requirement: 自定义 Provider 支持
系统 SHALL 支持自定义供应商（如 CXMI/Cimi）的注册和展示，用户可在登录页看到自定义供应商选项。

#### Scenario: 自定义供应商出现在 Provider 列表
- **WHEN** 用户打开 Provider 连接界面
- **THEN** 列表中包含 CXMI/Cimi 等自定义供应商选项

### Requirement: CLI PATH 注入迁到 Electron
系统 SHALL 在 Electron 桌面端首次启动时自动将 CLI 安装到用户 PATH，用户无需手动配置。

#### Scenario: 首次启动自动安装 CLI
- **WHEN** 用户首次启动 Electron 桌面端
- **THEN** CLI 自动安装到用户 PATH，终端可直接使用 `cimicode` 命令

#### Scenario: 已安装 CLI 不重复安装
- **WHEN** CLI 已在 PATH 中
- **THEN** 启动时跳过安装步骤

### Requirement: 无需预装 Node 环境即可运行
系统 SHALL 在 Electron 桌面端无需用户预装 Node.js 即可正常运行所有功能。

#### Scenario: 无 Node 环境下正常启动
- **WHEN** 用户机器未安装 Node.js
- **THEN** Electron 桌面端正常启动且所有功能可用

### Requirement: 内置 ripgrep 工具
系统 SHALL 在 Electron 打包中内置 ripgrep 二进制，grep 工具开箱即用。

#### Scenario: grep 工具开箱即用
- **WHEN** 用户在会话中触发代码搜索
- **THEN** ripgrep 正常工作，无需用户额外安装

### Requirement: npm/bun registry 写入
系统 SHALL 在 Electron 桌面端启动时配置内部 npm/bun registry，确保包安装走内部源。

#### Scenario: 启动时写入 registry 配置
- **WHEN** Electron 桌面端启动
- **THEN** 自动写入 `~/.npmrc` 和 `~/.bunfig.toml` 配置内部 registry 地址

#### Scenario: 不覆盖用户已有配置
- **WHEN** 用户已有自定义 registry 配置
- **THEN** 不强制覆盖，或在写入前提示用户

### Requirement: 预置 Skills 随安装包分发
系统 SHALL 在 Electron 桌面端首次启动时将预置 skills 从打包资源复制到用户目录。

#### Scenario: 首次启动预置 skills
- **WHEN** 用户首次启动 Electron 桌面端
- **THEN** 内置 skills（brainstorming、docx、drawio、pdf、pptx、xlsx 等）自动复制到用户 skills 目录

#### Scenario: 已有 skills 不重复复制
- **WHEN** 用户 skills 目录已存在同名 skill
- **THEN** 不覆盖已有版本

### Requirement: 品牌通过配置覆盖保留
系统 SHALL 通过构建期配置（electron-builder、i18n、资源文件）保留 Cimi/CimiCode 品牌，不侵入核心代码。

#### Scenario: 桌面端显示 Cimi 品牌
- **WHEN** 用户启动 Electron 桌面端
- **THEN** 窗口标题、任务栏、安装器均显示 Cimi 品牌名称

#### Scenario: 协议 scheme 为 cimicode://
- **WHEN** 浏览器通过 deep-link 唤起应用
- **THEN** 使用 `cimicode://` 协议

### Requirement: 数据目录迁移兼容
系统 SHALL 在从 Tauri 版本升级到 Electron 版本时保留用户数据（配置、skills、默认服务器等），不静默丢失。

#### Scenario: 从 Tauri 版本升级后数据保留
- **WHEN** 用户从 Tauri 版本升级到 Electron 版本
- **THEN** 原有配置、skills、默认服务器、WSL 开关等全部保留

#### Scenario: 新安装不影响老数据
- **WHEN** 新用户首次安装 Electron 版本
- **THEN** 使用新的数据目录结构，不与旧路径冲突

### Requirement: Skills 管理能力保留
系统 SHALL 保留 skills 的前端管理页面，支持浏览、安装、卸载、重启 skills，并对接 marketplace。

#### Scenario: 浏览可用 skills
- **WHEN** 用户打开 skills 管理页面
- **THEN** 显示已安装和 marketplace 可用的 skills 列表

#### Scenario: 安装 marketplace skill
- **WHEN** 用户从 marketplace 选择并安装一个 skill
- **THEN** skill 下载、安装成功，出现在已安装列表中

#### Scenario: 卸载 skill
- **WHEN** 用户卸载一个已安装的 skill
- **THEN** skill 从列表中移除，相关资源清理

### Requirement: 文件工作台能力保留
系统 SHALL 保留文件预览（markdown/html/docx/xlsx/pptx/pdf）、下载、上传、Web 附件发送等文件工作台能力。

#### Scenario: 预览 Office 文件
- **WHEN** 用户在会话中点击一个 .docx/.xlsx/.pptx/.pdf 文件
- **THEN** 在应用内预览该文件内容

#### Scenario: Web 端上传文件
- **WHEN** Web 版用户使用文件上传功能
- **THEN** 文件成功上传到工作空间，可在对话中引用

#### Scenario: 下载文件到本地
- **WHEN** 用户使用文件下载功能
- **THEN** 文件成功下载到用户本地
