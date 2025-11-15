import { EbayItem } from '../types/index.js';

/**
 * eBay 模拟商品数据
 * 在实际应用中，这些数据应该来自 eBay API
 */
export const mockItems: Record<string, EbayItem> = {
  'v1|itm|001': {
    itemId: 'v1|itm|001',
    title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera',
    price: 2499.99,
    currency: 'USD',
    brand: 'Sony',
    category: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-a7iv.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    }
  },
  'v1|itm|002': {
    itemId: 'v1|itm|002',
    title: 'Canon EF 50mm f/1.8 STM Lens',
    price: 125.00,
    currency: 'USD',
    brand: 'Canon',
    category: 'Camera Lenses',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/canon-50mm.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    }
  },
  'v1|itm|003': {
    itemId: 'v1|itm|003',
    title: 'Nikon Z9 Professional Full-Frame Mirrorless Camera',
    price: 5499.99,
    currency: 'USD',
    brand: 'Nikon',
    category: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/nikon-z9.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 5
    }
  },
  'v1|itm|004': {
    itemId: 'v1|itm|004',
    title: 'Apple iPhone 15 Pro Max 256GB',
    price: 1199.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/iphone-15-pro.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    }
  },
  'v1|itm|005': {
    itemId: 'v1|itm|005',
    title: 'Samsung Galaxy S24 Ultra 512GB',
    price: 1299.99,
    currency: 'USD',
    brand: 'Samsung',
    category: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/samsung-s24.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    }
  },
  'v1|itm|006': {
    itemId: 'v1|itm|006',
    title: 'DJI Mavic 3 Pro Drone with Camera',
    price: 2199.00,
    currency: 'USD',
    brand: 'DJI',
    category: 'Cameras & Drones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/dji-mavic3.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 4
    }
  },
  'v1|itm|007': {
    itemId: 'v1|itm|007',
    title: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    price: 399.99,
    currency: 'USD',
    brand: 'Sony',
    category: 'Headphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-xm5.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    }
  },
  'v1|itm|008': {
    itemId: 'v1|itm|008',
    title: 'Apple MacBook Pro 16" M3 Max Chip',
    price: 3499.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/macbook-pro-16.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    }
  },
  'v1|itm|009': {
    itemId: 'v1|itm|009',
    title: 'GoPro HERO 12 Black Action Camera',
    price: 399.99,
    currency: 'USD',
    brand: 'GoPro',
    category: 'Camcorders',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/gopro-hero12.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    }
  },
  'v1|itm|010': {
    itemId: 'v1|itm|010',
    title: 'Bose QuietComfort 45 Noise Cancelling Headphones',
    price: 329.00,
    currency: 'USD',
    brand: 'Bose',
    category: 'Headphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/bose-qc45.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    }
  },
  // 添加一个已下架的商品用于测试
  'v1|itm|999': {
    itemId: 'v1|itm|999',
    title: 'Discontinued Item - Test',
    price: 99.99,
    currency: 'USD',
    brand: 'Unknown',
    category: 'Test',
    isActive: false,  // 已下架
    imageUrl: '',
    shippingInfo: {
      freeShipping: false
    }
  }
};

// 模拟用户事件数据
export interface MockUserEvents {
  userId: string;
  events: Array<{
    eventType: 'view' | 'add_to_cart' | 'purchase';
    itemId: string;
    timestamp: string;
  }>;
}

export const mockUserEvents: Record<string, MockUserEvents> = {
  'user_001': {
    userId: 'user_001',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|001',
        timestamp: '2025-11-10T10:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|002',
        timestamp: '2025-11-10T10:05:00Z'
      },
      {
        eventType: 'add_to_cart',
        itemId: 'v1|itm|001',
        timestamp: '2025-11-10T10:30:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|007',
        timestamp: '2025-11-12T14:00:00Z'
      },
    ]
  },
  'user_002': {
    userId: 'user_002',
    events: [
      {
        eventType: 'view',
        itemId: 'v1|itm|004',
        timestamp: '2025-11-11T09:00:00Z'
      },
      {
        eventType: 'view',
        itemId: 'v1|itm|005',
        timestamp: '2025-11-11T09:15:00Z'
      },
      {
        eventType: 'purchase',
        itemId: 'v1|itm|004',
        timestamp: '2025-11-11T10:00:00Z'
      },
    ]
  }
};

// 节日/促销活动数据
export interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
  locale: string;
}

export const holidays: Holiday[] = [
  {
    name: 'Black Friday',
    startDate: '2025-11-28',
    endDate: '2025-11-29',
    locale: 'en-US'
  },
  {
    name: 'Cyber Monday',
    startDate: '2025-12-01',
    endDate: '2025-12-02',
    locale: 'en-US'
  },
  {
    name: 'Singles Day',
    startDate: '2025-11-11',
    endDate: '2025-11-11',
    locale: 'en-US'
  },
  {
    name: 'Christmas',
    startDate: '2025-12-24',
    endDate: '2025-12-25',
    locale: 'en-US'
  },
  {
    name: 'New Year',
    startDate: '2025-12-31',
    endDate: '2026-01-01',
    locale: 'en-US'
  },
];
