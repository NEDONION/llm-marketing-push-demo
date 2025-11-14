# 验证机制详解

## 概述

验证服务是整个系统的核心，确保 LLM 生成的内容：
1. **事实准确**：不包含虚假信息
2. **合规安全**：符合平台规范
3. **质量优秀**：可读性和用户体验良好

## 验证流程

```
LLM 生成候选
     ↓
事实性验证 (FactCheck)
     ↓
合规性验证 (Compliance)
     ↓
质量验证 (Quality)
     ↓
综合裁决 (ALLOW/REVISE/REJECT)
     ↓
自动修复建议
```

## 1. 事实性验证（FactCheck）

### 验证维度

#### 1.1 用户事件验证

检查 LLM 是否提到了用户实际没有发生的行为：

```typescript
// 示例：用户没有浏览记录，但 LLM 说"上次浏览的..."
if (claims.referenced_events.includes('recent_view') && !hasRecentView) {
  violation: "FACT_USER_EVENT_MISS"
  penalty: -0.3
}
```

**数据源**：
- `catalogService.getUserEvents(userId, 7)`
- 查询近 7/14/30 天的用户行为

#### 1.2 商品有效性验证

```typescript
// 验证商品是否存在且有效
for (const itemId of claims.referenced_item_ids) {
  const item = await catalogService.getItem(itemId);
  if (!item || !item.isActive) {
    violation: "FACT_ITEM_INVALID"
    penalty: -0.5  // 严重错误
  }
}
```

**检查项**：
- 商品是否存在
- 是否已下架
- 是否可购买

#### 1.3 品牌匹配验证

```typescript
// 例如：推荐 Canon 镜头，但提到 Sony 品牌
if (claimedBrand not in actualBrands) {
  violation: "FACT_BRAND_MISMATCH"
  penalty: -0.15
}
```

#### 1.4 节日窗口验证

```typescript
// 例如：现在是 11 月 14 日，提到"双十一"
if (!isInHolidayWindow(holidayName, currentDate)) {
  violation: "FACT_HOLIDAY_INVALID"
  penalty: -0.2
}
```

**窗口规则**：
- 节日前 3 天到节日后 1 天
- 例如：双十一（11.11）有效窗口是 11.08 - 11.12

### 评分逻辑

```typescript
initialScore = 1.0
finalScore = max(0, initialScore - Σpenalties)

// 裁决阈值
if (finalScore < 0.6) → REJECT
if (finalScore < 0.8) → REVISE
else → 继续下一步验证
```

## 2. 合规性验证（Compliance）

### 硬违规（score = 0，直接拒绝）

#### 2.1 URL 检查（Push 渠道）

```typescript
// Push 通知不允许包含任何 URL
if (channel === 'PUSH' && text.match(/https?:\/\//)) {
  violation: "COMPLIANCE_URL_FORBIDDEN"
  score: 0  // 硬违规
}
```

#### 2.2 禁词检查

```typescript
forbiddenWords = ['垃圾', '假货', '欺诈', '骗人']
if (text contains any forbiddenWords) {
  violation: "COMPLIANCE_FORBIDDEN_WORDS"
  score: 0  // 硬违规
}
```

### 软违规（扣分）

#### 2.3 绝对化用语

```typescript
absoluteWords = ['最好', '最低', '史上', '第一', '绝对', '完美', '极致']
penalty = 0.3 * count(absoluteWords in text)

// 例如："史上最低价"
violations: ["史上", "最低"]
penalty: 0.6
```

#### 2.4 过度标点

```typescript
if (exclamationCount > 2) {
  violation: "COMPLIANCE_EXCESSIVE_PUNCTUATION"
  penalty: -0.1
}

// 例如："快来抢购！！！！" → 4 个感叹号
```

#### 2.5 价格显示（可选）

```typescript
if (constraints.noPrice && text.match(/\$[\d,.]+|¥[\d,.]+/)) {
  violation: "COMPLIANCE_PRICE_FORBIDDEN"
  penalty: -0.2
}
```

### 评分逻辑

```typescript
initialScore = 1.0
finalScore = max(0, initialScore - Σpenalties)

// 硬违规直接拒绝
if (hasHardViolation) → REJECT
if (finalScore < 0.8) → REVISE
```

## 3. 质量验证（Quality）

### 3.1 长度检查

```typescript
constraints = {
  PUSH: 90 characters,
  EMAIL: 200 characters
}

if (textLength > maxLen) {
  violation: "QUALITY_LEN_OVER"
  penalty: -0.3
}

if (textLength < 10) {
  violation: "QUALITY_LEN_TOO_SHORT"
  penalty: -0.2
}
```

**注意**：
- 中文按字符数
- 英文按单词数 * 平均长度（≈5）

### 3.2 标点符号合理性

```typescript
punctuationRatio = count(punctuation) / textLength

if (punctuationRatio > 0.2) {
  violation: "QUALITY_PUNCT_EXCESS"
  penalty: -0.15
}

// 例如："快来！！！抢购！！！" → 50% 是标点
```

### 3.3 Emoji 检查

```typescript
emojiCount = count(emoji in text)

if (emojiCount > 3) {
  violation: "QUALITY_EMOJI_EXCESS"
  penalty: -0.1
}
```

### 3.4 语言一致性

```typescript
if (locale === 'zh-CN') {
  if (hasEnglish && !hasChinese) {
    violation: "QUALITY_LANG_MISMATCH"
    penalty: -0.2
  }
}
```

### 3.5 可读性评分

