# LLM-Driven Marketing Content Generator

[中文文档](./README.zh-CN.md) | English

> **Production-grade** LLM-powered push notification and email content generation system with **three-layer verification**, **cross-channel consistency**, and **behavior-driven recommendation engine**.

## Core Features

### 1. **Dual-Channel Content Generation**
- **Push Notifications**: Ultra-concise, high-CTR copy (≤90 chars)
- **Marketing Emails**: Structured content with subject/preview/body/bullets/CTA

### 2. **Three-Layer Verification System**
```typescript
verification: {
  factual: {        // Claims validation against catalog
    priceCheck, availabilityCheck, brandCheck
  },
  compliance: {     // Regulatory & policy adherence
    urlPolicy, priceDisplayPolicy, lengthConstraints
  },
  quality: {        // Content quality metrics
    clarity, tone, engagement, grammar
  }
}
```

### 3. **Cross-Channel Consistency Protocol**
- **Primary Item Strategy**: Recommended items list prioritizes PRIMARY item (first position)
- **Push**: 100% focus on primary item only
- **Email**: Explicit primary item reference in subject/opening + optional 1-3 secondary items
- **Behavioral Signals**: `recent_view`, `recent_add_to_cart`, `recent_purchase`, `favorite_brands`, `tags` influence tone, not item selection

### 4. **Intelligent Recommendation Engine**
```typescript
// User Behavior Aggregation
getUserBehaviorPattern(userId) → {
  primaryEvent: purchase > add_to_cart > view,  // Priority cascade
  categoryInterest: Map<category, viewCount>,   // Aggregate analysis
  brandInterest: Map<brand, viewCount>,
  viewedItemIds: Set<itemId>                    // Deduplication
}

// Smart Deduplication Strategy
- Browsing behavior: Allow same-category viewed items (comparison intent)
- Purchase/cart behavior: Filter all viewed items (discovery intent)
```

### 5. **Attribution & Metadata Tracking**
```typescript
metadata: {
  referenced_item_ids: string[],
  reference_reasons: {
    "item_001": "Recommended based on user's Sony purchase history"
  },
  reference_strength: {
    items: { "item_001": "strong" },
    behaviors: { "recent_purchase": "strong" }
  },
  inferred_intent: "Buy accessories for camera"
}
```

### 6. **Rate Limiting**
- Production: 10 requests/day with automatic midnight reset
- Development: Unlimited

## Architecture

### Service Layer
```
server/src/services/
├── catalog/              # Product catalog & user events
│   ├── catalog.service.ts
│   └── recommendation/   # Behavior-driven recommendation
│       └── recommendation-strategy.service.ts
├── llm/                  # OpenAI integration & prompt building
│   └── llm.service.ts
├── generator/            # Content generation orchestration
│   ├── push-generator.service.ts
│   └── email-generator.service.ts
├── verification/         # Three-layer verification
│   └── verification.service.ts
├── attribution/          # Metadata & attribution tracking
│   └── attribution.service.ts
└── rate-limiter/         # API rate limiting
    └── rate-limiter.service.ts
```

### Data Flow
```
User Action
  ↓
Catalog Service (getUserSignals + getRecommendedItems)
  ↓
Recommendation Engine (behavior aggregation + scoring)
  ↓
LLM Service (prompt building + generation)
  ↓
Verification Service (factual + compliance + quality)
  ↓
Attribution Service (metadata enrichment)
  ↓
Final Content Response
```

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- OpenAI API Key

### Installation
```bash
npm install
```

### Environment Setup
```bash
# .env
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
```

### Development
```bash
# Frontend + Backend (recommended)
npm run dev:all

# Frontend only
npm run dev

# Backend only
npm run dev:server

# Production mode (rate limiting enabled)
npm run dev:all:prod
```

### Production Build
```bash
npm run build:all
npm run start
```

## API Endpoints

### Generate Push Notification
```http
POST /api/push/generate
Content-Type: application/json

{
  "userId": "user_007"
}
```

**Response:**
```json
{
  "type": "PUSH",
  "mainText": "Sony WH-1000XM5 - Industry-leading noise cancellation awaits",
  "subText": "Your favorites are waiting 🎁",
  "cta": "Shop Now",
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
      "v1|itm|headphone_sony_xm5": "User browsed Headphones category 3 times"
    },
    "inferred_intent": "Purchase viewed items"
  }
}
```

### Generate Email
```http
POST /api/email/generate
Content-Type: application/json

{
  "userId": "user_002"
}
```

**Response:**
```json
{
  "type": "EMAIL",
  "subject": "Complete Your iPhone 15 Pro Max Setup",
  "preview": "Essential accessories for your new device",
  "body": "Maximize your iPhone 15 Pro Max experience...",
  "bullets": [
    "MagSafe compatible chargers",
    "Premium protective cases"
  ],
  "cta": "Shop Accessories",
  "verification": { /* ... */ },
  "meta": { /* ... */ }
}
```

### Get User Profile
```http
GET /api/user/:userId/profile
```

### Rate Limit Status
```http
GET /api/rate-limit/status
```

## Key Algorithms

### 1. Behavior Aggregation Scoring
```typescript
// Device Scoring for Browse Intent
score = 0
  + (category_match ? 100 : 0)    // Highest priority
  + (brand_match ? 30 : 0)        // Secondary
  + (price_similar ? 10 : 0)      // Tertiary
```

### 2. Recommendation Strategy
```typescript
if (event === 'purchase' && itemType === 'device') {
  return recommendAccessories(device)  // Only accessories
}
else if (event === 'view') {
  return [
    ...sameCategoryDevices(60%),      // Category-first scoring
    ...accessories(40%)
  ]
}
```

### 3. Primary Item Selection
```typescript
// Priority: purchase > add_to_cart > view
// For view-only: Select from most-viewed category
const topCategory = max(categoryInterest.values())
const primaryItem = recentEventsInCategory(topCategory)[0]
```

## Verification

**Factual**: Price/availability/brand checks against catalog
**Compliance**: URL policy, length limits, promotional rules
**Quality**: Tone, grammar, engagement scoring


## Project Structure

```
llm-push-demo/
├── server/
│   └── src/
│       ├── controllers/      # Route handlers
│       ├── services/         # Business logic (6 services)
│       ├── prompts/          # LLM system prompts (push/email)
│       ├── data/             # Mock catalog & user events
│       ├── types/            # TypeScript interfaces
│       └── utils/            # Timing tracker, helpers
├── src/                      # Frontend React app
├── public/                   # Static assets
└── package.json             # Monorepo dependencies
```