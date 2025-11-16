import { ExtendedEbayItem, mockItems } from '../../data/mock-items.js';
import { mockUserEvents } from '../../data/mock-events.js';

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
 * 用户行为聚合模式
 */
export interface UserBehaviorPattern {
  userId: string;
  // 最高优先级事件（购买 > 加购 > 浏览）
  primaryEvent: {
    eventType: 'view' | 'add_to_cart' | 'purchase';
    itemId: string;
    timestamp: string;
  };
  primaryItem: ExtendedEbayItem;

  // 用户行为统计（近7天）
  categoryInterest: Map<string, number>; // category -> view count
  brandInterest: Map<string, number>;     // brand -> view count
  itemTypeInterest: Map<string, number>;  // device/accessory -> count

  // 所有浏览过的商品（用于去重）
  viewedItemIds: Set<string>;
}

/**
 * 获取用户行为聚合模式（智能推荐核心）
 *
 * 策略：
 * 1. 优先级：purchase > add_to_cart > view
 * 2. 聚合用户浏览历史，分析类别/品牌兴趣
 * 3. 对于只有浏览行为的用户，选择最感兴趣的类别作为推荐依据
 */
export function getUserBehaviorPattern(userId: string, days: number = 7): UserBehaviorPattern | null {
  const userEvents = mockUserEvents[userId];
  if (!userEvents || userEvents.events.length === 0) {
    return null;
  }

  // 过滤最近N天的事件
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentEvents = userEvents.events.filter(e => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= cutoffDate;
  });

  if (recentEvents.length === 0) {
    return null;
  }

  // 统计用户兴趣
  const categoryInterest = new Map<string, number>();
  const brandInterest = new Map<string, number>();
  const itemTypeInterest = new Map<string, number>();
  const viewedItemIds = new Set<string>();

  // 按优先级查找主要事件：purchase > add_to_cart > view
  let primaryEvent = null;

  // 优先查找购买事件
  const purchaseEvents = recentEvents.filter(e => e.eventType === 'purchase');
  if (purchaseEvents.length > 0) {
    // 取最近的购买
    primaryEvent = purchaseEvents.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }

  // 其次查找加购事件
  if (!primaryEvent) {
    const cartEvents = recentEvents.filter(e => e.eventType === 'add_to_cart');
    if (cartEvents.length > 0) {
      primaryEvent = cartEvents.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    }
  }

  // 最后使用浏览事件，但要基于聚合兴趣选择
  if (!primaryEvent) {
    const viewEvents = recentEvents.filter(e => e.eventType === 'view');

    // 先统计所有浏览事件的类别兴趣
    viewEvents.forEach(event => {
      const item = mockItems[event.itemId];
      if (item && item.isActive) {
        viewedItemIds.add(event.itemId);

        // 统计类别兴趣
        const category = item.category;
        categoryInterest.set(category, (categoryInterest.get(category) || 0) + 1);

        // 统计品牌兴趣
        if (item.brand) {
          brandInterest.set(item.brand, (brandInterest.get(item.brand) || 0) + 1);
        }

        // 统计商品类型兴趣
        const itemType = item.itemType;
        itemTypeInterest.set(itemType, (itemTypeInterest.get(itemType) || 0) + 1);
      }
    });

    // 找到用户最感兴趣的类别
    const topCategory = Array.from(categoryInterest.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (topCategory) {
      // 在最感兴趣的类别中，选择最近浏览的商品作为主事件
      const topCategoryEvents = viewEvents.filter(e => {
        const item = mockItems[e.itemId];
        return item && item.category === topCategory;
      }).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (topCategoryEvents.length > 0) {
        primaryEvent = topCategoryEvents[0];
      }
    }

    // 如果还没找到，取最近的浏览
    if (!primaryEvent && viewEvents.length > 0) {
      primaryEvent = viewEvents.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    }
  }

  if (!primaryEvent) {
    return null;
  }

  const primaryItem = mockItems[primaryEvent.itemId];
  if (!primaryItem || !primaryItem.isActive) {
    return null;
  }

  // 如果主事件不是浏览事件，也要统计其他浏览数据
  if (primaryEvent.eventType !== 'view') {
    recentEvents.filter(e => e.eventType === 'view').forEach(event => {
      const item = mockItems[event.itemId];
      if (item && item.isActive) {
        viewedItemIds.add(event.itemId);

        const category = item.category;
        categoryInterest.set(category, (categoryInterest.get(category) || 0) + 1);

        if (item.brand) {
          brandInterest.set(item.brand, (brandInterest.get(item.brand) || 0) + 1);
        }

        const itemType = item.itemType;
        itemTypeInterest.set(itemType, (itemTypeInterest.get(itemType) || 0) + 1);
      }
    });
  }

  console.log(`[Pattern] User ${userId}:`);
  console.log(`  Primary: ${primaryEvent.eventType} - ${primaryItem.title} (${primaryItem.category})`);
  console.log(`  Category Interest:`, Object.fromEntries(categoryInterest));
  console.log(`  Brand Interest:`, Object.fromEntries(brandInterest));

  return {
    userId,
    primaryEvent,
    primaryItem,
    categoryInterest,
    brandInterest,
    itemTypeInterest,
    viewedItemIds
  };
}

