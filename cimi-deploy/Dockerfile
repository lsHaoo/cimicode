# ============================================================================
# CimiCode 全内网构建 Dockerfile（构建 + 运行时）
#
# 核心策略：内网 registry 优先 + 本地 .tgz 文件夹兜底
#
# 与原 packages/Dockerfile 的区别：
#   1. Bun 版本与 root package.json 一致 (1.3.13)
#   2. 移除 @solidjs/start CDN 源（内网不可达）
#   3. 不删除 bun.lock（保留版本锚点）
#   4. 支持从 cimi-deploy/offline-pkgs/npm-packages/ 本地补装缺失包
#   5. 提前删除不相关的 workspace 包，减少依赖范围
#
# 构建前提：
#   - cimi-deploy/offline-pkgs/npm-packages/ 中放好预下载的 .tgz（缺失的包）
#   - bun.lock 文件存在于项目根目录
#   - cimi-deploy/offline-pkgs/ 中有 Node.js 和 ripgrep 离线包
#
# 构建命令：
#   docker build -f cimi-deploy/Dockerfile -t cimicode:latest .
# ============================================================================

# ==========================================
# 阶段1: 构建
# ==========================================
FROM registry.hefei.paas-t.cxmt.com/appe-registry/codercom/enterprise-base:ubuntu-20250721-custom AS builder

USER root

# ---- 1.1 安装编译工具 ----
# build-essential/pkg-config/python3: bun install 时编译原生模块（tree-sitter、node-pty 等）
# ca-certificates: HTTPS 证书，访问内网 npm registry 需要
# xz-utils: 解压 Node.js .tar.xz 离线包
RUN rm -f /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list && \
    rm -rf /etc/apt/trusted.gpg.d/*ppa* /usr/share/keyrings/*ppa* && \
    echo 'Types: deb' > /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble noble-updates noble-backports' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo '' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Types: deb' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24up/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble-security' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential pkg-config python3 python3-distutils ca-certificates xz-utils && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Node.js（离线）：用于 npm install -g bun 安装 Bun，以及 node -e 修改 package.json
COPY cimi-deploy/offline-pkgs/node-v24.14.0-linux-x64.tar.xz /tmp/node.tar.xz
RUN tar -xf /tmp/node.tar.xz -C /usr/local --strip-components=1 && \
    rm /tmp/node.tar.xz

# 配置 npm 内网镜像（供后续 npm install -g bun 使用）
RUN npm config set registry http://172.16.13.24/repository/npm/

# Bun（版本与 root package.json 一致：1.3.13，通过 npm 安装）
RUN npm install -g bun@1.3.13

WORKDIR /app

# ---- 1.2 复制项目源码 ----
COPY . .

# 清理 Windows 开发环境残留
RUN rm -rf /app/node_modules /app/packages/*/node_modules

