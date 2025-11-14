# 快速启动指南

## 1. 启动后端服务器

```bash
npm run dev:server
```

等待看到：
```
🚀 Server running on http://localhost:3001
```

## 2. 启动前端（新终端）

```bash
npm run dev
```

访问 http://localhost:5173

## 3. 测试 Demo

1. 选择用户（user_001 或 user_002）
2. 点击 "生成内容" 按钮
3. 查看生成的 Push/Email 内容
4. 查看验证结果（事实性、合规性、质量评分）

## 4. API 测试

### 测试用户画像

```bash
curl http://localhost:3001/api/user/user_001/profile
```

### 测试生成 Push 消息

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "channel": "PUSH",
    "locale": "zh-CN"
  }'
```

### 测试生成 Email 消息

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "channel": "EMAIL",
    "locale": "zh-CN"
  }'
```

## 验证流程说明

生成的每条消息都会经过三层验证：

### ✅ 通过（ALLOW）
- 所有分数 >= 0.8
- 无严重违规
- 可以直接发送

### ⚠️ 需修订（REVISE）
- 部分分数 0.6-0.8
- 可以自动修复
- 查看 "自动修复建议"

### ❌ 拒绝（REJECT）
- 存在硬违规（禁词、非法 URL）
- 事实性分数 < 0.6
- 质量分数 < 0.5

## 常见问题

### Q: 服务器启动失败？
A: 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否配置正确

### Q: LLM 生成失败？
A: 检查网络连接和 API 配额

### Q: 想修改商品数据？
A: 编辑 `server/src/data/mock-items.ts`

### Q: 想调整验证规则？
A: 编辑 `server/src/services/verification.service.ts`
