import { Request, Response } from 'express';
import { GenerateMessageRequest, GenerateMessageResponse } from '../types';
import { llmService } from '../services/llm.service';
import { verificationService } from '../services/verification.service';
import { catalogService } from '../services/catalog.service';
import { rateLimiterService } from '../services/rate-limiter.service';
import pushGeneratorService from "../services/push-generator.service";
import emailGeneratorService from "../services/email-generator.service";
import { initTimingContext, getTimingInfo } from '../utils/timing-tracker';

/**
 * 消息生成控制器
 */
export class MessageController {

  /**
   * 只生成 Push 消息
   * POST /api/push/generate
   * Body: { userId: string }
   */
  async generatePush(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'Missing required field: userId' });
        return;
      }

      // 使用时间追踪上下文包装
      const pushContent = await initTimingContext(async () => {
        const content = await pushGeneratorService.generate(userId);
        // 自动添加timing信息
        const timing = getTimingInfo();
        return { ...content, timing };
      });

      res.status(200).json(pushContent);
    } catch (error: any) {
      console.error('generatePush error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate push content',
      });
    }
  }

  /**
   * 只生成 Email 内容
   * POST /api/email/generate
   * Body: { userId: string }
   */
  async generateEmail(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'Missing required field: userId' });
        return;
      }

      // 使用时间追踪上下文包装
      const emailContent = await initTimingContext(async () => {
        const content = await emailGeneratorService.generate(userId);
        // 自动添加timing信息
        const timing = getTimingInfo();
        return { ...content, timing };
      });

      res.status(200).json(emailContent);
    } catch (error: any) {
      console.error('generateEmail error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate email content',
      });
    }
  }

  /**
   * 仅验证（不生成）
   * POST /api/verify
   */
  async verify(req: Request, res: Response): Promise<void> {
    try {
      const verifyResponse = await verificationService.verify(req.body);
      res.status(200).json(verifyResponse);
    } catch (error: any) {
      console.error('Verify error:', error);
      res.status(500).json({
        error: error.message || 'Verification failed'
      });
    }
  }

  /**
   * 获取限流状态
   * GET /api/rate-limit/status
   */
  async getRateLimitStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = rateLimiterService.getStatus();
      res.status(200).json(status);
    } catch (error: any) {
      console.error('Get rate limit status error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get rate limit status'
      });
    }
  }

  /**
   * 获取用户画像
   * GET /api/user/:userId/profile
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      const userSignals = catalogService.generateUserSignals(userId);
      const recentEvents = catalogService.getUserEvents(userId, 7);
      const recommendedItems = await catalogService.getRecommendedItems(userId, 5);

      res.status(200).json({
        userId,
        signals: userSignals,
        recentEvents,
        recommendedItems
      });
    } catch (error: any) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: error.message || 'Failed to get user profile'
      });
    }
  }

  /**
   * 选择最佳候选
   */
  private selectBestCandidate(results: any[]): any {
    // 优先选择 ALLOW
    const allowed = results.filter(r => r.verdict === 'ALLOW');
    if (allowed.length > 0) {
      return this.getBestByScore(allowed);
    }

    // 其次选择 REVISE（可以自动修复）
    const revise = results.filter(r => r.verdict === 'REVISE' && r.autoFix);
    if (revise.length > 0) {
      return this.getBestByScore(revise);
    }

    // 返回最好的 REJECT（用于错误信息）
    return this.getBestByScore(results);
  }

  private getBestByScore(results: any[]): any {
    return results.reduce((best, current) => {
      const bestScore = (best.scores.fact + best.scores.compliance + best.scores.quality) / 3;
      const currentScore = (current.scores.fact + current.scores.compliance + current.scores.quality) / 3;
      return currentScore > bestScore ? current : best;
    });
  }
}

export const messageController = new MessageController();
