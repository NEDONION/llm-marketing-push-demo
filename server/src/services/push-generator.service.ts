import { llmService } from './llm.service';
import { catalogService } from './catalog.service';
import {
    PushContentResponse,
    Candidate,
    Channel,
    Claims,
    PromptBuildRequest,
    UserSignals,
    VerificationResult,
    Constraints,
} from '../types';
import verificationService from "./verification.service";
import { track } from '../utils/timing-tracker';

const DEFAULT_CONSTRAINTS: Constraints = {
    maxLen: 90,
    noUrl: true,
    noPrice: false,
};

const URL_RE =
    /https?:\/\/|www\.|([a-z0-9-]+\.)+[a-z]{2,}([/?#]\S*)?/i;

const stripSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
const withinLen = (s: string, n: number) => [...s].length <= n;
const hasUrl = (s: string) => URL_RE.test(s);

/**
 * Normalize LLM claims
 */
function normalizeClaims(claims: Claims | undefined, allowedItemIds: Set<string>): Claims {
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
 * Candidate scoring
 */
function scoreCandidate(c: Candidate, opts: { maxLen: number; noUrl: boolean }): number {
    const t = stripSpaces(c.text || '');
    const okLen = withinLen(t, opts.maxLen);
    const okUrl = opts.noUrl ? !hasUrl(t) : true;
    const hasRefs = (c.claims?.referenced_item_ids?.length ?? 0) > 0;

    let score = 0;
    if (okLen) score += 3;
    if (okUrl) score += 3;
    if (hasRefs) score += 2;

    if (okLen) {
        const len = [...t].length;
        score += 1 - (opts.maxLen - len) / opts.maxLen;
    }
    return score;
}

/**
 * Pick best LLM candidate
 */
function pickBestCandidate(
    candidates: Candidate[],
    allowedItemIds: Set<string>,
    opts: { maxLen: number; noUrl: boolean }
): Candidate | null {
    const cleaned = candidates
        .map(c => ({
            ...c,
            text: stripSpaces(c.text || ''),
            claims: normalizeClaims(c.claims, allowedItemIds),
        }))
        .filter(c => c.text.length > 0)
        .filter(c => (opts.noUrl ? !hasUrl(c.text) : true))
        .filter(c => withinLen(c.text, opts.maxLen));

    if (cleaned.length === 0) return null;
    cleaned.sort((a, b) => scoreCandidate(b, opts) - scoreCandidate(a, opts));
    return cleaned[0];
}

/**
 * Fallback when no valid LLM candidate
 */
function fallbackVerification(text: string): VerificationResult {
    return {
        verdict: 'ALLOW',
        scores: { fact: 1.0, compliance: 1.0, quality: 1.0 },
        violations: [],
        candidate: {
            text,
            claims: {
                referenced_item_ids: [],
                referenced_brands: [],
                referenced_events: [],
                referenced_holiday: null,
                mentioned_benefits: [],
            },
            model: 'heuristic',
        },
    };
}

async function buildImageUrlFromClaims(claims: Claims | undefined): Promise<string | undefined> {
    const firstId = claims?.referenced_item_ids?.[0];
    if (!firstId) return undefined;
    const item = await catalogService.getItem(firstId);
    return item?.imageUrl || undefined;
}

/**
 * Main function
 */
export const generatePushContent = async (
    userId: string
): Promise<PushContentResponse> => {
    const LOCALE = 'en-US' as const;
    const CHANNEL: Channel = 'PUSH';

    // 1. Generate user signals & recommendations
    const { userSignals, recItemIds } = await track('catalog', async () => {
        const userSignals: UserSignals = catalogService.generateUserSignals(userId);
        const recItems = await catalogService.getRecommendedItems(userId, 6);
        const recItemIds = recItems.map(it => ({ itemId: it.itemId }));
        return { userSignals, recItemIds };
    });

    // 没有推荐商品 → 直接 fallback，完全不会调用 verify
    if (recItemIds.length === 0) {
        const text = '🔥 Check out our latest picks just for you!';
        console.log('[PUSH] No recommended items, using fallback message');
        return {
            type: 'PUSH',
            mainText: text,
            verification: fallbackVerification(text),
            meta: {
                model: 'fallback',
                referenced_item_ids: [],
                referenced_brands: [],
                referenced_events: [],
                referenced_holiday: null,
                mentioned_benefits: [],
                locale: LOCALE,
                channel: CHANNEL,
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
            },
        };
    }

    // 2. Build LLM prompt
    const buildReq: PromptBuildRequest = {
        userId,
        channel: CHANNEL,
        locale: LOCALE,
        maxLen: DEFAULT_CONSTRAINTS.maxLen,
        systemPromptId: 'std-push-v1',
        items: recItemIds,
        userSignals,
        constraints: DEFAULT_CONSTRAINTS,
    };

    const { prompt, generationHints } = await track('promptBuild', () =>
        llmService.instance.buildPrompt(buildReq)
    );
    console.log('[PUSH] Prompt built', {
        nItems: recItemIds.length,
        nCandidatesHint: generationHints?.nCandidates,
    });

    // 3. Generate content with LLM
    const n = Math.max(1, Math.min(5, generationHints?.nCandidates ?? 3));
    const genResp = await track('llmGenerate', () =>
        llmService.instance.generate({
            prompt,
            n,
            returnClaims: true,
            meta: { channel: CHANNEL, locale: LOCALE, maxLen: DEFAULT_CONSTRAINTS.maxLen },
        })
    );

    console.log('[PUSH] LLM generated candidates', {
        requested: n,
        got: genResp.candidates?.length ?? 0,
    });

    // 4. Select best candidate
    const allowedItemIds = new Set(recItemIds.map(x => x.itemId));
    const best = pickBestCandidate(genResp.candidates || [], allowedItemIds, {
        maxLen: DEFAULT_CONSTRAINTS.maxLen,
        noUrl: DEFAULT_CONSTRAINTS.noUrl,
    });

    if (!best) {
        const text = '🔥 Hot deals are waiting for you!';
        console.log('[PUSH] No valid candidate after filtering, using fallback');
        return {
            type: 'PUSH',
            mainText: text,
            verification: fallbackVerification(text),
            meta: {
                model: 'fallback',
                referenced_item_ids: [],
                referenced_brands: [],
                referenced_events: [],
                referenced_holiday: null,
                mentioned_benefits: [],
                locale: LOCALE,
                channel: CHANNEL,
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
            },
        };
    }

    // 5. Verification
    console.log('[PUSH] Calling verificationService.verify');
    const verifyResp = await track('verification', () =>
        verificationService.verify({
            userId,
            market: 'US',
            now: new Date().toISOString(),
            channel: CHANNEL,
            locale: LOCALE,
            constraints: {
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
                noUrl: DEFAULT_CONSTRAINTS.noUrl,
                noPrice: DEFAULT_CONSTRAINTS.noPrice,
            },
            candidates: [best],
        })
    );

    console.log('[PUSH] verificationService.verify finished', {
        resultCount: verifyResp.results?.length ?? 0,
    });

    const vr = verifyResp.results?.[0];

    if (!vr || vr.verdict === 'REJECT') {
        const text = '🔥 Hot deals are waiting for you!';
        console.log('[PUSH] Verification failed or rejected, falling back', {
            verdict: vr?.verdict,
            violations: vr?.violations,
        });
        return {
            type: 'PUSH',
            mainText: text,
            verification: vr || fallbackVerification(text),
            meta: {
                model: best.model,
                token: best.token,
                ...normalizeClaims(best.claims, allowedItemIds),
                locale: LOCALE,
                channel: CHANNEL,
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
            },
        };
    }

    // 验证成功
    const verification = vr;
    console.log('[PUSH] Verification passed', {
        verdict: verification.verdict,
        scores: verification.scores,
    });

    // 6. Construct final push message
    const imageUrl = await buildImageUrlFromClaims(best.claims);

    return {
        type: 'PUSH',
        mainText: best.text,
        subText: 'Your favorites are waiting 🎁',
        cta: 'Shop Now',
        imageUrl,
        verification,
        meta: {
            model: best.model,
            token: best.token,
            ...normalizeClaims(best.claims, allowedItemIds),
            locale: LOCALE,
            channel: CHANNEL,
            maxLen: DEFAULT_CONSTRAINTS.maxLen,
        },
    };
};

/**
 * Optional DI wrapper
 */
export class PushGeneratorService {
    async generate(userId: string): Promise<PushContentResponse> {
        return generatePushContent(userId);
    }
}

export const pushGeneratorService = new PushGeneratorService();
export default pushGeneratorService;