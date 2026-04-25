# 预设模型配置功能

## 概述
这个功能允许用户从远程 JSON 配置文件中预设的模型列表中选择配置，系统会自动填充相关字段，用户只需要填写 API Key。

## 当前配置源
- **URL**: `https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-models.json`
- **格式**: 模型数组，每个模型包含名称、URL和限制信息

## 文件说明

### 1. `use-preset-models.ts`
- 从远程 URL 加载预设模型配置
- 提供错误处理和重试机制
- 导出类型定义和 hooks

### 2. `dialog-select-preset-model.tsx`
- 预设模型选择对话框组件
- 显示可用的预设模型列表
- 支持搜索和筛选

### 3. 修改的 `dialog-custom-provider.tsx`
- 添加了"从预设选择"按钮
- 实现了预设选择后的自动填充逻辑
- API Key 字段仍需用户手动填写

## 使用方法

1. **用户操作流程**:
   - 打开"添加自定义提供商"对话框
   - 点击"从预设选择"按钮
   - 从列表中选择一个预设模型
   - 系统自动填充配置信息：
     - ✅ Provider ID (自动生成)
     - ✅ Name (模型名称)
     - ✅ Base URL (API地址)
     - ✅ Models (选择的具体模型)
     - ❌ **API Key (需要用户手动填写)**
   - 提交保存

## 配置文件结构

### 当前实际格式 (来自 `cimicode-models.json`)
```json
[
  {
    "name": "GLM-4.7-flash",
    "url": "http://agi-gateway.cxmt.com/v1",
    "limit": {
      "context": 200000,
      "output": 8192
    }
  }
]
```

### 字段说明
- `name`: 模型名称（将用作提供商ID和模型ID）
- `url`: API的基础URL
- `limit`: 限制信息
  - `context`: 上下文窗口大小
  - `output`: 最大输出token数

## 工作原理

1. **配置加载**: 使用浏览器的 `fetch` API 从远程URL加载配置
2. **反爬虫处理**: 服务器可能验证User-Agent，浏览器访问正常
3. **自动填充**: 选择模型后自动生成provider ID并填充相关字段
4. **用户输入**: API Key必须由用户手动输入以确保安全性

## 扩展功能

- 支持多个配置源
- 本地缓存机制
- 错误重试机制
- 优雅降级处理

## 注意事项

1. **URL访问**: 确保JSON文件可从客户端访问
2. **CORS配置**: 服务器需要正确配置CORS策略
3. **安全性**: API Key不会被预设，始终需要用户手动输入
4. **网络依赖**: 需要网络连接才能加载远程配置

## 示例文件

参考 `preset-models.example.json` 文件查看完整的配置格式示例。
