import OpenAI from 'openai';
import {
  Channel,
  Locale,
  Candidate,
  Claims,
  PromptBuildRequest,
  PromptBuildResponse,
  LLMGenerateRequest,
  LLMGenerateResponse,
  UserSignals
} from '../types';
import { catalogService } from './catalog.service';

/**
 * LLM 服务 - 负责 Prompt 构建和生成
 */
export class LLMService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  /**
   * 构建 Prompt
   */
  async buildPrompt(request: PromptBuildRequest): Promise<PromptBuildResponse> {
    const { userId, channel, locale, maxLen, items, userSignals, constraints } = request;

    // 获取商品信息
    const itemDetails = await catalogService.getItems(items.map(i => i.itemId));

    // 构建商品描述（包含商品 ID）
    const itemDescriptions = Array.from(itemDetails.values()).map(item =>
      `商品ID: ${item.itemId}\n【${item.brand || ''}】${item.title} - $${item.price}`
    ).join('\n\n');

    // 获取当前节日
    const currentHolidays = catalogService.getCurrentHolidays(locale);
    const holidayContext = currentHolidays.length > 0
      ? `当前促销活动：${currentHolidays.map(h => h.name).join('、')}`
      : '';

    // 构建用户行为上下文
    const userContext = this.buildUserContext(userSignals);

    // 根据渠道选择系统提示词
    const systemPrompt = this.getSystemPrompt(channel, locale, maxLen, constraints);

    // 构建完整的 prompt
    const prompt = `${systemPrompt}

【User Profile】
${userContext}

【Recommended Items】
${itemDescriptions}

${holidayContext}

Please generate ${channel === 'PUSH' ? 'a short push notification' : 'a personalized marketing email'} with the following requirements:
1. Length not exceeding ${maxLen} characters
2. ${constraints.noUrl ? 'No URLs allowed' : ''}
3. ${constraints.noPrice ? 'Do not display prices directly' : ''}
4. Based on user's recent behavior (${userSignals.recent_view} views, ${userSignals.recent_add_to_cart} add-to-cart)
5. Friendly and personalized tone that sparks user interest

Please return the information referenced in your copy in JSON format:
{
  "text": "Generated copy",
  "claims": {
    "referenced_item_ids": ["Item ID list (must use complete Item IDs provided above, format: v1|itm|001)"],
    "referenced_brands": ["Brand list"],
    "referenced_events": ["Referenced user behaviors, e.g., recent_view, recent_add_to_cart"],
    "referenced_holiday": "Holiday name or null",
    "mentioned_benefits": ["Mentioned benefits, e.g., free shipping, discounts"]
  }
}

IMPORTANT: referenced_item_ids must use the complete Item IDs provided in 【Recommended Items】 (format: v1|itm|xxx), DO NOT use product names!`;

    return {
      prompt,
      generationHints: {
        nCandidates: channel === 'PUSH' ? 3 : 2,
        temperature: 0.7
      }
    };
  }

  /**
   * 调用 LLM 生成候选文案
   */
  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    const { prompt, n, meta } = request;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',  // 使用 OpenRouter
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        n: n,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const candidates: Candidate[] = [];

      for (const choice of completion.choices) {
        try {
          const content = choice.message.content;
          if (!content) continue;

          const parsed = JSON.parse(content);

          candidates.push({
            text: parsed.text,
            claims: parsed.claims || {
              referenced_item_ids: [],
              referenced_brands: [],
              referenced_events: [],
              referenced_holiday: null,
              mentioned_benefits: []
            },
            model: completion.model,
            token: completion.usage?.total_tokens
          });
        } catch (e) {
          console.error('Failed to parse LLM response:', e);
          // 如果解析失败，尝试直接使用内容
          candidates.push({
            text: choice.message.content || '',
            claims: {
              referenced_item_ids: [],
              referenced_brands: [],
              referenced_events: [],
              referenced_holiday: null
            },
            model: completion.model
          });
        }
      }

      return { candidates };
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error(`LLM generation failed: ${error}`);
    }
  }

  /**
   * 构建用户行为上下文
   */
  private buildUserContext(signals: UserSignals): string {
    const parts: string[] = [];

    if (signals.recent_view > 0) {
      parts.push(`Viewed ${signals.recent_view} items in the last 7 days`);
    }

    if (signals.recent_add_to_cart > 0) {
      parts.push(`Added ${signals.recent_add_to_cart} items to cart`);
    }

    if (signals.recent_purchase > 0) {
      parts.push(`Purchased ${signals.recent_purchase} items`);
    }

    if (signals.tags.length > 0) {
      parts.push(`Interested in: ${signals.tags.slice(0, 3).join(', ')}`);
    }

    if (signals.favorite_brands && signals.favorite_brands.length > 0) {
      parts.push(`Favorite brands: ${signals.favorite_brands.slice(0, 3).join(', ')}`);
    }

    return parts.join('; ') || 'New user';
  }

  /**
   * 获取系统提示词
   */
  private getSystemPrompt(
    channel: Channel,
    locale: Locale,
    maxLen: number,
    constraints: any
  ): string {
    const basePrompt = 'You are a professional e-commerce marketing copywriter, skilled at generating personalized marketing content based on user profiles and product information.';

    const channelSpecific = channel === 'PUSH'
      ? '\n\n【Push Notification Requirements】\n- Brief and to the point\n- Create urgency or curiosity\n- No URLs or links\n- Keep under 90 characters'
      : '\n\n【Email Requirements】\n- Personalized greeting\n- Provide value and appeal\n- Can include simple structure\n- Keep under 200 characters';

    return basePrompt + channelSpecific;
  }
}

// 延迟实例化，确保环境变量已加载
let _llmServiceInstance: LLMService | null = null;

export const llmService = {
  get instance(): LLMService {
    if (!_llmServiceInstance) {
      _llmServiceInstance = new LLMService();
    }
    return _llmServiceInstance;
  }
};
