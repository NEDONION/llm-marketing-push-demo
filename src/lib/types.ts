// 类型定义
export type UserId = 'user_001' | 'user_002';

export type Channel = 'PUSH' | 'EMAIL';

export type Verdict = 'ALLOW' | 'REVISE' | 'REJECT';

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

export interface UserProfile {
  id: string;
  name: string;
  tags: string[];
}

export interface VerificationScore {
  fact: number;
  compliance: number;
  quality: number;
}

export interface Violation {
  code: string;
  msg: string;
  severity?: 'ERROR' | 'WARNING';
}

export interface VerificationResult {
  verdict: Verdict;
  scores: VerificationScore;
  violations: Violation[];
}

export interface ContentMeta {
  model: string;
  token?: number;
  referenced_item_ids: string[];
  referenced_brands: string[];
  referenced_events: string[];
  referenced_holiday: string | null;
  mentioned_benefits?: string[];
}

export interface PushContentUI {
  type: 'PUSH';
  mainText: string;
  subText?: string;
  cta?: string;
  verification: VerificationResult;
  timing?: TimingInfo;
  meta?: ContentMeta;
}

export interface EmailContentUI {
  type: 'EMAIL';
  subject: string;
  preview: string;
  body: string;
  bullets?: string[];
  cta?: string;
  verification: VerificationResult;
  timing?: TimingInfo;
  meta?: ContentMeta;
}

export type GeneratedContent = PushContentUI | EmailContentUI;
