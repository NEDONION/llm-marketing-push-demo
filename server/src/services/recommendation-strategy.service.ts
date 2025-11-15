import { ExtendedEbayItem, mockItems } from '../data/mock-items.js';
import { mockUserEvents } from '../data/mock-events.js';

/**
 * 推荐策略服务
 * 根据用户行为类型（view / add_to_cart / purchase）选择不同的推荐策略
 */

export interface RecommendationContext {
  userId: string;
  triggerEvent: {
    eventType: 'view' | 'add_to_cart' | 'purchase';
    itemId: string;
    timestamp: string;
  };
  triggerItem: ExtendedEbayItem;
}

/**
 * 获取用户最近一次事件
 */
export function getLatestUserEvent(userId: string): RecommendationContext | null {
  const userEvents = mockUserEvents[userId];
  if (!userEvents || userEvents.events.length === 0) {
    return null;
  }

  // 获取最新事件
  const latestEvent = userEvents.events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const triggerItem = mockItems[latestEvent.itemId];
  if (!triggerItem || !triggerItem.isActive) {
    return null;
  }

  return {
    userId,
    triggerEvent: latestEvent,
    triggerItem
  };
}

/**
 * 为设备推荐配件
 * 策略：根据品牌、设备类别匹配配件
 */
function recommendAccessoriesForDevice(
  device: ExtendedEbayItem,
  limit: number = 10
): ExtendedEbayItem[] {
  const allAccessories = Object.values(mockItems)
    .filter(item => item.isActive && item.itemType === 'accessory');

  // 对配件进行评分
  const scored = allAccessories.map(accessory => {
    let score = 0;

    // 1. 品牌匹配（最高优先级）
    if (accessory.compatibleBrands?.includes(device.brand || '')) {
      score += 100;
    }

    // 2. 设备类别匹配
    if (accessory.deviceCategory === device.category) {
      score += 50;
    }

    // 3. 通用配件（兼容多个品牌）
    if (accessory.compatibleBrands && accessory.compatibleBrands.length > 2) {
      score += 10;
    }

    // 4. 价格区间匹配（配件价格应该低于设备价格）
    if (accessory.price < device.price * 0.3) {
      score += 5;
    }

    return { item: accessory, score };
  });

  // 按分数排序，返回前 N 个
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.item);
}

/**
 * 为浏览/加购事件推荐商品
 * 策略：推荐同类设备 + 少量相关配件
 */
function recommendForBrowsing(
  item: ExtendedEbayItem,
  limit: number = 10
): ExtendedEbayItem[] {
  const recommendations: ExtendedEbayItem[] = [];

  // 1. 如果浏览的是设备，推荐同类设备（60%）和配件（40%）
  if (item.itemType === 'device') {
    const similarDevices = Object.values(mockItems)
      .filter(i =>
        i.isActive &&
        i.itemType === 'device' &&
        i.itemId !== item.itemId && // 排除自己
        (i.category === item.category || i.brand === item.brand)
      )
      .slice(0, Math.ceil(limit * 0.6));

    const accessories = recommendAccessoriesForDevice(item, Math.ceil(limit * 0.4));

    recommendations.push(...similarDevices, ...accessories);
  }
  // 2. 如果浏览的是配件，推荐同类配件 + 同品牌其他配件
  else {
    const similarAccessories = Object.values(mockItems)
      .filter(i =>
        i.isActive &&
        i.itemType === 'accessory' &&
        i.itemId !== item.itemId &&
        (i.category === item.category ||
         i.brand === item.brand ||
         i.deviceCategory === item.deviceCategory)
      )
      .slice(0, limit);

    recommendations.push(...similarAccessories);
  }

  return recommendations.slice(0, limit);
}

/**
 * 根据用户行为生成推荐列表
 * 核心逻辑：
 * - purchase 设备 → 只推荐配件
 * - purchase 配件 → 推荐相关配件
 * - view/add_to_cart → 推荐同类商品 + 配件
 */
export function generateRecommendations(
  context: RecommendationContext,
  limit: number = 10
): ExtendedEbayItem[] {
  const { triggerEvent, triggerItem } = context;

  console.log(`[Recommendation] Event: ${triggerEvent.eventType}, Item: ${triggerItem.title}, Type: ${triggerItem.itemType}`);

  // 策略 1: 购买了设备 → 只推荐配件
  if (triggerEvent.eventType === 'purchase' && triggerItem.itemType === 'device') {
    console.log('[Recommendation] Strategy: Purchase Device → Recommend Accessories');
    return recommendAccessoriesForDevice(triggerItem, limit);
  }

  // 策略 2: 购买了配件 → 推荐相关配件
  if (triggerEvent.eventType === 'purchase' && triggerItem.itemType === 'accessory') {
    console.log('[Recommendation] Strategy: Purchase Accessory → Recommend Related Accessories');
    const relatedAccessories = Object.values(mockItems)
      .filter(i =>
        i.isActive &&
        i.itemType === 'accessory' &&
        i.itemId !== triggerItem.itemId &&
        (i.deviceCategory === triggerItem.deviceCategory ||
         i.brand === triggerItem.brand ||
         i.compatibleBrands?.some(b => triggerItem.compatibleBrands?.includes(b)))
      )
      .slice(0, limit);

    return relatedAccessories;
  }

  // 策略 3: 浏览或加购 → 推荐同类 + 配件
  console.log('[Recommendation] Strategy: View/AddToCart → Recommend Similar + Accessories');
  return recommendForBrowsing(triggerItem, limit);
}

/**
 * 便捷方法：直接获取用户推荐
 */
export function getRecommendationsForUser(
  userId: string,
  limit: number = 10
): ExtendedEbayItem[] {
  const context = getLatestUserEvent(userId);

  if (!context) {
    console.log(`[Recommendation] No context for user ${userId}, returning random items`);
    // 没有上下文，返回随机热门商品
    return Object.values(mockItems)
      .filter(item => item.isActive && item.itemType === 'device')
      .slice(0, limit);
  }

  return generateRecommendations(context, limit);
}

export class RecommendationStrategyService {
  getRecommendations(userId: string, limit: number = 10): ExtendedEbayItem[] {
    return getRecommendationsForUser(userId, limit);
  }

  getLatestEvent(userId: string): RecommendationContext | null {
    return getLatestUserEvent(userId);
  }
}

export const recommendationStrategyService = new RecommendationStrategyService();
