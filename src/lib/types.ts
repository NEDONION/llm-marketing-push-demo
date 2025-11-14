// 类型定义
export type UserId = 'user_001' | 'user_002';

export type Channel = 'PUSH' | 'EMAIL';

export type Verdict = 'ALLOW' | 'REVISE' | 'REJECT';

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

export interface PushContentUI {
  type: 'PUSH';
  mainText: string;
  subText?: string;
  cta?: string;
  verification: VerificationResult;
}

export interface EmailContent {
  type: 'EMAIL';
  subject: string;
  preview: string;
  body: string;
  bullets?: string[];
  cta?: string;
  verification: VerificationResult;
}

export type GeneratedContent = PushContentUI | EmailContent;
