# MetaData UI 展示效果

## 🎨 新增的UI部分

### 1. 归因分析 (Attribution Analysis)

现在在生成的内容卡片中，会显示完整的归因分析信息：

#### 📍 位置
在 **Call Chain Timeline** 之后，**Basic References** 之前

#### 🎯 展示内容

##### 1️⃣ **用户意图 (User Intent)**
- 背景：靛蓝色 (indigo)
- 图标：💡
- 内容：显示推断出的用户意图
- 示例：`"购买 相机 相关商品"`

##### 2️⃣ **引用商品 (Referenced Items)**
- 背景：灰色 (slate)
- 图标：🏷️
- 每个商品显示：
  - 商品ID（等宽字体）
  - **强度标签**：
    - 💪 Strong (绿色)
    - 👌 Medium (黄色)
    - 👋 Weak (灰色)
  - **引用原因**：具体说明为什么引用该商品

示例：
```
item_001                                [💪 Strong]
用户多次浏览过 Canon EOS R5（3次）
```

##### 3️⃣ **引用品牌 (Referenced Brands)**
- 背景：紫色 (purple)
- 图标：🏢
- 每个品牌显示：
  - 品牌名称
  - **引用原因**

示例：
```
Canon
Canon 是用户偏好的品牌
```

##### 4️⃣ **用户行为 (User Behaviors)**
- 背景：蓝色 (blue)
- 图标：📊
- 每个行为显示：
  - 行为类型（view, add_to_cart, purchase）
  - **强度标签**
  - **引用原因**

示例：
```
view                                    [💪 Strong]
用户频繁浏览商品（5次）
```

---

## 🎨 设计特点

### 颜色系统
- **用户意图**：靛蓝色系 (indigo-50/600/700/900)
- **商品引用**：灰色系 (slate-50/200/600/700)
- **品牌引用**：紫色系 (purple-50/200/600/700)
- **行为引用**：蓝色系 (blue-50/200/600/700)
- **强度标签**：
  - Strong: 绿色 (green-100/700)
  - Medium: 黄色 (yellow-100/700)
  - Weak: 灰色 (slate-100/600)

### 排版
- 圆角：`rounded-lg`
- 内边距：`p-3` 或 `p-2.5`
- 间距：`space-y-2` 或 `space-y-3`
- 字体大小：`text-xs` (标签) / `text-sm` (重要内容)
- 字体粗细：`font-medium` (标题) / `font-semibold` (重要数据)

---

## 📊 完整的信息层次

```
ContentCard
├── 内容区域 (Push/Email 内容)
├── 验证徽章 (Verification Badges)
├── 调用链时间 (Call Chain Timeline)
│   ├── 1. Catalog Service
│   ├── 2. LLM Generation
│   └── 3. Verification
├── 🎯 归因分析 (Attribution Analysis) ← 新增！
│   ├── 💡 User Intent
│   ├── 🏷️ Referenced Items (含原因和强度)
│   ├── 🏢 Referenced Brands (含原因)
│   └── 📊 User Behaviors (含原因和强度)
└── 📚 Basic References (Legacy View)
    ├── Referenced Items (简单列表)
    ├── Brands (简单列表)
    ├── User Behaviors (简单列表)
    ├── Holiday/Event
    └── Benefits
```

---

## 🚀 使用方式

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **访问页面**
   - 打开 http://localhost:5175/

3. **生成内容**
   - 选择用户
   - 点击 "Generate PUSH" 或 "Generate EMAIL"

4. **查看归因分析**
   - 内容生成后，向下滚动
   - 在 "Call Chain Timeline" 下方即可看到 "🎯 Attribution Analysis"
   - 展开查看详细的归因信息：
     - 用户意图
     - 为什么引用某个商品
     - 引用强度如何（strong/medium/weak）
     - 为什么引用某个品牌
     - 用户行为的重要程度

---

## 💡 示例场景

### 场景：用户多次浏览相机

**生成的归因分析可能显示：**

```
🎯 Attribution Analysis (gpt-4-turbo)

💡 User Intent
购买 相机 相关商品

🏷️ Referenced Items

  item_001                              [💪 Strong]
  用户多次浏览过 Canon EOS R5（3次）

  item_002                              [👌 Medium]
  Canon 是用户喜欢的品牌

🏢 Referenced Brands

  Canon
  Canon 是用户偏好的品牌

📊 User Behaviors

  view                                  [💪 Strong]
  用户频繁浏览商品（5次）
```

---

## ✅ 技术实现

### 组件文件
- `src/components/ContentCard.tsx` (第 181-303 行)

### 数据来源
- 后端自动填充：`server/src/services/metadata-builder.service.ts`
- 类型定义：
  - `src/lib/types.ts` (前端)
  - `server/src/types/index.ts` (后端)

### 条件渲染
```typescript
{content.meta.inferred_intent && (
  // 显示用户意图
)}

{content.meta.referenced_item_ids.length > 0 && (
  // 显示商品引用及其原因和强度
)}
```

---

## 🎁 用户价值

这个归因分析UI帮助团队：

✅ **理解推荐逻辑** - 清楚知道为什么推荐某个商品
✅ **评估数据质量** - 查看引用强度，了解信号可靠性
✅ **优化推荐策略** - 根据归因原因调整算法
✅ **Debug问题** - 快速定位推荐不准确的原因
✅ **展示透明度** - 向用户解释推荐理由

现在MetaData不仅独立且可扩展，还在UI中完整展示！🎉
