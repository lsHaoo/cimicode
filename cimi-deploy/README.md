# CimiCode 部署构建

## 构建

### 一条命令

```bash
cd /path/to/cimicode
docker build -f cimi-deploy/Dockerfile -t cimicode:latest .
```

### 构建流程

```
Dockerfile（构建阶段）
  │
  ├─ 1. 安装编译工具 + Node.js（离线）+ Bun
  ├─ 2. 复制源码，删除无关 workspace 包
  ├─ 3. patch package.json（移除 husky、@solidjs/start CDN）
  ├─ 4. bun install（内网 registry + offline-pkgs 兜底）
  ├─ 5. build-for-coder.ts → cimicode 二进制
  │
  ▼
Dockerfile（运行时阶段）
  │
  ├─ Node.js + ripgrep + busybox + cimicode 二进制
  │
  ▼
Docker 镜像
```

### 构建配置

构建参数从 `build-coder.config.json` 读取：

```json
{
  "version": "package.json",
  "channel": "local",
  "release": false
}
```

| 字段 | 说明 |
|------|------|
| `version` | `"package.json"` 取 opencode/package.json 的版本号，也可填具体版本如 `"1.14.25"` |
| `channel` | 发布通道标识，内网构建默认 `"local"` |
| `release` | 是否正式发布（打包压缩并上传），内网构建为 `false` |

---

## 与上游的差异

CimiCode 基于上游 opencode 进行了以下定制改动：

### build-for-coder.ts（定制构建脚本）

| # | 差异 | 原因 |
|---|------|------|
| 1 | 构建参数从配置文件读取 | 不依赖 @opencode-ai/script（需要 git 和外网访问） |
| 2 | 生成空的 models-snapshot.ts | 内网无法访问 models.dev，不含默认模型列表 |
| 3 | 品牌名默认 cimicode | 区别于上游 opencode |
| 4 | --skip-install 跳过跨平台原生模块安装 | 内网 --single 构建不需要 |
| 5 | 不嵌入 Web UI | 内网 Web UI 分开部署 |

### Dockerfile（定制构建流程）

| # | 处理 | 原因 |
|---|------|------|
| 1 | 删除无关 workspace 包（15个） | 减少 bun install 依赖范围，降低内网缺包概率 |
| 2 | 只移除 `prepare` 脚本（husky） | 保留 postinstall（fix-node-pty），仅删 Docker 中无法运行的 |
| 3 | 移除 @solidjs/start catalog 条目 | 指向 pkg.pr.new CDN，内网不可达会导致 install 卡死 |
| 4 | ELECTRON_SKIP_BINARY_DOWNLOAD=1 | 防止依赖树中的 electron postinstall 下载二进制 |
| 5 | 保留 patchedDependencies | 让上游 patch 正常生效（本地文件，无外网访问） |
| 6 | offline-pkgs/npm-packages 兜底 | 内网 registry 缺失的包从本地 .tgz 补装 |

### 运行时定制

| # | 配置 | 说明 |
|---|------|------|
| 1 | OPENCODE_DISABLE_MODELS_FETCH=1 | 禁止从 models.dev 拉取模型列表，用户需自行配置 provider |
| 2 | OPENCODE_DISABLE_DEFAULT_PLUGINS=1 | 禁用默认插件加载 |
| 3 | 预装 ripgrep | opencode 文件搜索依赖 rg，内网无法从 GitHub 下载 |

---

## 兜底机制

内网 registry 缺失的包，从 `offline-pkgs/npm-packages/*.tgz` 本地补装。

遇到新的缺失包：
```bash
npm pack <package>@<version>
cp *.tgz offline-pkgs/npm-packages/
git add offline-pkgs/npm-packages/
```

---

## 部署

```bash
# 推送镜像
docker tag cimicode:latest registry.hefei.paas-t.cxmt.com/appe-registry/codercom/cimicode:latest
docker push registry.hefei.paas-t.cxmt.com/appe-registry/codercom/cimicode:latest

# Coder Workspace 中启动
cimicode serve --print-logs --port 8888 --hostname 0.0.0.0
# 或
bash /tmp/scripts/start.sh
```

---

## 版本固定

| 机制 | 说明 |
|------|------|
| `catalog:` 协议 | root package.json 统一管控直接依赖 |
| `exact = true` | bunfig.toml，不带 ^ ~ |
| `bun.lock` | 保留版本锚点，不删除 |
| `offline-pkgs/*.tgz` | 缺失包由 tgz 文件锁定版本，最可靠 |

---

## 文件结构

```
cimi-deploy/
  ├── Dockerfile                    # 构建用 Dockerfile（两阶段：构建 + 运行时）
  ├── README.md                     # 本文件
  ├── build-coder.config.json       # 构建参数配置（version/channel/release）
  ├── batch-update-workspace.cjs    # workspace 版本批量更新工具
  ├── verify-lockfile.sh            # 依赖版本审计
  └── offline-pkgs/
        ├── node-v24.14.0-linux-x64.tar.xz
        ├── ripgrep-14.1.1-x86_64-unknown-linux-musl.tar.gz
        ├── skills/                 # 预置 skills
        └── npm-packages/           # 缺失依赖 .tgz 存放目录
              └── README.md

packages/opencode/script/
  └── build-for-coder.ts            # CimiCode 定制构建入口

packages/opencode/src/cimi-custom/scripts/
  ├── start.sh                      # 服务启动
  ├── stop.sh                       # 服务停止
  └── restart.sh                    # 服务重启
```
