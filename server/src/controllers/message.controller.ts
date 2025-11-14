import { Request, Response } from 'express';
import { GenerateMessageRequest, GenerateMessageResponse } from '../types';
import { llmService } from '../services/llm.service';
import { verificationService } from '../services/verification.service';
import { catalogService } from '../services/catalog.service';
import { rateLimiterService } from '../services/rate-limiter.service';
import pushGeneratorService from "../services/push-generater.service";

/**
 * 消息生成控制器
 */
export class MessageController {
  /**
   * 生成营销消息（完整流程）
   * POST /api/generate
   */
  async generate(req: Request, res: Response): Promise<void> {
    try {
      const request: GenerateMessageRequest = req.body;

      // 检查限流（生产环境）
      const rateLimitCheck = rateLimiterService.checkLimit();
      if (!rateLimitCheck.allowed) {
        res.status(429).json({
          success: false,
          error: 'Daily API limit exceeded. Please try again tomorrow.',
          rateLimitInfo: {
            remaining: rateLimitCheck.remaining,
            resetAt: rateLimitCheck.resetAt
          }
        });
        return;
      }

      // 验证请求
      if (!request.userId || !request.channel) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: userId and channel'
        });
        return;
      }

      const locale = request.locale || 'en-US';
      const maxLen = request.channel === 'PUSH' ? 90 : 200;

      // 1. 获取用户信号
      const userSignals = catalogService.generateUserSignals(request.userId);

      // 2. 获取推荐商品
      let itemIds = request.itemIds || [];
      if (itemIds.length === 0) {
        const recommendedItems = await catalogService.getRecommendedItems(request.userId, 3);
        itemIds = recommendedItems.map(item => item.itemId);
      }

      // 3. 构建 Prompt
      const promptResponse = await llmService.instance.buildPrompt({
        userId: request.userId,
        channel: request.channel,
        locale,
        maxLen,
        systemPromptId: 'marketing_v1',
        items: itemIds.map(id => ({ itemId: id })),
        userSignals,
        constraints: {
          maxLen,
          noUrl: request.channel === 'PUSH',
          noPrice: false
        }
      });

      console.log("promptResponse:" + promptResponse);

      // 4. 调用 LLM 生成
      const llmResponse = await llmService.instance.generate({
        prompt: promptResponse.prompt,
        n: promptResponse.generationHints.nCandidates,
        returnClaims: true,
        meta: {
          channel: request.channel,
          locale,
          maxLen
        }
      });

      console.log("llmResponse:" + llmResponse);

      if (llmResponse.candidates.length === 0) {
        res.status(500).json({
          success: false,
          error: 'LLM failed to generate candidates'
        });
        return;
      }

      // 5. 验证候选
      const verifyResponse = await verificationService.verify({
        userId: request.userId,
        market: 'US',
        now: new Date().toISOString(),
        channel: request.channel,
        locale,
        constraints: {
          maxLen,
          noUrl: request.channel === 'PUSH',
          noPrice: false
        },
        candidates: llmResponse.candidates
      });

      // 6. 选择最佳候选
      const bestResult = this.selectBestCandidate(verifyResponse.results);

      if (!bestResult || bestResult.verdict === 'REJECT') {
        res.status(200).json({
          success: false,
          channel: request.channel,
          error: 'All candidates failed verification',
          verification: bestResult
        } as GenerateMessageResponse);
        return;
      }

      // 7. 记录成功调用
      rateLimiterService.recordCall();

      // 8. 返回结果
      const finalMessage = bestResult.autoFix?.suggested || bestResult.candidate?.text || '';

      res.status(200).json({
        success: true,
        channel: request.channel,
        message: finalMessage,
        verification: bestResult
      } as GenerateMessageResponse);

    } catch (error: any) {
      console.error('Generate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Generation failed'
      });
    }
  }

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

      // 调用 PushGeneratorService
      const pushContent = await pushGeneratorService.generate(userId);

      res.status(200).json(pushContent);
    } catch (error: any) {
      console.error('generatePush error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate push content',
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
