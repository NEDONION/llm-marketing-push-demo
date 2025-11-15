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
export const generatePushContent = async (userId: string): Promise<PushContentResponse> => {
    // 1. Generate user signals & recommendations
    const userSignals: UserSignals = catalogService.generateUserSignals(userId);
    const recItems = await catalogService.getRecommendedItems(userId, 6);
    const recItemIds = recItems.map(it => ({ itemId: it.itemId }));

    if (recItemIds.length === 0) {
        const text = '🔥 Check out our latest picks just for you!';
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
                locale: 'en-US',
                channel: 'PUSH',
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
            },
        };
    }

    // 2. Build LLM prompt
    const buildReq: PromptBuildRequest = {
        userId,
        channel: 'PUSH' as Channel,
        locale: 'en-US',
        maxLen: DEFAULT_CONSTRAINTS.maxLen,
        systemPromptId: 'std-push-v1',
        items: recItemIds,
        userSignals,
        constraints: DEFAULT_CONSTRAINTS,
    };

    const { prompt, generationHints } = await llmService.instance.buildPrompt(buildReq);

    // 3. Generate content with LLM
    const n = Math.max(1, Math.min(5, generationHints?.nCandidates ?? 3));
    const genResp = await llmService.instance.generate({
        prompt,
        n,
        returnClaims: true,
        meta: { channel: 'PUSH', locale: 'en-US', maxLen: DEFAULT_CONSTRAINTS.maxLen },
    });

    // 4. Select best candidate
    const allowedItemIds = new Set(recItemIds.map(x => x.itemId));
    const best = pickBestCandidate(genResp.candidates || [], allowedItemIds, {
        maxLen: DEFAULT_CONSTRAINTS.maxLen,
        noUrl: DEFAULT_CONSTRAINTS.noUrl,
    });

    if (!best) {
        const text = '🔥 Hot deals are waiting for you!';
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
                locale: 'en-US',
                channel: 'PUSH',
                maxLen: DEFAULT_CONSTRAINTS.maxLen,
            },
        };
    }

    // 5. Verification (stub, can connect to real verifier later)
    const verification: VerificationResult = {
        verdict: 'ALLOW',
        scores: { fact: 0.97, compliance: 0.96, quality: 0.94 },
        violations: [],
        candidate: best,
    };

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
            locale: 'en-US',
            channel: 'PUSH',
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