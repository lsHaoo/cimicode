# 阶段1: 构建
FROM registry.hefei.paas-t.cxmt.com/appe-registry/codercom/enterprise-base:ubuntu-20250721-custom AS builder

USER root

# 安装 Node.js（离线）
COPY external-deps/node-v24.14.0-linux-x64.tar.xz /tmp/node-v24.14.0-linux-x64.tar.xz
RUN tar -xf /tmp/node-v24.14.0-linux-x64.tar.xz -C /usr/local --strip-components=1 && \
    rm /tmp/node-v24.14.0-linux-x64.tar.xz

RUN npm config set registry http://172.16.13.24/repository/npm/ 

# 安装 bun
RUN npm install -g bun@1.3.10

WORKDIR /app

# 复制整个项目（.dockerignore 会排除 node_modules, dist 等）
COPY . .

RUN rm -rf /app/node_modules /app/packages/**/node_modules && bun pm cache rm && rm -rf /root/.bun/cache/*

# 转换 patch 文件换行符（Windows CRLF -> Linux LF）
RUN sed -i 's/\r$//' patches/*

# 预先保存 app dist（用户预构建的前端文件，构建时不再重新构建 app）
# COPY packages/app/dist packages-app-dist/

# 移除 patchedDependencies 配置（bun 在 Linux 上处理 patch 有问题）
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.patchedDependencies;fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

# 使用联网镜像源，可移除 postinstall 脚本（不执行 copy-external-deps.mjs）
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.scripts.postinstall;fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

# 关键：修改子包 package.json，添加缺失的依赖（@babel/preset-typescript + solid-js）
# 关键：修改子包 package.json（新增 babel-preset-solid 依赖）
RUN node -e "const fs=require('fs');const path=require('path');const pkgPath=path.join(__dirname,'packages/opencode/package.json');const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));pkg.devDependencies=pkg.devDependencies||{};pkg.dependencies=pkg.dependencies||{};pkg.devDependencies['@babel/preset-typescript']='7.27.1';pkg.dependencies['solid-js']='1.9.10';pkg.devDependencies['babel-preset-solid']='1.9.10';fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2),'utf8')"

# 删除 bun.lock（其中包含私有仓库 URL，需要重新从官方 registry 解析）
RUN rm -f bun.lock

# 配置 Bun linker，避免符号链接导致的 EISDIR 问题
#RUN echo '[install]\nlinker = "hoisted"\nlinkWorkspacePackages = false' > bunfig.toml

# 跳过 electron 二进制下载（服务端构建不需要）
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# 安装依赖（从官方 registry 全新安装）
#RUN bun install --registry https://registry.npmjs.org

# 移除不需要的包（前端/桌面/console/enterprise 都是独立应用，服务端构建只需要 opencode CLI）
RUN rm -rf packages/app packages/desktop packages/desktop-electron packages/storybook packages/console packages/enterprise

# 排除 app 后重新生成 lockfile
RUN bun pm cache rm && rm -rf /root/.bun/cache/*

RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.overrides=p.overrides||{};p.overrides.axios='1.13.6';p.overrides['electron-to-chromium']='1.5.313';p.overrides['safe-array-concat']='1.1.3';fs.writeFileSync('package.json',JSON.stringify(p,null,2))"

RUN HUSKY=0 bun install && \
    cp bun.lock /tmp/bun.lock

# 创建符号链接解决 hoisted 模式下的路径问题
#RUN ln -s /app/package.json /app/node_modules/package.json && \
#    ln -s /app/.github /app/node_modules/.github

ENV OPENCODE_CHANNEL=local

# 构建 cimicode (linux x64)
RUN bun run --cwd packages/opencode script/build-for-coder.ts --single --skip-install
# 阶段2: 运行时镜像
FROM registry.hefei.paas-t.cxmt.com/appe-registry/codercom/enterprise-base:ubuntu-20250721-custom

USER root

# 移除外部 APT 源，防止网络问题
RUN rm -f /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list && \
    rm -rf /etc/apt/trusted.gpg.d/*ppa* /usr/share/keyrings/*ppa*

# 配置 Ubuntu 24.04 内部镜像源
RUN echo 'Types: deb' > /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble noble-updates noble-backports' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo '' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo '## Ubuntu security updates.' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Types: deb' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'URIs: http://172.16.13.24/repository/Ubuntu24up/ ' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Suites: noble-security' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Components: main universe restricted multiverse' >> /etc/apt/sources.list.d/ubuntu.sources && \
    echo 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg' >> /etc/apt/sources.list.d/ubuntu.sources

# 禁用 APT 后置脚本，防止错误
RUN rm -rf /usr/share/dbus-1/system-services/org.freedesktop.PackageKit.service /etc/apt/apt.conf.d/*post* && \
    echo 'APT::Update::Post-Invoke-Success "exit 0";' > /etc/apt/apt.conf.d/90no-post-invoke && \
    echo 'APT::Update::Post-Invoke "exit 0";' >> /etc/apt/apt.conf.d/90no-post-invoke

# 安装 busybox
RUN apt-get update && apt-get install -y --no-install-recommends busybox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 安装 Node.js（离线）
COPY external-deps/node-v24.14.0-linux-x64.tar.xz /tmp/node-v24.14.0-linux-x64.tar.xz
RUN tar -xf /tmp/node-v24.14.0-linux-x64.tar.xz -C /usr/local --strip-components=1 && \
    rm /tmp/node-v24.14.0-linux-x64.tar.xz

# 安装 ripgrep（离线）
COPY external-deps/ripgrep-14.1.1-x86_64-unknown-linux-musl.tar.gz /tmp/ripgrep.tar.gz
RUN tar -xf /tmp/ripgrep.tar.gz -C /tmp && \
    cp /tmp/ripgrep-14.1.1-x86_64-unknown-linux-musl/rg /usr/local/bin/rg && \
    chmod +x /usr/local/bin/rg && \
    rm -rf /tmp/ripgrep*

# 预装 opencode skills 到 root 用户配置目录（单用户容器）
#RUN mkdir -p /root/.config/opencode
#COPY external-deps/skills /root/.config/opencode/skills
# 改为👇 放到非挂载目录，永久保留默认文件
RUN mkdir -p /opt/default-config/opencode
COPY external-deps/skills /opt/default-config/opencode/skills

# 使用 busybox 提供所有常用命令
RUN busybox --install -s /usr/local/bin

ENV PATH="/usr/local/bin:${PATH}"

# 配置 Python pip 源
RUN mkdir -p ~/.pip && \
    echo '[global]\nindex-url = http://172.16.13.24/repository/bfsu-conda/main\ntrusted-host = 172.16.13.24\n' > ~/.pip/pip.conf

# 从构建阶段复制前端和二进制
# COPY --from=builder /app/packages-app-dist /opt/cimicode/web
COPY --from=builder /app/packages/opencode/dist/cimicode-linux-x64/bin/cimicode /usr/local/bin/cimicode
RUN chmod +x /usr/local/bin/cimicode

COPY --from=builder /tmp/bun.lock /tmp/bun.lock

RUN npm config set registry http://172.16.13.24/repository/npm/ 

# 安装 serve 用于前端静态文件服务
# RUN npm install -g serve

# 设置前端 URL 环境变量
ENV OPENCODE_WEB_URL=http://127.0.0.1:13001
# 禁用 models.dev 模型列表获取（内网不可达）
ENV OPENCODE_DISABLE_MODELS_FETCH=1
# 禁用默认插件（opencode-anthropic-auth 需要外网）
ENV OPENCODE_DISABLE_DEFAULT_PLUGINS=1 

# 复制服务控制脚本到临时目录
COPY scripts /tmp/scripts/
RUN chmod +x /tmp/scripts/*.sh

RUN echo '#!/bin/bash\nexec /bin/bash' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

#WORKDIR /studio
# 启动前端静态服务并保持容器运行
CMD ["/entrypoint.sh"]