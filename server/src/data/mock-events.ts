/**
 * 用户行为事件数据
 */
export interface MockUserEvents {
  userId: string;
  events: Array<{
    eventType: 'view' | 'add_to_cart' | 'purchase';
    itemId: string;
    timestamp: string;
  }>;
}

export const mockUserEvents: Record<string, MockUserEvents> = {
  // 用户1: 浏览了相机，加入购物车但未购买
  'user_001': {
    userId: 'user_001',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|camera_sony_a7iv',
        timestamp: '2025-11-10T10:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|lens_sony_50mm',
        timestamp: '2025-11-10T10:05:00Z'
      },
      {
        eventType: 'add_to_cart',
        itemId: 'v1|itm|camera_sony_a7iv',
        timestamp: '2025-11-10T10:30:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|headphone_sony_xm5',
        timestamp: '2025-11-12T14:00:00Z'
      },
    ]
  },

  // 用户2: 购买了 iPhone，应该推荐配件
  'user_002': {
    userId: 'user_002',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_iphone_15_pro',
        timestamp: '2025-11-11T09:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_samsung_s24',
        timestamp: '2025-11-11T09:15:00Z'
      },
      {
        eventType: 'purchase',
        itemId: 'v1|itm|phone_iphone_15_pro',
        timestamp: '2025-11-11T10:00:00Z'
      },
    ]
  },

  // 用户3: 购买了 Samsung 手机，应该推荐配件
  'user_003': {
    userId: 'user_003',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_samsung_s24',
        timestamp: '2025-11-12T14:00:00Z'
      },
      {
        eventType: 'add_to_cart',
        itemId: 'v1|itm|phone_samsung_s24',
        timestamp: '2025-11-12T14:15:00Z'
      },
      {
        eventType: 'purchase',
        itemId: 'v1|itm|phone_samsung_s24',
        timestamp: '2025-11-12T14:30:00Z'
      },
    ]
  },

  // 用户4: 购买了相机，应该推荐镜头、包、三脚架等配件
  'user_004': {
    userId: 'user_004',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|camera_canon_r5',
        timestamp: '2025-11-13T10:00:00Z'
      },
      {
        eventType: 'purchase',
        itemId: 'v1|itm|camera_canon_r5',
        timestamp: '2025-11-13T11:00:00Z'
      },
    ]
  },

  // 用户5: 只是浏览手机，还没决定买
  'user_005': {
    userId: 'user_005',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_iphone_15_pro',
        timestamp: '2025-11-13T15:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_pixel_8_pro',
        timestamp: '2025-11-13T15:10:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|phone_oneplus_12',
        timestamp: '2025-11-13T15:20:00Z'
      },
    ]
  },

  // 用户6: 购买了笔记本电脑，应该推荐鼠标、包、扩展坞等
  'user_006': {
    userId: 'user_006',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|laptop_macbook_pro_16',
        timestamp: '2025-11-14T09:00:00Z'
      },
      {
        eventType: 'purchase',
        itemId: 'v1|itm|laptop_macbook_pro_16',
        timestamp: '2025-11-14T10:00:00Z'
      },
    ]
  },

  // 用户7: 浏览耳机
  'user_007': {
    userId: 'user_007',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|headphone_sony_xm5',
        timestamp: '2025-11-14T11:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|headphone_bose_qc45',
        timestamp: '2025-11-14T11:10:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|headphone_airpods_max',
        timestamp: '2025-11-14T11:20:00Z'
      },
    ]
  }
};
