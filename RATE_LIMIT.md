# 生产环境限流说明

## 功能概述

为了控制 API 成本，系统实现了生产环境限流功能：
- **生产环境**：每天最多 10 次 API 调用
- **开发环境**：无限制

## 环境配置

### 开发环境（默认）
不设置 `NODE_ENV` 或设置为 `development`，无调用限制。

```bash
# server/.env
# 不设置 NODE_ENV 或者：
NODE_ENV=development
```

### 生产环境
在 `server/.env` 中设置：

```bash
# server/.env
NODE_ENV=production
```

## API 端点

### 1. 生成内容（受限）
```bash
POST /api/generate
```

**开发环境响应**：
```json
{
  "success": true,
  "channel": "PUSH",
  "message": "...",
  "verification": {...}
}
```

**生产环境超限响应（HTTP 429）**：
```json
{
  "success": false,
  "error": "Daily API limit exceeded. Please try again tomorrow.",
  "rateLimitInfo": {
    "remaining": 0,
    "resetAt": "2025-11-15T00:00:00.000Z"
  }
}
```

### 2. 查询限流状态
```bash
GET /api/rate-limit/status
```

**响应示例**：
```json
{
  "isProduction": true,      // 是否为生产环境
  "callCount": 3,             // 今日已调用次数
  "maxCalls": 10,             // 每日最大调用次数
  "remaining": 7,             // 今日剩余次数
  "resetAt": "2025-11-15T00:00:00.000Z",  // 下次重置时间
  "lastResetDate": "2025-11-14"           // 上次重置日期
}
```

## 测试限流功能

### 1. 查看当前状态
```bash
curl http://localhost:3001/api/rate-limit/status | jq
```

### 2. 模拟生产环境
在 `server/.env` 中添加：
```
NODE_ENV=production
```

重启服务器：
```bash
npm run dev:server
```

### 3. 测试调用
```bash
# 调用生成 API
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "channel": "PUSH",
    "locale": "en-US"
  }'
```

多次调用后（超过10次），会返回 429 错误。

## 日志输出

启动服务器时会显示：
```
🔒 Rate Limiter 已启动 (生产环境)
   限制: 10 次/天
```

每次调用后：
```
📊 API 调用计数: 3/10
```

每日重置时：
```
🔄 每日限制已重置
```

## 注意事项

1. **计数器存储在内存中**，服务器重启会重置计数
2. **每天凌晨 0 点自动重置**计数器
3. **开发环境不受限制**，方便开发和测试
4. 只有**成功的 API 调用**才会计入次数，失败的调用不计数

## 生产部署建议

如果需要持久化计数器（防止服务器重启丢失），可以：
1. 使用 Redis 存储计数
2. 使用数据库存储每日调用记录
3. 使用外部限流服务（如 Redis + rate-limiter-flexible）

当前实现是轻量级的内存存储方案，适合单实例部署。