/**
 * 获取用户最近一次事件（保留旧方法兼容性）
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
 * 策略：推荐同类设备（优先类别匹配）+ 少量相关配件
 */
function recommendForBrowsing(
  item: ExtendedEbayItem,
  limit: number = 10
): ExtendedEbayItem[] {
  const recommendations: ExtendedEbayItem[] = [];

  // 1. 如果浏览的是设备，推荐同类设备（60%）和配件（40%）
  if (item.itemType === 'device') {
    // 对设备进行评分，优先类别匹配，其次品牌匹配
    const allDevices = Object.values(mockItems)
      .filter(i =>
        i.isActive &&
        i.itemType === 'device' &&
        i.itemId !== item.itemId // 排除自己
      );

    const scoredDevices = allDevices.map(device => {
      let score = 0;

      // 类别完全匹配（最高优先级）
      if (device.category === item.category) {
        score += 100;
      }

      // 品牌匹配（次优先级）
      if (device.brand === item.brand) {
        score += 30;
      }

      // 价格区间相似（加分项）
      const priceDiff = Math.abs(device.price - item.price);
      if (priceDiff < item.price * 0.3) {
        score += 10;
      }

      return { item: device, score };
    });

    const similarDevices = scoredDevices
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(limit * 0.6))
      .map(s => s.item);

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
 * 便捷方法：直接获取用户推荐（使用聚合行为模式）
 */
export function getRecommendationsForUser(
  userId: string,
  limit: number = 10
): ExtendedEbayItem[] {
  const pattern = getUserBehaviorPattern(userId);

  if (!pattern) {
    console.log(`[Recommendation] No pattern for user ${userId}, returning random items`);
    // 没有上下文，返回随机热门商品
    return Object.values(mockItems)
      .filter(item => item.isActive && item.itemType === 'device')
      .slice(0, limit);
  }

  // 转换为 RecommendationContext 以复用现有逻辑
  const context: RecommendationContext = {
    userId: pattern.userId,
    triggerEvent: pattern.primaryEvent,
    triggerItem: pattern.primaryItem
  };

  const recommendations = generateRecommendations(context, limit);

  // 智能去重策略：
  // 1. 如果是浏览行为，允许推荐同类别的已浏览商品（用户在比较）
  // 2. 如果是购买/加购行为，过滤掉所有已浏览的商品
  const isPurchaseOrCart = pattern.primaryEvent.eventType === 'purchase' ||
                          pattern.primaryEvent.eventType === 'add_to_cart';
  const primaryCategory = pattern.primaryItem.category;

  const freshRecommendations = recommendations.filter(item => {
    const isViewed = pattern.viewedItemIds.has(item.itemId);

    if (!isViewed) {
      return true; // 未浏览的商品，保留
    }

    // 已浏览的商品：
    // - 如果是浏览行为 + 同类别 → 保留（用户在比较同类商品）
    // - 否则 → 过滤掉
    if (!isPurchaseOrCart && item.category === primaryCategory) {
      return true;
    }

    return false;
  });

  // 如果过滤后太少，补充一些已浏览的
  if (freshRecommendations.length < limit / 2) {
    return recommendations.slice(0, limit);
  }

  return freshRecommendations.slice(0, limit);
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
