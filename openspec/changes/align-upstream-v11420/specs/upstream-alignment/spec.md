## ADDED Requirements

### Requirement: 以 v1.14.20 为新代码基线
系统 SHALL 以 `anomalyco/opencode` `v1.14.20` 的干净代码作为新基线，替代当前基于 `v1.2.27` 的分叉。

#### Scenario: 核心包版本对齐 v1.14.20
- **WHEN** 完成对齐后检查各包版本号
- **THEN** `packages/opencode`、`packages/sdk/js`、`packages/ui`、`packages/app`、`packages/web` 等核心包的版本和代码与上游 `v1.14.20` 对齐

### Requirement: 共享层语义对齐
系统 SHALL 先对齐 `packages/opencode` + `packages/sdk/js` + `packages/app` 的核心协议面，再挂载产品化能力。

#### Scenario: API 契约对齐
- **WHEN** 前端通过 SDK 调用后端 API
- **THEN** 请求/响应 schema 与 `v1.14.20` 一致，不依赖旧版废弃接口

#### Scenario: skill 数据模型对齐
- **WHEN** skill 发现/扫描/执行
- **THEN** skill 模型与 `v1.14.20` 的 skill 体系兼容

### Requirement: Web 产品化能力保留
系统 SHALL 保留 Web 版的 iframe 访问限制、Web loading 优化、浏览器页签标题定制等 Web 产品化能力。

#### Scenario: iframe 限制访问
- **WHEN** Web 版被非授权来源访问
- **THEN** 拒绝加载或限制功能

#### Scenario: 自定义页签标题
- **WHEN** Web 版在浏览器中打开
- **THEN** 浏览器页签显示自定义标题

### Requirement: VS Code 扩展独立维护
系统 SHALL 保留 CimiCode 品牌的 VS Code 扩展，独立于主项目发布。

#### Scenario: 扩展正常工作
- **WHEN** 用户在 VS Code 中安装 CimiCode 扩展
- **THEN** 扩展正常连接到 opencode 后端，功能与主项目版本匹配

### Requirement: 构建发布流水线适配 Electron
系统 SHALL 适配 Electron 打包、分发、自动更新流水线。

#### Scenario: Electron 桌面端打包发布
- **WHEN** 触发发布流水线
- **THEN** 输出 Windows/macOS/Linux 的 Electron 安装包，包含品牌资源、CLI sidecar、预置 skills
