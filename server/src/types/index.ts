// ========== 核心类型定义 ==========

export type Channel = 'EMAIL' | 'PUSH';
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP';
export type Verdict = 'ALLOW' | 'REJECT' | 'REVISE';

// ========== 时间追踪相关 ==========

export interface TimingInfo {
  total: number;                  // 总耗时（毫秒）
  llm?: number;                   // LLM生成耗时（毫秒）
  verification?: number;          // 验证服务耗时（毫秒）
  catalog?: number;               // 目录服务耗时（毫秒）
  breakdown?: {
    promptBuild?: number;         // Prompt构建耗时
    llmGenerate?: number;         // LLM调用耗时
    [key: string]: number | undefined;
  };
}

// ========== 商品相关 ==========

export interface EbayItem {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  brand?: string;
  category: string;
  isActive: boolean;
  imageUrl?: string;
  shippingInfo?: {
    freeShipping: boolean;
    estimatedDays?: number;
  };
}

// ========== 用户相关 ==========

export interface UserSignals {
  recent_view: number;          // 近期浏览次数
  recent_add_to_cart: number;   // 近期加购次数
  recent_purchase: number;      // 近期购买次数
  tags: string[];               // 用户兴趣标签
  favorite_brands?: string[];   // 喜欢的品牌
}

export interface UserEvent {
  userId: string;
  eventType: 'view' | 'add_to_cart' | 'purchase';
  itemId: string;
  timestamp: string;
  window: '7d' | '14d' | '30d';
}

// ========== LLM 相关 ==========

export interface Claims {
  referenced_item_ids: string[];
  referenced_brands: string[];
  referenced_events: string[];
  referenced_holiday: string | null;
  mentioned_benefits?: string[];  // 提到的优惠/权益
}

export interface Candidate {
  text: string;
  claims: Claims;
  model: string;
  token?: number;

  subject?: string;
  preview?: string;
  body?: string;
  bullets?: string[];
  cta?: string;
}


export interface PromptBuildRequest {
  userId: string;
  channel: Channel;
  locale: Locale;
  maxLen: number;
  systemPromptId: string;
  items: { itemId: string }[];
  userSignals: UserSignals;
  constraints: Constraints;
}

export interface PromptBuildResponse {
  prompt: string;
  generationHints: {
    nCandidates: number;
    temperature: number;
  };
}

export interface LLMGenerateRequest {
  prompt: string;
  n: number;
  returnClaims: boolean;
  meta: {
    channel: Channel;
    locale: Locale;
    maxLen: number;
  };
}

export interface LLMGenerateResponse {
  candidates: Candidate[];
}

// ========== 验证相关 ==========

export interface Constraints {
  maxLen: number;
  noUrl: boolean;
  noPrice?: boolean;
  allowedPunctuation?: string[];
}

export interface Violation {
  code: string;
  msg: string;
  severity?: 'ERROR' | 'WARNING';
}

export interface FactScore {
  score: number;
  violations: Violation[];
}

export interface ComplianceScore {
  score: number;
  violations: Violation[];
}

export interface QualityScore {
  score: number;
  violations: Violation[];
  metrics?: {
    novelty?: number;
    readability?: number;
    style?: number;
  };
}

export interface AutoFix {
  truncateTo?: number;
  removeClaims?: string[];
  removeUrls?: boolean;
  suggested?: string;
}

export interface VerifyResult {
  verdict: Verdict;
  scores: {
    fact: number;
    compliance: number;
    quality: number;
  };
  violations: Violation[];
  autoFix?: AutoFix;
  audit: {
    policyVer: string;
    catalogSnapshot: string;
    timestamp: string;
  };
  candidate?: Candidate;  // 原始候选或修复后的候选
}

export interface VerifyRequest {
  userId: string;
  market: string;
  now: string;
  channel: Channel;
  locale: Locale;
  constraints: Constraints;
  candidates: Candidate[];
}

export interface VerifyResponse {
  results: VerifyResult[];
}

// ========== 重排相关 ==========

export interface RerankFeatures {
  text: string;
  scores: {
    fact: number;
    compliance: number;
    quality: number;
  };
  features: {
    len: number;
    emojiCount: number;
    toxP: number;
    novelty: number;
    brandToneP?: number;
  };
}

export interface RerankRequest {
  channel: Channel;
  features: RerankFeatures[];
}

export interface RerankResponse {
  ranked: Array<{
    index: number;
    score: number;
    text: string;
  }>;
}

// ========== 完整流程 ==========

export interface GenerateMessageRequest {
  userId: string;
  channel: Channel;
  locale?: Locale;
  itemIds?: string[];
}

export interface GenerateMessageResponse {
  success: boolean;
  channel: Channel;
  message?: string;
  verification?: VerifyResult;
  error?: string;
}

// ========== 用户与消息扩展类型 ==========

export interface VerificationResult {
  verdict: Verdict;
  scores: {
    fact: number;
    compliance: number;
    quality: number;
  };
  violations: Violation[];
  autoFix?: AutoFix;
  candidate?: Candidate;
}

/**
 * Push 内容结构（后端版本，与前端类型兼容）
 */
export interface PushContentResponse {
  type: 'PUSH';
  mainText: string;          // 主标题内容
  subText?: string;          // 可选的副标题（简短描述）
  cta?: string;              // 行动按钮（Call-To-Action，例如"立即查看"）
  imageUrl?: string;         // 展示商品图片或Banner
  verification: VerificationResult; // 审核/验证结果
  timing?: TimingInfo;       // 调用链时间追踪

  meta: {
    model: string;
    token?: number;
    referenced_item_ids: string[];
    referenced_brands: string[];
    referenced_events: string[];
    referenced_holiday: string | null;
    mentioned_benefits?: string[];
    locale: Locale;
    channel: Channel;
    maxLen: number;
  };
}

export interface EmailContentResponse {
  type: 'EMAIL';
  subject: string;
  preview: string;
  body: string;
  bullets?: string[];
  cta?: string;
  verification: VerificationResult;
  timing?: TimingInfo;       // 调用链时间追踪

  meta: {
    model: string;
    token?: number;
    referenced_item_ids: string[];
    referenced_brands: string[];
    referenced_events: string[];
    referenced_holiday: string | null;
    mentioned_benefits?: string[];
    locale: Locale;
    channel: Channel;
    maxLen: number;
  };
}


