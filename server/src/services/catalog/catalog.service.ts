import { EbayItem, UserSignals } from '../../types/index.js';
import { mockItems, ExtendedEbayItem } from '../../data/mock-items.js';
import { mockUserEvents } from '../../data/mock-events.js';
import { holidays, Holiday } from '../../data/mock-holidays.js';
import { recommendationStrategyService } from '../recommendation/recommendation-strategy.service.js';

/**
 * 商品目录服务
 * 在实际应用中，这应该调用 eBay API
 */
export class CatalogService {
  /**
   * 获取商品信息
   */
  async getItem(itemId: string): Promise<EbayItem | null> {
    // 模拟 API 延迟
    await this.delay(10);

    return mockItems[itemId] || null;
  }

  /**
   * 批量获取商品信息
   */
  async getItems(itemIds: string[]): Promise<Map<string, EbayItem>> {
    const result = new Map<string, EbayItem>();

    for (const itemId of itemIds) {
      const item = await this.getItem(itemId);
      if (item) {
        result.set(itemId, item);
      }
    }

    return result;
  }

  /**
   * 检查商品是否有效
   */
  async isItemValid(itemId: string): Promise<boolean> {
    const item = await this.getItem(itemId);
    return item !== null && item.isActive;
  }

  /**
   * 获取用户历史事件
   */
  getUserEvents(userId: string, days: number = 7): Array<{
    eventType: 'view' | 'add_to_cart' | 'purchase';
    itemId: string;
    timestamp: string;
  }> {
    const userEvents = mockUserEvents[userId];
    if (!userEvents) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return userEvents.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= cutoffDate;
    });
  }

  /**
   * 生成用户信号
   */
  generateUserSignals(userId: string): UserSignals {
    const events7d = this.getUserEvents(userId, 7);
    const events14d = this.getUserEvents(userId, 14);

    const viewCount = events7d.filter(e => e.eventType === 'view').length;
    const cartCount = events7d.filter(e => e.eventType === 'add_to_cart').length;
    const purchaseCount = events7d.filter(e => e.eventType === 'purchase').length;

    // 提取用户浏览过的商品品牌和分类作为标签
    const tags = new Set<string>();
    const brands = new Set<string>();

    events14d.forEach(event => {
      const item = mockItems[event.itemId];
      if (item) {
        if (item.brand) brands.add(item.brand);
        tags.add(item.category);
      }
    });

    return {
      recent_view: viewCount,
      recent_add_to_cart: cartCount,
      recent_purchase: purchaseCount,
      tags: Array.from(tags),
      favorite_brands: Array.from(brands)
    };
  }

  /**
   * 检查节日是否在有效窗口内
   */
  isHolidayValid(holidayName: string, currentDate: Date, locale: string = 'en-US'): boolean {
    const holiday = holidays.find(h =>
      h.name === holidayName && h.locale === locale
    );

    if (!holiday) return false;

    const start = new Date(holiday.startDate);
    const end = new Date(holiday.endDate);

    // 扩展窗口：节日前3天到节日后1天
    start.setDate(start.getDate() - 3);
    end.setDate(end.getDate() + 1);

    return currentDate >= start && currentDate <= end;
  }

  /**
   * 获取当前有效的节日
   */
  getCurrentHolidays(locale: string = 'en-US'): Holiday[] {
    const now = new Date();
    return holidays.filter(h =>
      h.locale === locale && this.isHolidayValid(h.name, now, locale)
    );
  }

  /**
   * 获取推荐商品（基于用户最近行为和智能策略）
   *
   * 新推荐策略：
   * - purchase 设备 → 推荐配件
   * - purchase 配件 → 推荐相关配件
   * - view/add_to_cart → 推荐同类商品 + 配件
   *
   * 限制候选数量在 5-10 个之间，避免 LLM prompt 过大
   */
  async getRecommendedItems(userId: string, limit: number = 10): Promise<EbayItem[]> {
    // 模拟 API 延迟
    await this.delay(10);

    // 使用智能推荐策略
    const recommendations = recommendationStrategyService.getRecommendations(
      userId,
      Math.min(limit, 10) // 最多 10 个候选
    );

    // 如果推荐数量太少，补充一些热门商品
    if (recommendations.length < 5) {
      const userSignals = this.generateUserSignals(userId);
      const fallbackItems = Object.values(mockItems)
        .filter(item =>
          item.isActive &&
          !recommendations.some(r => r.itemId === item.itemId) &&
          (item.brand && userSignals.favorite_brands?.includes(item.brand) ||
           userSignals.tags.includes(item.category))
        )
        .slice(0, 5 - recommendations.length);

      recommendations.push(...fallbackItems);
    }

    // 确保返回 5-10 个商品
    const finalCount = Math.max(5, Math.min(recommendations.length, 10));
    return recommendations.slice(0, finalCount);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const catalogService = new CatalogService();
