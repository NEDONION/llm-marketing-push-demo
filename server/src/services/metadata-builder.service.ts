/**
 * MetaData Builder Service
 * 自动填充归因信息（reference_reasons, reference_strength, inferred_intent）
 */

import { ContentMetaData, Claims, UserSignals, Channel, Locale } from '../types';
import { catalogService } from './catalog.service.js';

/**
 * 构建完整的 MetaData，包括自动填充的归因信息
 */
export async function buildMetaData(params: {
  model: string;
  token?: number;
  locale: Locale;
  channel: Channel;
  maxLen: number;
  claims: Claims;
  userSignals: UserSignals;
  userId: string;
}): Promise<ContentMetaData> {
  const { model, token, locale, channel, maxLen, claims, userSignals, userId } = params;

  // 基础 meta
  const meta: ContentMetaData = {
    model,
    token,
    locale,
    channel,
    maxLen,

    // 引用信息
    referenced_item_ids: claims.referenced_item_ids || [],
    referenced_brands: claims.referenced_brands || [],
    referenced_events: claims.referenced_events || [],
    referenced_holiday: claims.referenced_holiday || null,
    referenced_categories: [],
    mentioned_benefits: claims.mentioned_benefits || [],

    // 归因信息（自动填充）
    reference_reasons: {
      referenced_item_ids: {},
      referenced_events: {},
      referenced_brands: {},
    },

    reference_strength: {
      items: {},
      behaviors: {},
    },

    inferred_intent: 'unknown',
  };

  // 填充商品引用原因和强度
  for (const itemId of meta.referenced_item_ids) {
    const { reason, strength } = await analyzeItemReference(itemId, userId, userSignals);
    meta.reference_reasons.referenced_item_ids[itemId] = reason;
    meta.reference_strength.items[itemId] = strength;
  }

  // 填充品牌引用原因
  for (const brand of meta.referenced_brands) {
    meta.reference_reasons.referenced_brands[brand] = analyzeBrandReference(brand, userSignals);
  }

  // 填充事件引用原因和强度
  for (const event of meta.referenced_events) {
    const { reason, strength } = analyzeEventReference(event, userSignals);
    meta.reference_reasons.referenced_events[event] = reason;
    meta.reference_strength.behaviors[event] = strength;
  }

  // 推断用户意图
  meta.inferred_intent = inferUserIntent(userSignals, meta);

  return meta;
}

/**
 * 分析商品引用原因和强度
 */
async function analyzeItemReference(
  itemId: string,
  userId: string,
  userSignals: UserSignals
): Promise<{ reason: string; strength: 'strong' | 'medium' | 'weak' }> {
  // 获取商品信息
  const item = await catalogService.getItem(itemId);
  if (!item) {
    return { reason: 'Recommended item', strength: 'weak' };
  }

  // 检查用户是否浏览过
  const viewCount = userSignals.recent_view || 0;
  const addToCartCount = userSignals.recent_add_to_cart || 0;
  const purchaseCount = userSignals.recent_purchase || 0;

  // 根据用户行为强度判断
  if (purchaseCount > 0) {
    return {
      reason: `User purchased ${item.title}`,
      strength: 'strong',
    };
  }

  if (addToCartCount > 0) {
    return {
      reason: `User added ${item.title} to cart`,
      strength: 'strong',
    };
  }

  if (viewCount >= 3) {
    return {
      reason: `User viewed ${item.title} multiple times (${viewCount}x)`,
      strength: 'medium',
    };
  }

  if (viewCount > 0) {
    return {
      reason: `User viewed ${item.title}`,
      strength: 'medium',
    };
  }

  // 检查品牌匹配
  if (item.brand && userSignals.favorite_brands?.includes(item.brand)) {
    return {
      reason: `${item.brand} is user's favorite brand`,
      strength: 'medium',
    };
  }

  return {
    reason: 'Recommended by algorithm',
    strength: 'weak',
  };
}

/**
 * 分析品牌引用原因
 */
function analyzeBrandReference(brand: string, userSignals: UserSignals): string {
  if (userSignals.favorite_brands?.includes(brand)) {
    return `${brand} is user's preferred brand`;
  }

  if (userSignals.recent_purchase > 0) {
    return `User previously purchased ${brand} products`;
  }

  return `${brand} brand recommendation`;
}

/**
 * 分析事件引用原因和强度
 */
function analyzeEventReference(
  event: string,
  userSignals: UserSignals
): { reason: string; strength: 'strong' | 'medium' | 'weak' } {
  switch (event) {
    case 'view':
      const viewCount = userSignals.recent_view || 0;
      if (viewCount >= 5) {
        return {
          reason: `User frequently viewed items (${viewCount}x)`,
          strength: 'strong',
        };
      }
      return {
        reason: 'User viewed items',
        strength: 'medium',
      };

    case 'add_to_cart':
      const cartCount = userSignals.recent_add_to_cart || 0;
      if (cartCount > 0) {
        return {
          reason: `User added items to cart (${cartCount} items)`,
          strength: 'strong',
        };
      }
      return {
        reason: 'User has add-to-cart behavior',
        strength: 'medium',
      };

    case 'purchase':
      const purchaseCount = userSignals.recent_purchase || 0;
      if (purchaseCount > 0) {
        return {
          reason: `User purchased items (${purchaseCount} items)`,
          strength: 'strong',
        };
      }
      return {
        reason: 'User has purchase intent',
        strength: 'medium',
      };

    default:
      return {
        reason: `User behavior: ${event}`,
        strength: 'weak',
      };
  }
}

/**
 * 推断用户意图
 */
function inferUserIntent(userSignals: UserSignals, meta: ContentMetaData): string {
  const { recent_view, recent_add_to_cart, recent_purchase, tags } = userSignals;

  // 根据购买行为推断
  if (recent_purchase > 0) {
    if (meta.referenced_brands.length > 0) {
      return `Repurchase ${meta.referenced_brands[0]} brand products`;
    }
    return 'Continue purchasing related items';
  }

  // 根据加购行为推断
  if (recent_add_to_cart > 0) {
    return 'Complete cart purchase';
  }

  // 根据浏览行为推断
  if (recent_view >= 5) {
    if (tags && tags.length > 0) {
      return `Purchase ${tags[0]} related items`;
    }
    return 'Purchase viewed items';
  }

  if (recent_view > 0) {
    return 'Explore items of interest';
  }

  // 新用户或无明显行为
  return 'Discover new items';
}

/**
 * 创建 Fallback MetaData（用于没有推荐或验证失败的情况）
 */
export function createFallbackMetaData(params: {
  model: string;
  locale: Locale;
  channel: Channel;
  maxLen: number;
  token?: number;
}): ContentMetaData {
  return {
    model: params.model,
    token: params.token,
    locale: params.locale,
    channel: params.channel,
    maxLen: params.maxLen,

    // 空的引用信息
    referenced_item_ids: [],
    referenced_brands: [],
    referenced_events: [],
    referenced_holiday: null,
    referenced_categories: [],
    mentioned_benefits: [],

    // 空的归因信息
    reference_reasons: {
      referenced_item_ids: {},
      referenced_events: {},
      referenced_brands: {},
    },

    reference_strength: {
      items: {},
      behaviors: {},
    },

    inferred_intent: 'unknown',
  };
}

export const metadataBuilderService = {
  buildMetaData,
  createFallbackMetaData,
};