```typescript
readability = calculateReadability(text)

factors:
  - 句子长度（avgSentenceLen）
  - 全大写比例（upperCaseRatio）
  - 复杂词汇比例

if (readability < 0.5) {
  violation: "QUALITY_LOW_READABILITY"
  penalty: -0.15
}
```

### 评分逻辑

```typescript
finalScore = weighted_average([
  readability * 0.25,
  styleScore * 0.25,
  novelty * 0.25,
  basicQuality * 0.25
])

if (finalScore < 0.5) → REJECT
if (finalScore < 0.7) → REVISE
```

## 4. 综合裁决

### 裁决优先级

```
Compliance > Fact > Quality
```

### 裁决规则

```typescript
function makeVerdict(factScore, complianceScore, qualityScore) {
  // 1. 合规性优先
  if (complianceScore === 0) return 'REJECT';
  if (complianceScore < 0.8) return 'REVISE';

  // 2. 事实性
  if (factScore < 0.6) return 'REJECT';
  if (factScore < 0.8) return 'REVISE';

  // 3. 质量
  if (qualityScore < 0.5) return 'REJECT';
  if (qualityScore < 0.7) return 'REVISE';

  return 'ALLOW';
}
```

### 裁决示例

| Fact | Compliance | Quality | 裁决 | 原因 |
|------|-----------|---------|------|------|
| 0.9 | 0.0 | 0.8 | REJECT | 合规性硬违规 |
| 0.5 | 1.0 | 0.9 | REJECT | 事实性过低 |
| 0.75 | 0.95 | 0.85 | REVISE | 事实性需修订 |
| 0.85 | 1.0 | 0.65 | REVISE | 质量需修订 |
| 0.9 | 1.0 | 0.85 | ALLOW | 全部通过 |

## 5. 自动修复

### 5.1 长度截断

```typescript
if (textLength > maxLen) {
  fix.truncateTo = maxLen - 3;  // 留 3 字符给 "..."

  // 中文：直接截断
  suggestedText = text.substring(0, maxLen - 3) + '...';

  // 英文：按单词截断
  words = text.split(' ');
  suggestedText = words.slice(0, n).join(' ') + '...';
}
```

### 5.2 URL 移除

```typescript
if (hasUrlViolation) {
  fix.removeUrls = true;
  suggestedText = text.replace(/https?:\/\/[^\s]+/g, '');
}
```

### 5.3 删除未证实的声明

```typescript
if (hasFactViolation('recent_view')) {
  fix.removeClaims = ['recent_view'];

  // 建议：重新生成，避免提及"上次浏览"
}
```

### 修复优先级

1. 移除 URL（硬违规）
2. 删除未证实声明
3. 截断长度
4. 建议重新生成（如果修复后仍不合格）

## 6. 审计与追踪

每次验证都会记录审计信息：

```typescript
audit: {
  policyVer: "v1.0.0",           // 策略版本
  catalogSnapshot: "2025-11-14",  // 商品目录快照
  timestamp: "2025-11-14T20:30:00Z"
}
```

用于：
- 问题回溯
- A/B 实验对比
- 策略演进分析

## 7. 实际应用场景

### 场景 1：用户行为不匹配

**生成内容**：
> "你上次浏览的 Sony 相机现在有优惠！"

**问题**：用户近 7 天没有浏览记录

**验证结果**：
- Fact Score: 0.7 (-0.3 for FACT_USER_EVENT_MISS)
- Verdict: REVISE

**修复建议**：
> "为你挑选了热门的 Sony 相机，限时优惠！"

### 场景 2：绝对化用语

**生成内容**：
> "史上最低价！绝对不能错过！"

**问题**：包含"史上"和"绝对"

**验证结果**：
- Compliance Score: 0.4 (-0.6 for ABSOLUTE_WORDS)
- Verdict: REVISE

**修复建议**：
> "限时特价，不容错过！"

### 场景 3：Push 包含 URL

**生成内容**：
> "查看详情：https://ebay.com/item/123"

**问题**：Push 渠道不允许 URL

**验证结果**：
- Compliance Score: 0 (硬违规)
- Verdict: REJECT

**修复建议**：
> "查看详情，点击通知了解更多"

## 8. 性能优化建议

### 8.1 缓存策略

```typescript
// 用户事件缓存
Redis: UEVT:${userId}:7d:view → count

// 商品信息缓存
Redis: CAT:${itemId} → ItemInfo (TTL: 10min)

// 节日窗口缓存
LocalCache: holidayWindow → Map<string, boolean>
```

### 8.2 并发优化

```typescript
// 并行验证
const [factScore, complianceScore, qualityScore] = await Promise.all([
  checkFacts(candidate),
  checkCompliance(candidate),
  checkQuality(candidate)
]);
```

### 8.3 快速失败

```typescript
// 先检查合规性（最快）
if (complianceScore === 0) {
  return REJECT;  // 不用继续检查
}

// 再检查事实性
if (factScore < 0.6) {
  return REJECT;
}

// 最后检查质量
...
```

## 9. 扩展方向

1. **ML 分类器**：
   - 毒性检测（Toxicity）
   - 情感强度（Sentiment Intensity）
   - 内容分类（Category）

2. **向量相似度**：
   - 使用 Embedding 检测重复内容
   - 多样性评分

3. **规则引擎**：
   - OPA/Rego 实现可配置的策略
   - 版本化管理

4. **实时监控**：
   - 拒绝率监控
   - 各维度分数分布
   - 修复成功率
