# LLM 动态 Push/Email 优化 Demo

基于 LLM 的个性化营销内容生成与验证系统 Demo

## 📋 项目概述

这是一个完整的 TypeScript 实现，展示了如何使用 LLM（通过 OpenAI API）生成个性化的 Push 通知和 Email 营销内容，并通过三层验证确保内容质量。

### 核心功能

1. **LLM 内容生成**
   - 基于用户画像和行为数据
   - 支持 Push 和 Email 两个渠道
   - 自动构建个性化 Prompt

2. **三层验证系统**
   - **事实性验证**（Fact Check）：验证用户行为、商品信息、节日等
   - **合规性验证**（Compliance）：检查禁词、绝对化用语、URL 等
   - **质量验证**（Quality）：长度、标点、语言一致性等

3. **自动修复**
   - 长度截断
   - URL 移除
   - 未证实声明删除

## 🏗️ 架构设计

```
├── server/                    # 后端服务
│   └── src/
│       ├── types/            # 类型定义
│       ├── data/             # 模拟数据（eBay 商品）
│       ├── services/         # 业务逻辑
│       │   ├── catalog.service.ts       # 商品目录服务
│       │   ├── llm.service.ts           # LLM 服务
│       │   └── verification.service.ts  # 验证服务
│       ├── controllers/      # 控制器
│       ├── routes/           # API 路由
│       └── index.ts          # 入口文件
├── src/                      # 前端 React 应用
│   ├── App.tsx
│   └── App.css
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

确保 `.env` 文件中配置了 OpenAI API：

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

### 3. 启动服务

**方式一：同时启动前后端**

```bash
npm run dev:all
```

**方式二：分别启动**

```bash
# 终端 1：启动后端
npm run dev:server

# 终端 2：启动前端
npm run dev
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001

## 📡 API 接口

### 1. 生成营销消息

**POST** `/api/generate`

请求：
```json
{
  "userId": "user_001",
  "channel": "PUSH",
  "locale": "zh-CN",
  "itemIds": ["v1|itm|001"]  // 可选
}
```

响应：
```json
{
  "success": true,
  "channel": "PUSH",
  "message": "为你挑了上次浏览的 Sony 相机配件，周末下单享包邮～",
  "verification": {
    "verdict": "ALLOW",
    "scores": {
      "fact": 0.95,
      "compliance": 1.0,
      "quality": 0.85
    },
    "violations": [],
    "audit": { ... }
  }
}
```

### 2. 获取用户画像

**GET** `/api/user/:userId/profile`

响应：
```json
{
  "userId": "user_001",
  "signals": {
    "recent_view": 4,
    "recent_add_to_cart": 1,
    "recent_purchase": 0,
    "tags": ["Cameras & Photo", "Camera Lenses"],
    "favorite_brands": ["Sony", "Canon"]
  },
  "recentEvents": [...],
  "recommendedItems": [...]
}
```

### 3. 验证内容

**POST** `/api/verify`

用于单独测试验证服务。

## 🎯 验证规则说明

### 事实性验证（Fact Check）

| 检查项 | 说明 | 扣分 |
|--------|------|------|
| 用户行为 | 验证是否真实发生（浏览、加购、购买） | -0.3 |
| 商品有效性 | 验证商品是否存在、是否有效 | -0.5 |
| 品牌匹配 | 验证提到的品牌与商品是否一致 | -0.15 |
| 节日窗口 | 验证节日是否在有效时间范围 | -0.2 |

### 合规性验证（Compliance）

| 检查项 | 说明 | 严重性 |
|--------|------|--------|
| URL 检查 | Push 渠道不允许 URL | 硬违规 (score=0) |
| 绝对化用语 | "最好"、"史上最低"等 | ERROR (-0.3/词) |
| 禁词 | 垃圾、假货等 | 硬违规 (score=0) |
| 过度标点 | 感叹号或问号 > 2 个 | WARNING (-0.1) |

### 质量验证（Quality）

| 检查项 | 说明 | 扣分 |
|--------|------|------|
| 长度限制 | Push: 90字符, Email: 200字符 | -0.3 |
| 内容过短 | < 10 字符 | -0.2 |
| 标点占比 | > 20% | -0.15 |
| Emoji 过多 | > 3 个 | -0.1 |
| 语言不匹配 | locale 与实际语言不符 | -0.2 |

### 裁决逻辑

优先级：**Compliance > Fact > Quality**

- **REJECT**：
  - compliance_score = 0（硬违规）
  - fact_score < 0.6
  - quality_score < 0.5

- **REVISE**（可自动修复）：
  - 0.6 ≤ fact_score < 0.8
  - 0.7 ≤ quality_score < 0.8
  - compliance_score < 0.8

- **ALLOW**：
  - 所有分数都达标

## 📊 测试场景

### 用户 001（相机爱好者）

- **行为**：浏览了 Sony 相机、Canon 镜头，并加购了相机
- **兴趣**：相机、摄影相关
- **预期**：生成与相机相关的个性化内容

### 用户 002（手机玩家）

- **行为**：浏览并购买了 iPhone
- **兴趣**：手机、电子产品
- **预期**：生成与手机相关的个性化内容

## 🔧 eBay 商品数据获取

### 当前方案：模拟数据

Demo 使用了预定义的商品数据（`server/src/data/mock-items.ts`），包括：
- Sony、Canon、Nikon 相机
- Apple、Samsung 手机
- DJI 无人机
- 各类电子产品

### 真实 API 集成方案

如果要接入真实的 eBay 数据，可以使用：

#### 1. eBay Finding API

```typescript
// 示例代码
async function searchEbayItems(query: string) {
  const response = await fetch(
    `https://svcs.ebay.com/services/search/FindingService/v1` +
    `?OPERATION-NAME=findItemsByKeywords` +
    `&SERVICE-VERSION=1.0.0` +
    `&SECURITY-APPNAME=YourAppID` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&keywords=${encodeURIComponent(query)}`
  );
  return response.json();
}
```

**申请步骤：**
1. 注册 eBay 开发者账号：https://developer.ebay.com/
2. 创建应用获取 App ID
3. 替换 `catalog.service.ts` 中的 `getItem()` 方法

#### 2. eBay Browse API（推荐）

更强大的 REST API，支持：
- 商品搜索
- 商品详情
- 价格、库存信息
- 图片和描述

```typescript
// 需要 OAuth 认证
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
};

fetch('https://api.ebay.com/buy/browse/v1/item_summary/search?q=camera', {
  headers
});
```

**文档：**
- Finding API: https://developer.ebay.com/DevZone/finding/Concepts/FindingAPIGuide.html
- Browse API: https://developer.ebay.com/api-docs/buy/browse/overview.html

## 📝 扩展建议

1. **重排服务（Re-ranking）**
   - 使用轻量级模型（ONNX）对候选进行 CTR 预估
   - 多目标优化（点击率、转化率、多样性）

2. **A/B 实验**
   - 集成实验框架（如 Unleash）
   - 分桶策略和指标追踪

3. **缓存优化**
   - Redis 缓存用户事件和商品信息
   - 降低 API 调用延迟

4. **监控告警**
   - Prometheus + Grafana 监控
   - OpenTelemetry 链路追踪

5. **持久化**
   - MongoDB 存储用户事件
   - ClickHouse 做事件聚合分析

## 📄 License

MIT

## 👥 作者

Demo 实现基于 eBay LLM Marketing 技术文档
