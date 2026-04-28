# Default Skills

这个目录包含了 OpenCode 的默认 skills 集合。

## 目录结构

```
packages/skills/
├── brainstorming/           # 头脑风暴辅助
├── content-strategy/       # 内容策略规划
├── copy-editing/           # 文案编辑工具
├── copywriting/            # 文案写作辅助
├── delight/                # 用户体验优化
├── doc-coauthoring/        # 文档协作
├── docx/                   # DOCX 文件处理
├── enhance-prompt/         # 提示词增强
├── executing-plans/        # 计划执行
├── extract/                # 信息提取
├── frontend-design/        # 前端设计指南
├── harden/                 # 安全加固
├── internal-comms/         # 内部沟通
├── marketing-ideas/        # 营销创意生成
├── pdf/                    # PDF 文件处理
├── pptx/                   # PowerPoint 文件处理
├── requesting-code-review/ # 代码评审请求
├── simple/                 # 简单任务模式
├── skill-creator/          # Skill 创建工具
├── skill-vetter-1.0.0/     # Skill 验证
├── supabase-postgres-best-practices/ # Supabase/PostgreSQL 最佳实践
├── theme-factory/          # 主题生成
├── using-superpowers/      # 超级能力模式
├── vercel-composition-patterns/  # Vercel 组合模式
├── vercel-react-best-practices/  # Vercel React 最佳实践
├── vercel-react-native-skills/   # Vercel React Native Skills
├── verification-before-completion/ # 完成前验证
├── web-design-guidelines/  # 网页设计指南
├── writing-plans/          # 计划编写
└── xlsx/                   # Excel 文件处理
```

## 用途

这些 skills 会在以下场景使用：

1. **Desktop 应用构建**：打包到 Tauri 应用中，作为默认 skills
2. **CLI 工具**：作为内置 skills 提供给用户
3. **开发测试**：用于开发环境中的测试

## 构建集成

### Desktop 应用

在构建 Desktop 应用时，这些 skills 会被自动复制到 `packages/desktop/src-tauri/resources/skills/`：

```bash
# 从代码仓库复制到 desktop 资源目录
node packages/desktop/scripts/copy-skills.js
```

然后 Tauri 会将这些 skills 打包到最终的应用中。

### 运行时位置

当应用运行时，skills 会被复制到：

```
~/.cimi/cimicode/cache/skills/
```

## 更新 Skills

如果需要更新默认 skills：

1. 将新的 skills 文件复制到 `packages/skills/` 目录
2. 每个 skill 必须包含 `SKILL.md` 文件
3. 运行构建脚本更新 desktop 资源：
   ```bash
   node packages/desktop/scripts/copy-skills.js
   ```

## Skill 结构

每个 skill 目录应包含：

```
skill-name/
├── SKILL.md          # 必需：技能定义文件
├── README.md         # 可选：说明文档
├── references/       # 可选：参考文档
│   └── *.md
└── scripts/          # 可选：脚本文件
    └── *.*
```

## 来源

这些 skills 最初来源于 `D:\skills-main.zip`，包含 30 个常用技能。

## 维护

- **添加新 skill**：直接添加到 `packages/skills/` 目录
- **修改 skill**：编辑对应目录下的 `SKILL.md` 文件
- **删除 skill**：删除对应目录
