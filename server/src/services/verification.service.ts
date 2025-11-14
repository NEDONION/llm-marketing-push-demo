import {
  Candidate,
  VerifyRequest,
  VerifyResponse,
  VerifyResult,
  Violation,
  FactScore,
  ComplianceScore,
  QualityScore,
  AutoFix,
  Verdict
} from '../types';
import { catalogService } from './catalog.service';

/**
 * 验证服务 - 三层验证：事实性、合规性、质量
 */
export class VerificationService {
  /**
   * 验证所有候选
   */
  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const results: VerifyResult[] = [];

    for (const candidate of request.candidates) {
      const result = await this.verifyCandidate(candidate, request);
      results.push(result);
    }

    return { results };
  }

  /**
   * 验证单个候选
   */
  private async verifyCandidate(
    candidate: Candidate,
    context: VerifyRequest
  ): Promise<VerifyResult> {
    // 三层验证
    const factScore = await this.checkFacts(candidate, context);
    const complianceScore = this.checkCompliance(candidate, context);
    const qualityScore = this.checkQuality(candidate, context);

    // 合并违规
    const allViolations = [
      ...factScore.violations,
      ...complianceScore.violations,
      ...qualityScore.violations
    ];

    // 裁决
    const verdict = this.makeVerdict(factScore, complianceScore, qualityScore);

    // 自动修复建议
    const autoFix = this.suggestAutoFix(candidate, context, factScore, complianceScore, qualityScore);

    return {
      verdict,
      scores: {
        fact: factScore.score,
        compliance: complianceScore.score,
        quality: qualityScore.score
      },
      violations: allViolations,
      autoFix,
      audit: {
        policyVer: 'v1.0.0',
        catalogSnapshot: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      },
      candidate
    };
  }

  /**
   * 事实性验证
   */
  private async checkFacts(candidate: Candidate, context: VerifyRequest): Promise<FactScore> {
    let score = 1.0;
    const violations: Violation[] = [];

    // 1. 验证用户事件
    const userEvents = catalogService.getUserEvents(context.userId, 7);
    const hasRecentView = userEvents.some(e => e.eventType === 'view');
    const hasRecentCart = userEvents.some(e => e.eventType === 'add_to_cart');
    const hasRecentPurchase = userEvents.some(e => e.eventType === 'purchase');

    if (candidate.claims.referenced_events.includes('recent_view') && !hasRecentView) {
      violations.push({
        code: 'FACT_USER_EVENT_MISS',
        msg: 'Claims contain recent_view but user has no view history in the last 7 days',
        severity: 'ERROR'
      });
      score -= 0.3;
    }

    if (candidate.claims.referenced_events.includes('recent_add_to_cart') && !hasRecentCart) {
      violations.push({
        code: 'FACT_USER_EVENT_MISS',
        msg: 'Claims contain recent_add_to_cart but user has no cart history in the last 7 days',
        severity: 'ERROR'
      });
      score -= 0.3;
    }

    if (candidate.claims.referenced_events.includes('recent_purchase') && !hasRecentPurchase) {
      violations.push({
        code: 'FACT_USER_EVENT_MISS',
        msg: 'Claims contain recent_purchase but user has no purchase history in the last 7 days',
        severity: 'ERROR'
      });
      score -= 0.3;
    }

    // 2. 验证商品有效性
    for (const itemId of candidate.claims.referenced_item_ids) {
      const isValid = await catalogService.isItemValid(itemId);
      if (!isValid) {
        violations.push({
          code: 'FACT_ITEM_INVALID',
          msg: `Item ${itemId} is invalid or inactive`,
          severity: 'ERROR'
        });
        score -= 0.5;
      }
    }

    // 3. 验证品牌
    const itemsMap = await catalogService.getItems(candidate.claims.referenced_item_ids);
    const actualBrands = new Set(
      Array.from(itemsMap.values())
        .map(item => item.brand)
        .filter(Boolean) as string[]
    );

    for (const claimedBrand of candidate.claims.referenced_brands) {
      if (!actualBrands.has(claimedBrand)) {
        violations.push({
          code: 'FACT_BRAND_MISMATCH',
          msg: `Mentioned brand "${claimedBrand}" does not match recommended items`,
          severity: 'WARNING'
        });
        score -= 0.15;
      }
    }

    // 4. 验证节日
    if (candidate.claims.referenced_holiday) {
      const currentDate = new Date(context.now);
      const isValid = catalogService.isHolidayValid(
        candidate.claims.referenced_holiday,
        currentDate,
        context.locale
      );

      if (!isValid) {
        violations.push({
          code: 'FACT_HOLIDAY_INVALID',
          msg: `Holiday "${candidate.claims.referenced_holiday}" is not in valid time window`,
          severity: 'ERROR'
        });
        score -= 0.2;
      }
    }

    return {
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * 合规性验证
   */
  private checkCompliance(candidate: Candidate, context: VerifyRequest): ComplianceScore {
    let score = 1.0;
    const violations: Violation[] = [];

    // 1. URL 检查（Push 渠道不允许）
    if (context.constraints.noUrl) {
      const urlPattern = /https?:\/\/|www\./gi;
      if (urlPattern.test(candidate.text)) {
        violations.push({
          code: 'COMPLIANCE_URL_FORBIDDEN',
          msg: `${context.channel} channel does not allow URLs`,
          severity: 'ERROR'
        });
        score = 0;  // 硬违规
      }
    }

    // 2. 绝对化用语检查
    const absoluteWords = ['最好', '最低', '史上', '第一', '绝对', '完美', '极致'];
    const foundAbsolutes = absoluteWords.filter(word => candidate.text.includes(word));

    if (foundAbsolutes.length > 0) {
      violations.push({
        code: 'COMPLIANCE_ABSOLUTE_WORDS',
        msg: `Contains absolute words: ${foundAbsolutes.join(', ')}`,
        severity: 'ERROR'
      });
      score -= 0.3 * foundAbsolutes.length;
    }

    // 3. 禁词检查
    const forbiddenWords = ['垃圾', '假货', '欺诈', '骗人'];
    const foundForbidden = forbiddenWords.filter(word => candidate.text.includes(word));

    if (foundForbidden.length > 0) {
      violations.push({
        code: 'COMPLIANCE_FORBIDDEN_WORDS',
        msg: `Contains forbidden words: ${foundForbidden.join(', ')}`,
        severity: 'ERROR'
      });
      score = 0;  // 硬违规
    }

    // 4. 过度标点符号
    const exclamationCount = (candidate.text.match(/!/g) || []).length;
    const questionCount = (candidate.text.match(/\?/g) || []).length;

    if (exclamationCount > 2) {
      violations.push({
        code: 'COMPLIANCE_EXCESSIVE_PUNCTUATION',
        msg: `Too many exclamation marks (${exclamationCount})`,
        severity: 'WARNING'
      });
      score -= 0.1;
    }

    if (questionCount > 2) {
      violations.push({
        code: 'COMPLIANCE_EXCESSIVE_PUNCTUATION',
        msg: `Too many question marks (${questionCount})`,
        severity: 'WARNING'
      });
      score -= 0.1;
    }

    // 5. 价格显示检查（如果要求不显示价格）
    if (context.constraints.noPrice) {
      const pricePattern = /\$[\d,.]+|¥[\d,.]+|[\d,.]+元/g;
      if (pricePattern.test(candidate.text)) {
        violations.push({
          code: 'COMPLIANCE_PRICE_FORBIDDEN',
          msg: 'Price display is not allowed',
          severity: 'WARNING'
        });
        score -= 0.2;
      }
    }

    return {
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * 质量验证
   */
  private checkQuality(candidate: Candidate, context: VerifyRequest): QualityScore {
    let score = 1.0;
    const violations: Violation[] = [];
    const metrics: any = {};

    // 1. 长度检查
    const textLength = this.getTextLength(candidate.text, context.locale);

    if (textLength > context.constraints.maxLen) {
      violations.push({
        code: 'QUALITY_LEN_OVER',
        msg: `Length exceeds limit: ${textLength} > ${context.constraints.maxLen}`,
        severity: 'ERROR'
      });
      score -= 0.3;
    }

    if (textLength < 10) {
      violations.push({
        code: 'QUALITY_LEN_TOO_SHORT',
        msg: `Content too short: ${textLength} characters`,
        severity: 'WARNING'
      });
      score -= 0.2;
    }

    // 2. 标点符号合理性
    const punctuationRatio = this.getPunctuationRatio(candidate.text);
    if (punctuationRatio > 0.2) {
      violations.push({
        code: 'QUALITY_PUNCT_EXCESS',
        msg: `Punctuation ratio too high: ${(punctuationRatio * 100).toFixed(1)}%`,
        severity: 'WARNING'
      });
      score -= 0.15;
    }

    // 3. Emoji 检查
    const emojiCount = this.countEmoji(candidate.text);
    metrics.emojiCount = emojiCount;

    if (emojiCount > 3) {
      violations.push({
        code: 'QUALITY_EMOJI_EXCESS',
        msg: `Too many emojis: ${emojiCount}`,
        severity: 'WARNING'
      });
      score -= 0.1;
    }

    // 4. 语言一致性（简单检查）
    const hasEnglish = /[a-zA-Z]{3,}/.test(candidate.text);
    const hasChinese = /[\u4e00-\u9fa5]{3,}/.test(candidate.text);

    if (context.locale === 'zh-CN' && hasEnglish && !hasChinese) {
      violations.push({
        code: 'QUALITY_LANG_MISMATCH',
        msg: 'Language does not match locale',
        severity: 'WARNING'
      });
      score -= 0.2;
    }

    // 5. 新颖性（简单相似度检查 - 在实际应用中应该用 embedding）
    metrics.novelty = 0.8;  // 模拟值

    // 6. 可读性评分
    const readability = this.calculateReadability(candidate.text, context.locale);
    metrics.readability = readability;

    if (readability < 0.5) {
      violations.push({
        code: 'QUALITY_LOW_READABILITY',
        msg: 'Poor readability',
        severity: 'WARNING'
      });
      score -= 0.15;
    }

    return {
      score: Math.max(0, score),
      violations,
      metrics
    };
  }

  /**
   * 裁决
   */
  private makeVerdict(
    factScore: FactScore,
    complianceScore: ComplianceScore,
    qualityScore: QualityScore
  ): Verdict {
    // 优先级：Compliance > Fact > Quality

    // 硬违规（合规性）
    if (complianceScore.score === 0) {
      return 'REJECT';
    }

    // 合规性低
    if (complianceScore.score < 0.8) {
      return 'REVISE';
    }

    // 事实性检查
    if (factScore.score < 0.6) {
      return 'REJECT';
    }

    if (factScore.score < 0.8) {
      return 'REVISE';
    }

    // 质量检查
    if (qualityScore.score < 0.5) {
      return 'REJECT';
    }

    if (qualityScore.score < 0.7) {
      return 'REVISE';
    }

    return 'ALLOW';
  }

  /**
   * 自动修复建议
   */
  private suggestAutoFix(
    candidate: Candidate,
    context: VerifyRequest,
    factScore: FactScore,
    complianceScore: ComplianceScore,
    qualityScore: QualityScore
  ): AutoFix | undefined {
    const fix: AutoFix = {};

    // 长度修复
    const textLength = this.getTextLength(candidate.text, context.locale);
    if (textLength > context.constraints.maxLen) {
      fix.truncateTo = context.constraints.maxLen - 3;  // 留余地
    }

    // URL 移除
    if (complianceScore.violations.some(v => v.code === 'COMPLIANCE_URL_FORBIDDEN')) {
      fix.removeUrls = true;
    }

    // 移除未证实的 claims
    const invalidEvents = factScore.violations
      .filter(v => v.code === 'FACT_USER_EVENT_MISS')
      .map(v => {
        if (v.msg.includes('recent_view')) return 'recent_view';
        if (v.msg.includes('recent_add_to_cart')) return 'recent_add_to_cart';
        if (v.msg.includes('recent_purchase')) return 'recent_purchase';
        return null;
      })
      .filter(Boolean) as string[];

    if (invalidEvents.length > 0) {
      fix.removeClaims = invalidEvents;
    }

    // 生成修复后的文本建议
    let suggestedText = candidate.text;

    if (fix.removeUrls) {
      suggestedText = suggestedText.replace(/https?:\/\/[^\s]+/g, '');
    }

    if (fix.truncateTo) {
      suggestedText = this.truncateText(suggestedText, fix.truncateTo, context.locale);
    }

    if (suggestedText !== candidate.text) {
      fix.suggested = suggestedText.trim();
    }

    return Object.keys(fix).length > 0 ? fix : undefined;
  }

  // ========== 工具方法 ==========

  private getTextLength(text: string, locale: string): number {
    if (locale === 'zh-CN') {
      // 中文按字符数
      return text.length;
    } else {
      // 英文按单词数 * 平均长度
      return text.split(/\s+/).length * 5;
    }
  }

  private getPunctuationRatio(text: string): number {
    const punctuation = text.match(/[!?.,;:'"]/g) || [];
    return punctuation.length / text.length;
  }

  private countEmoji(text: string): number {
    const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiPattern);
    return matches ? matches.length : 0;
  }

  private calculateReadability(text: string, locale: string): number {
    // 简化的可读性评分
    // 实际应用中应使用 Flesch-Kincaid 或其他算法

    let score = 1.0;

    // 句子长度
    const sentences = text.split(/[。.!?]/);
    const avgSentenceLen = text.length / sentences.length;

    if (avgSentenceLen > 100) {
      score -= 0.2;  // 句子太长
    }

    // 全大写检查
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.3) {
      score -= 0.3;
    }

    return Math.max(0, score);
  }

  private truncateText(text: string, maxLen: number, locale: string): string {
    if (text.length <= maxLen) {
      return text;
    }

    if (locale === 'zh-CN') {
      return text.substring(0, maxLen) + '...';
    } else {
      // 英文按单词截断
      const words = text.split(' ');
      let result = '';
      for (const word of words) {
        if ((result + word).length > maxLen - 3) break;
        result += word + ' ';
      }
      return result.trim() + '...';
    }
  }
}

export const verificationService = new VerificationService();
