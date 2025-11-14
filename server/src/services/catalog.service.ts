import { EbayItem, UserSignals } from '../types';
import { mockItems, mockUserEvents, holidays, Holiday } from '../data/mock-items';

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
   * 获取推荐商品（基于用户历史）
   */
  async getRecommendedItems(userId: string, limit: number = 5): Promise<EbayItem[]> {
    const userSignals = this.generateUserSignals(userId);
    const allItems = Object.values(mockItems).filter(item => item.isActive);

    // 简单推荐算法：基于用户喜欢的品牌和分类
    const scored = allItems.map(item => {
      let score = 0;

      // 品牌匹配
      if (item.brand && userSignals.favorite_brands?.includes(item.brand)) {
        score += 10;
      }

      // 分类匹配
      if (userSignals.tags.includes(item.category)) {
        score += 5;
      }

      return { item, score };
    });

    // 按分数排序并返回
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const catalogService = new CatalogService();
