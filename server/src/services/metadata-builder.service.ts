/**
 * MetaData Builder Service
 * 自动填充归因信息（reference_reasons, reference_strength, inferred_intent）
 */

import { ContentMetaData, Claims, UserSignals, Channel, Locale } from '../types/index.js';
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
    return { reason: '推荐商品', strength: 'weak' };
  }

  // 检查用户是否浏览过
  const viewCount = userSignals.recent_view || 0;
  const addToCartCount = userSignals.recent_add_to_cart || 0;
  const purchaseCount = userSignals.recent_purchase || 0;

  // 根据用户行为强度判断
  if (purchaseCount > 0) {
    return {
      reason: `用户购买过 ${item.title}`,
      strength: 'strong',
    };
  }

  if (addToCartCount > 0) {
    return {
      reason: `用户将 ${item.title} 加入购物车`,
      strength: 'strong',
    };
  }

  if (viewCount >= 3) {
    return {
      reason: `用户多次浏览过 ${item.title}（${viewCount}次）`,
      strength: 'medium',
    };
  }

  if (viewCount > 0) {
    return {
      reason: `用户浏览过 ${item.title}`,
      strength: 'medium',
    };
  }

  // 检查品牌匹配
  if (item.brand && userSignals.favorite_brands?.includes(item.brand)) {
    return {
      reason: `${item.brand} 是用户喜欢的品牌`,
      strength: 'medium',
    };
  }

  return {
    reason: `根据推荐算法推荐`,
    strength: 'weak',
  };
}

/**
 * 分析品牌引用原因
 */
function analyzeBrandReference(brand: string, userSignals: UserSignals): string {
  if (userSignals.favorite_brands?.includes(brand)) {
    return `${brand} 是用户偏好的品牌`;
  }

  if (userSignals.recent_purchase > 0) {
    return `用户曾购买过 ${brand} 的商品`;
  }

  return `${brand} 品牌推荐`;
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
          reason: `用户频繁浏览商品（${viewCount}次）`,
          strength: 'strong',
        };
      }
      return {
        reason: `用户浏览了商品`,
        strength: 'medium',
      };

    case 'add_to_cart':
      const cartCount = userSignals.recent_add_to_cart || 0;
      if (cartCount > 0) {
        return {
          reason: `用户将商品加入购物车（${cartCount}个）`,
          strength: 'strong',
        };
      }
      return {
        reason: `用户有加购行为`,
        strength: 'medium',
      };

    case 'purchase':
      const purchaseCount = userSignals.recent_purchase || 0;
      if (purchaseCount > 0) {
        return {
          reason: `用户购买了商品（${purchaseCount}个）`,
          strength: 'strong',
        };
      }
      return {
        reason: `用户有购买意向`,
        strength: 'medium',
      };

    default:
      return {
        reason: `用户行为：${event}`,
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
      return `复购 ${meta.referenced_brands[0]} 品牌商品`;
    }
    return '继续购买相关商品';
  }

  // 根据加购行为推断
  if (recent_add_to_cart > 0) {
    return '完成购物车中的商品购买';
  }

  // 根据浏览行为推断
  if (recent_view >= 5) {
    if (tags && tags.length > 0) {
      return `购买 ${tags[0]} 相关商品`;
    }
    return '购买浏览过的商品';
  }

  if (recent_view > 0) {
    return '探索感兴趣的商品';
  }

  // 新用户或无明显行为
  return '发现新商品';
}

export const metadataBuilderService = {
  buildMetaData,
};
