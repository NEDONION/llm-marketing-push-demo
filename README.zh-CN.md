# LLM 驱动的营销内容生成器

[English](./README.md) | 中文文档

> **生产级** LLM 驱动的推送通知和邮件内容生成系统，具备**三层验证**、**跨渠道一致性**和**行为驱动推荐引擎**。

## 🎯 核心特性

### 1. **双渠道内容生成**
- **推送通知**: 超精简、高点击率文案（≤90字符）
- **营销邮件**: 结构化内容（主题/预览/正文/要点/CTA）

### 2. **三层验证系统**
```typescript
verification: {
  factual: {        // 商品目录事实性验证
    priceCheck, availabilityCheck, brandCheck
  },
  compliance: {     // 法规与政策合规性
    urlPolicy, priceDisplayPolicy, lengthConstraints
  },
  quality: {        // 内容质量指标
    clarity, tone, engagement, grammar
  }
}
```

### 3. **跨渠道一致性协议**
- **主推商品策略**: 推荐列表优先 PRIMARY 商品（首位）
- **推送**: 100% 聚焦主推商品
- **邮件**: 主题/开头必须明确引用主推商品 + 可选 1-3 个次要商品
- **行为信号**: `recent_view`、`recent_add_to_cart`、`recent_purchase`、`favorite_brands`、`tags` 影响语气，不影响商品选择

### 4. **智能推荐引擎**
```typescript
// 用户行为聚合分析
getUserBehaviorPattern(userId) → {
  primaryEvent: purchase > add_to_cart > view,  // 优先级级联
  categoryInterest: Map<category, viewCount>,   // 聚合分析
  brandInterest: Map<brand, viewCount>,
  viewedItemIds: Set<itemId>                    // 去重集合
}

// 智能去重策略
- 浏览行为: 允许推荐同类别已浏览商品（比较意图）
- 购买/加购行为: 过滤所有已浏览商品（发现意图）
```

### 5. **归因与元数据追踪**
```typescript
metadata: {
  referenced_item_ids: string[],
  reference_reasons: {
    "item_001": "基于用户的 Sony 购买历史推荐"
  },
  reference_strength: {
    items: { "item_001": "strong" },
    behaviors: { "recent_purchase": "strong" }
  },
  inferred_intent: "为相机购买配件"
}
```

### 6. **API 限流**
- 生产环境: 10 次请求/天，午夜自动重置
- 开发环境: 无限制

## 🏗️ 架构设计

### 服务层
```
server/src/services/
├── catalog/              # 商品目录 & 用户事件
│   ├── catalog.service.ts
│   └── recommendation/   # 行为驱动推荐
│       └── recommendation-strategy.service.ts
├── llm/                  # OpenAI 集成 & 提示词构建
│   └── llm.service.ts
├── generator/            # 内容生成编排
│   ├── push-generator.service.ts
│   └── email-generator.service.ts
├── verification/         # 三层验证
│   └── verification.service.ts
├── attribution/          # 元数据 & 归因追踪
│   └── attribution.service.ts
└── rate-limiter/         # API 限流
    └── rate-limiter.service.ts
```

### 数据流
```
用户行为
  ↓
目录服务 (getUserSignals + getRecommendedItems)
  ↓
推荐引擎 (行为聚合 + 评分)
  ↓
LLM 服务 (提示词构建 + 生成)
  ↓
验证服务 (事实性 + 合规性 + 质量)
  ↓
归因服务 (元数据增强)
  ↓
最终内容响应
```

## 🚀 快速开始

### 环境要求
- Node.js ≥ 20
- OpenAI API Key

### 安装依赖
```bash
npm install
```

### 环境配置
```bash
# .env
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选
```

### 开发模式
```bash
# 前端 + 后端（推荐）
npm run dev:all

# 仅前端
npm run dev

# 仅后端
npm run dev:server

# 生产模式（启用限流）
npm run dev:all:prod
```

### 生产构建
```bash
npm run build:all
npm run start
```

## 📡 API 接口

### 生成推送通知
```http
POST /api/push/generate
Content-Type: application/json

{
  "userId": "user_007"
}
```

**响应示例:**
```json
{
  "type": "PUSH",
  "mainText": "Sony WH-1000XM5 - 行业领先的降噪技术等你体验",
  "subText": "你的心仪之选正在等待 🎁",
  "cta": "立即选购",
  "imageUrl": "https://...",
  "verification": {
    "verdict": "ALLOW",
    "scores": {
      "fact": 1.0,
      "compliance": 1.0,
      "quality": 0.95
    }
  },
  "meta": {
    "model": "openai/gpt-4o-mini",
    "token": 1250,
    "referenced_item_ids": ["v1|itm|headphone_sony_xm5"],
    "reference_reasons": {
      "v1|itm|headphone_sony_xm5": "用户浏览耳机类别 3 次"
    },
    "inferred_intent": "购买已浏览商品"
  }
}
```

### 生成营销邮件
```http
POST /api/email/generate
Content-Type: application/json

{
  "userId": "user_002"
}
```

**响应示例:**
```json
{
  "type": "EMAIL",
  "subject": "完善你的 iPhone 15 Pro Max 体验",
  "preview": "你的新设备必备配件",
  "body": "最大化发挥 iPhone 15 Pro Max 的性能...",
  "bullets": [
    "MagSafe 兼容充电器",
    "高级防护保护壳"
  ],
  "cta": "选购配件",
  "verification": { /* ... */ },
  "meta": { /* ... */ }
}
```

### 获取用户画像
```http
GET /api/user/:userId/profile
```

### 限流状态
```http
GET /api/rate-limit/status
```

## 📊 核心算法

### 1. 行为聚合评分
```typescript
// 浏览意图下的设备评分
score = 0
  + (类别匹配 ? 100 : 0)    // 最高优先级
  + (品牌匹配 ? 30 : 0)     // 次优先级
  + (价格相似 ? 10 : 0)     // 第三优先级
```

### 2. 推荐策略
```typescript
if (事件 === '购买' && 商品类型 === '设备') {
  return 推荐配件(设备)  // 仅配件
}
else if (事件 === '浏览') {
  return [
    ...同类别设备(60%),      // 类别优先评分
    ...配件(40%)
  ]
}
```

### 3. 主推商品选择
```typescript
// 优先级: 购买 > 加购 > 浏览
// 仅浏览行为: 从浏览次数最多的类别中选择
const topCategory = max(categoryInterest.values())
const primaryItem = recentEventsInCategory(topCategory)[0]
```

## 🔒 验证机制

**事实性**: 价格/库存/品牌校验
**合规性**: URL 策略、长度限制、促销规范
**质量**: 语气、语法、参与度评分

## 🛠️ 技术栈

**后端**: Node.js, Express, TypeScript, OpenAI GPT-4o-mini
**前端**: React 19, Vite, TailwindCSS
**开发**: tsx watch + Vite HMR, 严格类型, concurrently

## 📂 项目结构

```
llm-push-demo/
├── server/
│   └── src/
│       ├── controllers/      # 路由处理器
│       ├── services/         # 业务逻辑（6 个服务）
│       ├── prompts/          # LLM 系统提示词（push/email）
│       ├── data/             # 模拟商品目录 & 用户事件
│       ├── types/            # TypeScript 接口
│       └── utils/            # 计时追踪器、工具函数
├── src/                      # 前端 React 应用
├── public/                   # 静态资源
└── package.json             # Monorepo 依赖
```