import { llmService } from './llm.service';
import { catalogService } from './catalog.service';
import {
    Channel,
    PromptBuildRequest,
    UserSignals,
    VerificationResult,
    EmailContentResponse,
    Claims,
    Locale, Candidate,
} from '../types';
import verificationService from "./verification.service";

const MAX_BODY_LEN = 500;
const LOCALE: Locale = 'en-US';
const CHANNEL: Channel = 'EMAIL';

/**
 * 规范化 LLM claims（只保留允许的 itemIds）
 */
function normalizeClaims(
    claims: Claims | undefined,
    allowedItemIds: Set<string>
): Claims {
    const safeItemIds =
        claims?.referenced_item_ids?.filter(id => allowedItemIds.has(id)) ?? [];
    return {
        referenced_item_ids: safeItemIds,
        referenced_brands: claims?.referenced_brands ?? [],
        referenced_events: claims?.referenced_events ?? [],
        referenced_holiday: claims?.referenced_holiday ?? null,
        mentioned_benefits: claims?.mentioned_benefits ?? [],
    };
}

/**
 * 简单的 fallback 文案
 */
function fallbackEmail(): EmailContentResponse {
    const body =
        'Check out our latest recommendations based on what shoppers like you are viewing today.';

    return {
        type: 'EMAIL',
        subject: 'Your personalized picks are here',
        preview: 'Hand-selected recommendations just for you',
        body,
        cta: 'Explore Now',
        verification: {
            verdict: 'ALLOW',
            scores: { fact: 1, compliance: 1, quality: 1 },
            violations: [],
            candidate: {
                text: body,
                claims: {
                    referenced_item_ids: [],
                    referenced_brands: [],
                    referenced_events: [],
                    referenced_holiday: null,
                    mentioned_benefits: [],
                },
                model: 'fallback',
            },
        },
        meta: {
            model: 'fallback',
            referenced_item_ids: [],
            referenced_brands: [],
            referenced_events: [],
            referenced_holiday: null,
            mentioned_benefits: [],
            locale: LOCALE,
            channel: CHANNEL,
            maxLen: MAX_BODY_LEN,
        },
    };
}

/**
 * Email 生成主流程
 */
export const generateEmailContent = async (
    userId: string
): Promise<EmailContentResponse> => {
    // 1. 用户信号 + 推荐
    const userSignals: UserSignals = catalogService.generateUserSignals(userId);
    const recItems = await catalogService.getRecommendedItems(userId, 6);
    const recItemIds = recItems.map(it => ({ itemId: it.itemId }));

    // 2. 构建 Prompt
    const buildReq: PromptBuildRequest = {
        userId,
        channel: CHANNEL,
        locale: LOCALE,
        maxLen: MAX_BODY_LEN,
        systemPromptId: 'std-email-v1',
        items: recItemIds,
        userSignals,
        constraints: {
            maxLen: MAX_BODY_LEN,
            noUrl: false,
            noPrice: false,
        },
    };

    const { prompt, generationHints } = await llmService.instance.buildPrompt(buildReq);

    // 3. 调用 LLM
    const n = Math.max(1, Math.min(3, generationHints?.nCandidates ?? 1));

    const genResp = await llmService.instance.generate({
        prompt,
        n,
        returnClaims: true,
        meta: {
            channel: CHANNEL,
            locale: LOCALE,
            maxLen: MAX_BODY_LEN,
        },
    });

    const first = genResp.candidates?.[0];
    if (!first) {
        return fallbackEmail();
    }

    // —— LLM output 格式要求（在 email prompt 里已经约定）：
    // {
    //   "subject": "...",
    //   "preview": "...",
    //   "body": "...",
    //   "bullets": [],
    //   "cta": "Shop Now",
    //   "claims": { ... }
    // }

    const subject = first.subject || 'Recommended for you';
    const preview = first.preview || first.text?.slice(0, 60) || '';
    const body = first.body || first.text || '';
    const bullets = Array.isArray(first.bullets) ? first.bullets : undefined;
    const cta = first.cta || 'View Details';

    // 允许的 itemId 集合，用于过滤 claims
    const allowedItemIds = new Set(recItemIds.map(x => x.itemId));
    const normalizedClaims = normalizeClaims(first.claims, allowedItemIds);

    // 构造用于校验的 candidate（带已过滤的 claims）
    const candidateForVerify: Candidate = {
        ...first,
        claims: normalizedClaims,
    };

    // 4. 调用真实 Verifier
    const verifyResp = await verificationService.verify({
        userId,
        market: 'US',
        now: new Date().toISOString(),
        channel: CHANNEL,
        locale: LOCALE,
        constraints: {
            maxLen: MAX_BODY_LEN,
            noUrl: false,
            noPrice: false,
        },
        candidates: [candidateForVerify],
    });

    const vr = verifyResp.results?.[0];

    // 如果校验失败或被拒绝，走 fallback
    if (!vr || vr.verdict === 'REJECT') {
        return fallbackEmail();
    }

    const verification: VerificationResult = vr;

    // 5. 返回给前端（带上 meta）
    const finalClaims = (vr.candidate?.claims ?? normalizedClaims);

    return {
        type: 'EMAIL',
        subject,
        preview,
        body,
        bullets,
        cta,
        verification,
        meta: {
            model: vr.candidate?.model || first.model,
            token: vr.candidate?.token ?? first.token,
            referenced_item_ids: finalClaims.referenced_item_ids,
            referenced_brands: finalClaims.referenced_brands,
            referenced_events: finalClaims.referenced_events,
            referenced_holiday: finalClaims.referenced_holiday,
            mentioned_benefits: finalClaims.mentioned_benefits,
            locale: LOCALE,
            channel: CHANNEL,
            maxLen: MAX_BODY_LEN,
        },
    };

};

/**
 * DI 封装
 */
export class EmailGeneratorService {
    async generate(userId: string): Promise<EmailContentResponse> {
        return generateEmailContent(userId);
    }
}

export const emailGeneratorService = new EmailGeneratorService();
export default emailGeneratorService;
