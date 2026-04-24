## Context

当前仓库是 `anomalyco/opencode` `v1.2.27` 的产品化分叉。本分支（`lsh-dev`）在过去约一个月内（2026-03 ~ 2026-04）持续迭代，已形成六大产品化能力域：品牌发行、桌面运行时、SSO、Skills、文件工作台、Web 产品化。

上游已演进到 `v1.14.20`，跨约 1,380 commits / 1,482 files changed，且已建立正式的 Electron 桌面线（`packages/desktop-electron` 仍与 `packages/desktop` 并存）。

本分支没有 fork 血缘（git 历史无共同祖先），因此不能走标准 merge/rebase 路线。需要以 `v1.14.20` 为新基线，按能力清单迁移。

关键约束：
- 无 git 共同祖先，语义基线为 `v1.2.27`
- 本分支历史有大量自合并噪音，不能按 commit 回放
- 上游 `v1.14.20` 仍保留 Tauri 和 Electron 双桌面包
- 本分支选择收敛到 Electron 主线

## Goals / Non-Goals

**Goals:**
- 以 `v1.14.20` 干净代码为新基线，重新挂载本分支的全部产品能力
- 桌面主线收敛到 Electron，Tauri 降为过渡资产后冻结
- 32 项子能力全部保留（0 项放弃）
- 后续跟上游的成本显著降低（只需维护一条桌面线）

**Non-Goals:**
- 不在本次做大规模架构重构
- 不在本次统一所有历史配置/目录/文件格式
- 不在本次做新功能开发
- 不在首个里程碑删除 Tauri 全量代码（先冻结再观察）

## Decisions

### Decision 1: 主路线为 upstream-first semantic re-apply

**选择**：以干净的 `v1.14.20` 为基线，按能力清单重新挂载，不在旧分支上硬 merge。

**理由**：
- 无 git 共同祖先，硬 merge 的冲突结果语义不可信
- 本分支历史有大量自合并噪音，按 commit 回放不现实
- 只有按能力迁移才能保证"行为保真"

**备选**：直接在 `lsh-dev` 上 merge upstream `v1.14.20` → 放弃，因风险不可控。

### Decision 2: 桌面主线收敛到 Electron

**选择**：以 `packages/desktop-electron` 为唯一桌面主线，Tauri 冻结退场。

**理由**：
- 上游已正式建立 Electron 线，且 Release Notes 持续更新 Desktop（Electron）相关修复
- 本分支已有 Electron adapter（preload/IPC/main process），迁入成本可控
- 继续维护双壳的长期成本不可接受

**代价**：需补齐 Tauri-only 的三大能力（SSO、registry 写入、预置 skills 分发）。

### Decision 3: 分四阶段推进，每阶段有闸门

**选择**：
1. Phase 0：能力盘点（产出矩阵）
2. Phase 1：对齐上游 shared/app/core，不删 Tauri
3. Phase 2：Electron 补齐缺口，达到可发布
4. Phase 3：Electron 切主线，Tauri 冻结

**理由**：先语义对齐、再宿主切换、后淘汰旧壳，避免同步做两类风险。

### Decision 4: 品牌/命名通过配置覆盖保留

**选择**：品牌差异（Cimi/CimiCode/cimicode）不侵入核心代码，通过构建期配置、i18n 覆盖、electron-builder 配置实现。

**理由**：品牌是最散的改动，如果侵入核心代码，每次升级都要重做。

### Decision 5: SSO 迁到 Electron BrowserWindow

**选择**：将 Tauri 的 SSO gate（iframe + postMessage + origin 校验）迁移到 Electron BrowserWindow + deep-link 回调。

**理由**：SSO 是 Tauri-only 的最大能力缺口，必须迁。Electron 的 BrowserWindow 天然支持 iframe + 跨域控制。

## Risks / Trade-offs

### [风险] 数据目录迁移可能静默丢失用户数据
- **现状**：Tauri 用 `~/.cimi/cimicode`，Electron 偏 `~/.opencode`
- **缓解**：Phase 3 之前必须实现双读兼容窗口，老用户升级后数据不丢

### [风险] 协议 scheme 不一致导致 deep-link 失效
- **现状**：注册 `opencode`，前端解析 `cimicode://`
- **缓解**：Phase 2 之前统一协议注册，并保留旧协议的兼容监听期

### [风险] CLI 路径体系不一致
- **现状**：Tauri `.cimi/cimicode/bin/cimicode`，Electron `.opencode/bin/opencode`
- **缓解**：保留双路径查找逻辑，直到老路径无活跃用户

### [风险] 预置 skills 在 Electron 打包中缺失
- **现状**：Tauri 有 `resources/skills/**` + 首启复制，Electron 无
- **缓解**：Phase 2 必须完成 skills 资源打包 + 首启逻辑

### [风险] Electron sidecar 当前可能不可用
- **现状**：Electron resources 里的 `cli.cjs` 是占位实现
- **缓解**：Phase 2 必须用真正的 CLI 替换占位物

### [风险] "升级 + 宿主切换" 同步做放大交付不确定性
- **缓解**：严格按四阶段推进，Phase 1 不碰桌面壳，Phase 2 才做 Electron 补齐

### [Trade-off] 冻结 Tauri 而非立即删除
- **好处**：保留回退抓手，观察期后再删
- **代价**：短期内仍有双壳代码存在于仓库

## Open Questions

1. Electron 的 SSO 承接模型是否需要 BrowserWindow 嵌套还是可以复用 deep-link 回调？
2. `cimi/cimicode/opencode` 命名空间是否需要在新版本中统一，还是保留双读兼容？
3. CLI + 数据目录 + 预置 skills 的迁移是否需要自动迁移脚本？
4. 是否需要在首个版本就支持从现有 Tauri 安装无缝升级，还是可以接受手动迁移？
