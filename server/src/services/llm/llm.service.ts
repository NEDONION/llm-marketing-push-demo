import OpenAI from 'openai';
import {
  Channel,
  Locale,
  Candidate,
  PromptBuildRequest,
  PromptBuildResponse,
  LLMGenerateRequest,
  LLMGenerateResponse,
  UserSignals
} from '../../types/index.js';
import { catalogService } from '../catalog/catalog.service.js';
import {getSystemPromptByChannel} from "../../prompts/index.js";

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

    // 根据渠道选择系统提示词（你现在用的是 this.getSystemPrompt；之后也可以替换成外部 prompts）
    const systemPrompt = this.getSystemPrompt(channel, locale, maxLen, constraints);

    // 🔹 根据渠道定义不同的 JSON 返回格式
    const outputSchema =
        channel === 'PUSH'
            ? `
Please return the information referenced in your copy in JSON format:
{
  "text": "Generated push copy",
  "claims": {
    "referenced_item_ids": ["Item ID list (must use complete Item IDs provided above, format: v1|itm|001)"],
    "referenced_brands": ["Brand list"],
    "referenced_events": ["Referenced user behaviors, e.g., recent_view, recent_add_to_cart"],
    "referenced_holiday": "Holiday name or null",
    "mentioned_benefits": ["Mentioned benefits, e.g., free shipping, discounts"]
  }
}
`
            : `
Please return the EMAIL content in JSON format:
{
  "subject": "Email subject line",
  "preview": "Short preview text shown in inbox list",
  "body": "Main email body text (plain text, no HTML)",
  "bullets": ["Optional bullet 1", "Optional bullet 2"],
  "cta": "Call-to-action text, e.g. 'Shop Now'",
  "claims": {
    "referenced_item_ids": ["Item ID list (must use complete Item IDs provided above, format: v1|itm|001)"],
    "referenced_brands": ["Brand list"],
    "referenced_events": ["Referenced user behaviors, e.g., recent_view, recent_add_to_cart"],
    "referenced_holiday": "Holiday name or null",
    "mentioned_benefits": ["Mentioned benefits, e.g., free shipping, discounts"]
  }
}
`;

    // 构建完整的 prompt
    const prompt = `${systemPrompt}

【User Profile】
${userContext}

【Recommended Items】
${itemDescriptions}

${holidayContext}

Please generate ${channel === 'PUSH' ? 'a short push notification' : 'a personalized marketing email'} with the following requirements:
1. Length not exceeding ${maxLen} characters${channel === 'EMAIL' ? ' for the email body' : ''}
2. ${constraints.noUrl ? 'No URLs allowed' : 'URLs are allowed if needed'}
3. ${constraints.noPrice ? 'Do not display prices directly' : 'You may mention prices if helpful'}
4. Based on user's recent behavior (${userSignals.recent_view} views, ${userSignals.recent_add_to_cart} add-to-cart)
5. Friendly and personalized tone that sparks user interest

${outputSchema}

IMPORTANT: referenced_item_ids must use the complete Item IDs provided in 【Recommended Items】 (format: v1|itm|xxx), DO NOT use product names!
IMPORTANT: You MUST return ONLY a valid JSON object, no explanations or markdown.`;

    return {
      prompt,
      generationHints: {
        nCandidates: channel === 'PUSH' ? 3 : 2,
        temperature: 0.7
      }
    };
  }


  /**
   * 调用 LLM 生成候选文案（兼容 PUSH / EMAIL 两种输出 schema）
   */
  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    const { prompt, n } = request;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        n,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const candidates: Candidate[] = [];

      for (const choice of completion.choices) {
        try {
          const content = choice.message.content;
          if (!content) continue;

          const parsed = JSON.parse(content);

          // 🔥 兼容两种结构：PUSH 与 EMAIL
          candidates.push({
            // email 会优先使用 subject/body，否则 fallback 到 text
            text: parsed.text ?? parsed.body ?? '',

            claims: parsed.claims || {
              referenced_item_ids: [],
              referenced_brands: [],
              referenced_events: [],
              referenced_holiday: null,
              mentioned_benefits: []
            },

            model: completion.model,
            token: completion.usage?.total_tokens,

            // 📌 Email 独有字段
            subject: parsed.subject,
            preview: parsed.preview,
            body: parsed.body,
            bullets: parsed.bullets,
            cta: parsed.cta
          });

        } catch (e) {
          console.error('Failed to parse LLM response:', e);
          candidates.push({
            text: choice.message.content ?? '',
            claims: {
              referenced_item_ids: [],
              referenced_brands: [],
              referenced_events: [],
              referenced_holiday: null,
              mentioned_benefits: []
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
    return getSystemPromptByChannel(channel, locale, maxLen, constraints);
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
