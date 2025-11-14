import { Router } from 'express';
import { messageController } from '../controllers/message.controller';

const router = Router();

/**
 * 生成营销消息（完整流程）
 * POST /api/generate
 *
 * Body:
 * {
 *   "userId": "user_001",
 *   "channel": "PUSH" | "EMAIL",
 *   "locale": "zh-CN" (optional),
 *   "itemIds": ["v1|itm|001"] (optional)
 * }
 */
router.post('/generate', (req, res) => messageController.generate(req, res));


/** 🔹 新增专用 Push 生成接口 */
router.post('/push/generate', (req, res) => messageController.generatePush(req, res));


/**
 * 验证候选内容
 * POST /api/verify
 */
router.post('/verify', (req, res) => messageController.verify(req, res));

/**
 * 获取用户画像
 * GET /api/user/:userId/profile
 */
router.get('/user/:userId/profile', (req, res) => messageController.getUserProfile(req, res));

/**
 * 获取限流状态
 * GET /api/rate-limit/status
 */
router.get('/rate-limit/status', (req, res) => messageController.getRateLimitStatus(req, res));

/**
 * 健康检查
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'llm-push-demo'
  });
});

export default router;