# 转换换行符（Windows CRLF -> Linux LF）
RUN sed -i 's/\r$//' patches/* 2>/dev/null || true
RUN find packages/opencode/src/cimi-custom/scripts -name "*.sh" -exec sed -i 's/\r$//' {} \; 2>/dev/null || true

# ---- 1.3 删除不需要的 workspace 包 ----
# opencode 只依赖: core, plugin, script, sdk
# 其余是独立应用，构建 cimicode 不需要
RUN rm -rf packages/app \
    packages/desktop packages/desktop-electron \
    packages/console packages/enterprise \
    packages/storybook packages/web packages/ui \
    packages/slack packages/docs packages/identity \
    packages/function packages/extensions packages/containers

# ---- 1.4 处理 package.json（解决已知内网问题）----

# 只移除 prepare 脚本（husky 在 Docker 中无 .git 会报错）
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.scripts.prepare;fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

# 移除 @solidjs/start catalog 条目（指向 pkg.pr.new CDN，内网不可达）
RUN node -e " \
    const fs=require('fs'); \
    const p=JSON.parse(fs.readFileSync('package.json')); \
    if(p.workspaces && p.workspaces.catalog && p.workspaces.catalog['@solidjs/start']) { \
        delete p.workspaces.catalog['@solidjs/start']; \
        fs.writeFileSync('package.json',JSON.stringify(p,null,2)); \
    }"

# 防止依赖树中的 electron postinstall 脚本下载二进制
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# ---- 1.5 安装依赖（内网 registry + 本地兜底）----
# bunfig.toml 中 exact=true 确保精确版本，bun.lock 保留版本锚点

# 第一步：从内网 registry 安装（部分包可能 404，允许继续）
RUN bun install 2>&1 | tee /tmp/bun-install.log || true

# 第二步：从本地 fallback 文件夹补装缺失包
RUN if [ -d "cimi-deploy/offline-pkgs/npm-packages" ] && ls cimi-deploy/offline-pkgs/npm-packages/*.tgz >/dev/null 2>&1; then \
        echo "=== Fallback: installing missing packages from local .tgz ==="; \
        for tgz in cimi-deploy/offline-pkgs/npm-packages/*.tgz; do \
            echo "  -> $(basename $tgz)"; \
            bun install "$tgz" 2>/dev/null || echo "  WARN: $tgz install failed or already resolved"; \
        done; \
        echo "=== Fallback complete ==="; \
    else \
        echo "No fallback packages found, skipping"; \
    fi

# ---- 1.6 构建 cimicode ----
# --single: 只构建当前平台（Linux x64），不交叉编译
# --skip-install: 跳过跨平台原生模块安装（@opentui/core、@parcel/watcher），1.5 已安装
# 构建参数从 cimi-deploy/build-coder.config.json 读取（version/channel/release）
RUN bun run --cwd packages/opencode script/build-for-coder.ts --single --skip-install

# 验证
RUN BINARY=$(find packages/opencode/dist -name "cimicode" -path "*/bin/*" | head -1) && \
    if [ -z "$BINARY" ]; then echo "BUILD FAILED"; exit 1; fi && \
    echo "Build OK: $BINARY ($(ls -lh $BINARY | awk '{print $5}'))"

# ==========================================
# 阶段2: 运行时镜像
# ==========================================
FROM registry.hefei.paas-t.cxmt.com/appe-registry/codercom/enterprise-base:ubuntu-20250721-custom

USER root

# ---- 2.1 系统配置 ----
RUN rm -f /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list && \
    rm -rf /etc/apt/trusted.gpg.d/*ppa* /usr/share/keyrings/*ppa*

RUN echo 'Types: deb' > /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble noble-updates noble-backports' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo '' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Types: deb' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24up/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble-security' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources

RUN rm -rf /usr/share/dbus-1/system-services/org.freedesktop.PackageKit.service /etc/apt/apt.conf.d/*post* && \
    echo 'APT::Update::Post-Invoke-Success "exit 0";' > /etc/apt/apt.conf.d/90no-post-invoke && \
    echo 'APT::Update::Post-Invoke "exit 0";' >> /etc/apt/apt.conf.d/90no-post-invoke

RUN apt-get update && apt-get install -y --no-install-recommends busybox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN busybox --install -s /usr/local/bin

# ---- 2.2 离线工具 ----
# Node.js: cimicode serve 可能 spawn Node 子进程
COPY cimi-deploy/offline-pkgs/node-v24.14.0-linux-x64.tar.xz /tmp/node.tar.xz
RUN tar -xf /tmp/node.tar.xz -C /usr/local --strip-components=1 && rm /tmp/node.tar.xz

# ripgrep: opencode 文件搜索功能依赖 rg，运行时自动检测 PATH 中的 rg
# 内网无法从 GitHub 下载，必须预装
COPY cimi-deploy/offline-pkgs/ripgrep-14.1.1-x86_64-unknown-linux-musl.tar.gz /tmp/ripgrep.tar.gz
RUN tar -xf /tmp/ripgrep.tar.gz -C /tmp && \
    cp /tmp/ripgrep-14.1.1-x86_64-unknown-linux-musl/rg /usr/local/bin/rg && \
    chmod +x /usr/local/bin/rg && rm -rf /tmp/ripgrep*

ENV PATH="/usr/local/bin:${PATH}"

RUN mkdir -p ~/.pip && \
    echo '[global]\nindex-url = http://172.16.13.24/repository/bfsu-conda/main\ntrusted-host = 172.16.13.24\n' > ~/.pip/pip.conf

# ---- 2.3 CimiCode ----
RUN mkdir -p /opt/default-config/opencode
COPY cimi-deploy/offline-pkgs/skills /opt/default-config/cimicode/skills

COPY --from=builder /app/packages/opencode/dist/cimicode-linux-x64/bin/cimicode /usr/local/bin/cimicode
RUN chmod +x /usr/local/bin/cimicode

RUN npm config set registry http://172.16.13.24/repository/npm/

# OPENCODE_DISABLE_MODELS_FETCH: 禁止从 models.dev 拉取模型列表（内网不可达），用户需自行配置 provider
# OPENCODE_DISABLE_DEFAULT_PLUGINS: 禁用默认插件加载
ENV OPENCODE_DISABLE_MODELS_FETCH=1
ENV OPENCODE_DISABLE_DEFAULT_PLUGINS=1

COPY packages/opencode/src/cimi-custom/scripts /tmp/scripts/
RUN chmod +x /tmp/scripts/*.sh

RUN echo '#!/bin/bash\nexec /bin/bash' > /entrypoint.sh && chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
