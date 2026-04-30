# CIMIcode Skill 管理 API

Skill 管理模块提供对 OpenCode skills 的安装、启用、禁用和状态查询功能。

## 概述

| 功能 | 说明 |
|------|------|
| 安装 Skill | 从指定 URL 下载并安装 skill 压缩包（.zip 格式） |
| 查询 Skill 状态 | 获取 skill 的存在性和启用状态 |
| 启用 Skill | 在全局配置中启用指定的 skill |
| 禁用 Skill | 在全局配置中禁用指定的 skill |

## API 接口

### 1. 获取 Skill 状态

查询指定 skill 的状态信息。

**端点**
```
GET /skill-manager/status?skillName=:name
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillName | string | 是 | Skill 名称 |

**响应示例**

```json
{
  "exists": true,
  "enabled": true
}
```

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| exists | boolean | 该 skill 是否存在 |
| enabled | boolean | 该 skill 是否处于启用状态 |

---

### 2. 安装 Skill

从指定的 URL 下载 skill 压缩包并安装到系统。

**端点**
```
POST /skill-manager/install
```

**请求头**

| 头名称 | 说明 | 必填 |
|--------|------|------|
| X-Access-Token | 访问令牌（传递给下载服务器） | 否 |

**请求类型**: `application/json`

**请求体**

```json
{
  "skillName": "my-skill",
  "downloadUrl": "https://example.com/skills/my-skill.zip"
}
```

**请求字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillName | string | 是 | 要安装的 skill 名称 |
| downloadUrl | string | 是 | skill 压缩包的下载 URL（.zip 格式） |

**成功响应**

```json
{
  "success": true,
  "message": "Skill 'my-skill' installed successfully",
  "skillName": "my-skill"
}
```

**安装位置**

`~/.config/opencode/skills/{skillName}/`

---

### 3. 启用 Skill

**端点**
```
PUT /skill-manager/enable
```

**请求类型**: `application/json`

**请求体**

```json
{
  "skillName": "my-skill"
}
```

**请求字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillName | string | 是 | Skill 名称 |

**成功响应**

```json
{
  "success": true,
  "message": "Skill 'my-skill' enabled",
  "skillName": "my-skill",
  "enabled": true
}
```

---

### 4. 禁用 Skill

**端点**
```
PUT /skill-manager/disable
```

**请求类型**: `application/json`

**请求体**

```json
{
  "skillName": "my-skill"
}
```

**请求字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skillName | string | 是 | Skill 名称 |

**成功响应**

```json
{
  "success": true,
  "message": "Skill 'my-skill' disabled",
  "skillName": "my-skill",
  "enabled": false
}
```

---

## 使用示例

```javascript
// 安装 skill
await fetch('/skill-manager/install', {
  method: 'POST',
  headers: {
    'X-Access-Token': 'your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    skillName: 'my-skill',
    downloadUrl: 'https://example.com/my-skill.zip'
  })
})

// 查询状态
await fetch('/skill-manager/status?skillName=my-skill').then(r => r.json())

// 启用 skill
await fetch('/skill-manager/enable', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ skillName: 'my-skill' })
})

// 禁用 skill
await fetch('/skill-manager/disable', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ skillName: 'my-skill' })
})
```

---

## 错误处理

所有接口在失败时返回包含 `success: false` 的 JSON 响应：

```json
{
  "success": false,
  "message": "错误描述",
  "skillName": "my-skill"
}
```

---

## 版本信息

- API 版本: 1.0.0
- 文档日期: 2026-04-15
