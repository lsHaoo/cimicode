# npm-packages: 内网缺失依赖兜底目录

## 用途

存放预下载的 npm 包（.tgz 格式），用于在内网构建时补装 registry 中缺失的依赖。

## 添加缺失包

在外网机器上下载，然后放入此目录：

```bash
# 下载单个包
npm pack <package>@<version>

# 例
npm pack hono@4.7.0
npm pack @ai-sdk/anthropic@1.2.0
```

将生成的 `.tgz` 文件放到此目录，提交到 git 即可。

## 内网构建自动使用

Docker 构建时会自动从此目录读取 `.tgz` 进行补装：

```bash
docker build -f cimi-deploy/Dockerfile -t cimicode:latest .
```

## 文件命名规则

npm pack 生成的 `.tgz` 命名遵循 npm 规范：
- `hono-4.7.0.tgz`
- `@ai-sdk+anthropic-1.2.0.tgz`（scoped 包用 `+` 代替 `/`）
