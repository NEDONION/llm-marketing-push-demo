import { EbayItem } from '../types/index.js';

/**
 * 扩展的商品类型，增加了设备/配件分类
 */
export interface ExtendedEbayItem extends EbayItem {
  itemType: 'device' | 'accessory';
  compatibleBrands?: string[]; // 配件兼容的品牌
  deviceCategory?: string; // 配件适用的设备类别
  keywords?: string[]; // 匹配关键词
}

/**
 * eBay 模拟商品数据
 * 包含设备和配件，用于演示智能推荐
 */
export const mockItems: Record<string, ExtendedEbayItem> = {
  // ========== 手机设备 ==========
  'v1|itm|phone_iphone_15_pro': {
    itemId: 'v1|itm|phone_iphone_15_pro',
    title: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium',
    price: 1199.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/iphone-15-pro.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['iphone', 'smartphone', 'ios', 'apple']
  },
  'v1|itm|phone_iphone_14': {
    itemId: 'v1|itm|phone_iphone_14',
    title: 'Apple iPhone 14 128GB - Midnight',
    price: 799.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/iphone-14.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['iphone', 'smartphone', 'ios', 'apple']
  },
  'v1|itm|phone_samsung_s24': {
    itemId: 'v1|itm|phone_samsung_s24',
    title: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black',
    price: 1299.99,
    currency: 'USD',
    brand: 'Samsung',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/samsung-s24.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['samsung', 'galaxy', 'android', 'smartphone']
  },
  'v1|itm|phone_samsung_s23': {
    itemId: 'v1|itm|phone_samsung_s23',
    title: 'Samsung Galaxy S23 256GB - Phantom Black',
    price: 899.99,
    currency: 'USD',
    brand: 'Samsung',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/samsung-s23.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['samsung', 'galaxy', 'android', 'smartphone']
  },
  'v1|itm|phone_pixel_8_pro': {
    itemId: 'v1|itm|phone_pixel_8_pro',
    title: 'Google Pixel 8 Pro 256GB - Obsidian',
    price: 999.00,
    currency: 'USD',
    brand: 'Google',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/pixel-8-pro.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['google', 'pixel', 'android', 'smartphone']
  },
  'v1|itm|phone_oneplus_12': {
    itemId: 'v1|itm|phone_oneplus_12',
    title: 'OnePlus 12 256GB - Flowy Emerald',
    price: 799.99,
    currency: 'USD',
    brand: 'OnePlus',
    category: 'Cell Phones & Smartphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/oneplus-12.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 4
    },
    keywords: ['oneplus', 'android', 'smartphone']
  },

  // ========== 手机配件 ==========
  'v1|itm|acc_iphone_case_clear': {
    itemId: 'v1|itm|acc_iphone_case_clear',
    title: 'Clear Case for iPhone 15 Pro Max - Shockproof Protection',
    price: 19.99,
    currency: 'USD',
    brand: 'Spigen',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/iphone-clear-case.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['case', 'cover', 'protection', 'iphone', 'clear']
  },
  'v1|itm|acc_iphone_case_leather': {
    itemId: 'v1|itm|acc_iphone_case_leather',
    title: 'Leather Wallet Case for iPhone 15 Pro - Black',
    price: 34.99,
    currency: 'USD',
    brand: 'Apple',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/iphone-leather-case.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['case', 'wallet', 'leather', 'iphone', 'card holder']
  },
  'v1|itm|acc_iphone_screen_protector': {
    itemId: 'v1|itm|acc_iphone_screen_protector',
    title: 'Tempered Glass Screen Protector for iPhone 15 Pro Max (2 Pack)',
    price: 12.99,
    currency: 'USD',
    brand: 'amFilm',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/screen-protector.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 1
    },
    keywords: ['screen protector', 'glass', 'iphone', 'protection']
  },
  'v1|itm|acc_samsung_case': {
    itemId: 'v1|itm|acc_samsung_case',
    title: 'Rugged Armor Case for Samsung Galaxy S24 Ultra',
    price: 24.99,
    currency: 'USD',
    brand: 'Spigen',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Samsung'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/samsung-case.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['case', 'cover', 'protection', 'samsung', 'galaxy']
  },
  'v1|itm|acc_samsung_screen_protector': {
    itemId: 'v1|itm|acc_samsung_screen_protector',
    title: 'Screen Protector for Samsung Galaxy S24 Ultra (3 Pack)',
    price: 14.99,
    currency: 'USD',
    brand: 'Whitestone',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Samsung'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/samsung-screen.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['screen protector', 'glass', 'samsung', 'galaxy']
  },
  'v1|itm|acc_usb_c_cable': {
    itemId: 'v1|itm|acc_usb_c_cable',
    title: 'USB-C to USB-C Fast Charging Cable 6ft (2 Pack)',
    price: 15.99,
    currency: 'USD',
    brand: 'Anker',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Samsung', 'Google', 'OnePlus'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/usb-c-cable.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 1
    },
    keywords: ['cable', 'charging', 'usb-c', 'fast charge']
  },
  'v1|itm|acc_wireless_charger': {
    itemId: 'v1|itm|acc_wireless_charger',
    title: 'Wireless Charging Pad - 15W Fast Charge',
    price: 29.99,
    currency: 'USD',
    brand: 'Anker',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Samsung', 'Google'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/wireless-charger.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['wireless charger', 'charging pad', 'qi charger']
  },
  'v1|itm|acc_magsafe_charger': {
    itemId: 'v1|itm|acc_magsafe_charger',
    title: 'MagSafe Compatible Wireless Charger for iPhone',
    price: 35.99,
    currency: 'USD',
    brand: 'Belkin',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/magsafe-charger.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['magsafe', 'wireless charger', 'iphone', 'magnetic']
  },
  'v1|itm|acc_car_mount': {
    itemId: 'v1|itm|acc_car_mount',
    title: 'Magnetic Car Phone Mount - Dashboard & Vent Clip',
    price: 18.99,
    currency: 'USD',
    brand: 'iOttie',
    category: 'Cell Phone Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Samsung', 'Google', 'OnePlus'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/car-mount.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['car mount', 'phone holder', 'magnetic', 'dashboard']
  },
  'v1|itm|acc_airpods_pro': {
    itemId: 'v1|itm|acc_airpods_pro',
    title: 'Apple AirPods Pro (2nd Generation) with USB-C',
    price: 249.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Headphones',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Cell Phones & Smartphones',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/airpods-pro.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['airpods', 'wireless', 'earbuds', 'iphone', 'apple']
  },

  // ========== 相机设备 ==========
  'v1|itm|camera_sony_a7iv': {
    itemId: 'v1|itm|camera_sony_a7iv',
    title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera Body',
    price: 2499.99,
    currency: 'USD',
    brand: 'Sony',
    category: 'Cameras & Photo',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-a7iv.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['camera', 'mirrorless', 'full-frame', 'sony', 'photography']
  },
  'v1|itm|camera_canon_r5': {
    itemId: 'v1|itm|camera_canon_r5',
    title: 'Canon EOS R5 Full-Frame Mirrorless Camera Body',
    price: 3899.00,
    currency: 'USD',
    brand: 'Canon',
    category: 'Cameras & Photo',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/canon-r5.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['camera', 'mirrorless', 'full-frame', 'canon', 'photography']
  },
  'v1|itm|camera_nikon_z9': {
    itemId: 'v1|itm|camera_nikon_z9',
    title: 'Nikon Z9 Professional Full-Frame Mirrorless Camera',
    price: 5499.99,
    currency: 'USD',
    brand: 'Nikon',
    category: 'Cameras & Photo',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/nikon-z9.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 5
    },
    keywords: ['camera', 'mirrorless', 'full-frame', 'nikon', 'professional']
  },
  'v1|itm|camera_fuji_xt5': {
    itemId: 'v1|itm|camera_fuji_xt5',
    title: 'Fujifilm X-T5 Mirrorless Camera Body - Black',
    price: 1699.00,
    currency: 'USD',
    brand: 'Fujifilm',
    category: 'Cameras & Photo',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/fuji-xt5.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['camera', 'mirrorless', 'fuji', 'photography', 'aps-c']
  },

  // ========== 镜头配件 ==========
  'v1|itm|lens_sony_50mm': {
    itemId: 'v1|itm|lens_sony_50mm',
    title: 'Sony FE 50mm f/1.8 Full Frame E-Mount Lens',
    price: 249.99,
    currency: 'USD',
    brand: 'Sony',
    category: 'Camera Lenses',
    itemType: 'accessory',
    compatibleBrands: ['Sony'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-50mm.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['lens', 'sony', '50mm', 'prime', 'portrait']
  },
  'v1|itm|lens_sony_2470mm': {
    itemId: 'v1|itm|lens_sony_2470mm',
    title: 'Sony FE 24-70mm f/2.8 GM II Zoom Lens',
    price: 2299.00,
    currency: 'USD',
    brand: 'Sony',
    category: 'Camera Lenses',
    itemType: 'accessory',
    compatibleBrands: ['Sony'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-2470.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['lens', 'sony', 'zoom', '24-70', 'gm']
  },
  'v1|itm|lens_canon_50mm': {
    itemId: 'v1|itm|lens_canon_50mm',
    title: 'Canon RF 50mm f/1.8 STM Lens',
    price: 199.00,
    currency: 'USD',
    brand: 'Canon',
    category: 'Camera Lenses',
    itemType: 'accessory',
    compatibleBrands: ['Canon'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/canon-50mm.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['lens', 'canon', '50mm', 'prime', 'portrait']
  },
  'v1|itm|lens_canon_2470mm': {
    itemId: 'v1|itm|lens_canon_2470mm',
    title: 'Canon RF 24-70mm f/2.8 L IS USM Lens',
    price: 2299.00,
    currency: 'USD',
    brand: 'Canon',
    category: 'Camera Lenses',
    itemType: 'accessory',
    compatibleBrands: ['Canon'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/canon-2470.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['lens', 'canon', 'zoom', '24-70', 'l-series']
  },
  'v1|itm|acc_camera_bag': {
    itemId: 'v1|itm|acc_camera_bag',
    title: 'Peak Design Everyday Backpack 20L - Camera & Laptop Bag',
    price: 259.95,
    currency: 'USD',
    brand: 'Peak Design',
    category: 'Camera & Photo Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Sony', 'Canon', 'Nikon', 'Fujifilm'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/camera-bag.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['camera bag', 'backpack', 'photography', 'protection']
  },
  'v1|itm|acc_tripod': {
    itemId: 'v1|itm|acc_tripod',
    title: 'Manfrotto Carbon Fiber Tripod with Ball Head',
    price: 349.99,
    currency: 'USD',
    brand: 'Manfrotto',
    category: 'Camera & Photo Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Sony', 'Canon', 'Nikon', 'Fujifilm'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/tripod.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['tripod', 'camera support', 'photography', 'stable']
  },
  'v1|itm|acc_sd_card': {
    itemId: 'v1|itm|acc_sd_card',
    title: 'SanDisk Extreme PRO 128GB SD Card UHS-II',
    price: 89.99,
    currency: 'USD',
    brand: 'SanDisk',
    category: 'Camera & Photo Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Sony', 'Canon', 'Nikon', 'Fujifilm'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sd-card.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 1
    },
    keywords: ['sd card', 'memory', 'storage', 'camera']
  },
  'v1|itm|acc_camera_battery': {
    itemId: 'v1|itm|acc_camera_battery',
    title: 'Extra Camera Battery + Dual Charger for Sony A7 Series',
    price: 69.99,
    currency: 'USD',
    brand: 'Wasabi',
    category: 'Camera & Photo Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Sony'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/camera-battery.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['battery', 'power', 'sony', 'camera', 'charger']
  },
  'v1|itm|acc_lens_filter': {
    itemId: 'v1|itm|acc_lens_filter',
    title: 'K&F Concept 77mm UV & CPL Filter Kit',
    price: 49.99,
    currency: 'USD',
    brand: 'K&F Concept',
    category: 'Camera & Photo Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Sony', 'Canon', 'Nikon', 'Fujifilm'],
    deviceCategory: 'Cameras & Photo',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/lens-filter.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['filter', 'lens', 'uv', 'cpl', 'protection']
  },

  // ========== 笔记本电脑设备 ==========
  'v1|itm|laptop_macbook_pro_16': {
    itemId: 'v1|itm|laptop_macbook_pro_16',
    title: 'Apple MacBook Pro 16" M3 Max Chip 36GB RAM 1TB SSD',
    price: 3499.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Laptops & Notebooks',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/macbook-pro-16.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['macbook', 'laptop', 'apple', 'm3', 'pro']
  },
  'v1|itm|laptop_macbook_air': {
    itemId: 'v1|itm|laptop_macbook_air',
    title: 'Apple MacBook Air 15" M3 Chip 16GB RAM 512GB SSD',
    price: 1499.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Laptops & Notebooks',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/macbook-air.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['macbook', 'laptop', 'apple', 'm3', 'air']
  },
  'v1|itm|laptop_dell_xps15': {
    itemId: 'v1|itm|laptop_dell_xps15',
    title: 'Dell XPS 15 - Intel i9, 32GB RAM, 1TB SSD, RTX 4060',
    price: 2799.00,
    currency: 'USD',
    brand: 'Dell',
    category: 'Laptops & Notebooks',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/dell-xps15.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 4
    },
    keywords: ['dell', 'xps', 'laptop', 'windows', 'intel']
  },
  'v1|itm|laptop_thinkpad_x1': {
    itemId: 'v1|itm|laptop_thinkpad_x1',
    title: 'Lenovo ThinkPad X1 Carbon Gen 12 - i7, 16GB, 512GB',
    price: 1899.00,
    currency: 'USD',
    brand: 'Lenovo',
    category: 'Laptops & Notebooks',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/thinkpad-x1.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['lenovo', 'thinkpad', 'laptop', 'business', 'windows']
  },

  // ========== 笔记本配件 ==========
  'v1|itm|acc_laptop_sleeve': {
    itemId: 'v1|itm|acc_laptop_sleeve',
    title: 'Laptop Sleeve 16" - Premium Leather with Accessory Pouch',
    price: 49.99,
    currency: 'USD',
    brand: 'Bellroy',
    category: 'Laptop Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Dell', 'Lenovo'],
    deviceCategory: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/laptop-sleeve.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['laptop sleeve', 'case', 'protection', 'leather']
  },
  'v1|itm|acc_laptop_stand': {
    itemId: 'v1|itm|acc_laptop_stand',
    title: 'Adjustable Aluminum Laptop Stand - Ergonomic Design',
    price: 39.99,
    currency: 'USD',
    brand: 'Rain Design',
    category: 'Laptop Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Dell', 'Lenovo'],
    deviceCategory: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/laptop-stand.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['laptop stand', 'ergonomic', 'aluminum', 'desk']
  },
  'v1|itm|acc_usb_hub': {
    itemId: 'v1|itm|acc_usb_hub',
    title: 'USB-C Hub 7-in-1 with HDMI, USB 3.0, SD Card Reader',
    price: 59.99,
    currency: 'USD',
    brand: 'Anker',
    category: 'Laptop Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Dell', 'Lenovo'],
    deviceCategory: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/usb-hub.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['usb-c hub', 'adapter', 'hdmi', 'dongle']
  },
  'v1|itm|acc_wireless_mouse': {
    itemId: 'v1|itm|acc_wireless_mouse',
    title: 'Logitech MX Master 3S Wireless Mouse',
    price: 99.99,
    currency: 'USD',
    brand: 'Logitech',
    category: 'Laptop Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Dell', 'Lenovo'],
    deviceCategory: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/mx-master.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['mouse', 'wireless', 'logitech', 'ergonomic']
  },
  'v1|itm|acc_mechanical_keyboard': {
    itemId: 'v1|itm|acc_mechanical_keyboard',
    title: 'Keychron K8 Wireless Mechanical Keyboard',
    price: 89.99,
    currency: 'USD',
    brand: 'Keychron',
    category: 'Laptop Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple', 'Dell', 'Lenovo'],
    deviceCategory: 'Laptops & Notebooks',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/keychron-k8.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['keyboard', 'mechanical', 'wireless', 'keychron']
  },

  // ========== 耳机设备 ==========
  'v1|itm|headphone_sony_xm5': {
    itemId: 'v1|itm|headphone_sony_xm5',
    title: 'Sony WH-1000XM5 Noise Cancelling Wireless Headphones',
    price: 399.99,
    currency: 'USD',
    brand: 'Sony',
    category: 'Headphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/sony-xm5.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['headphones', 'wireless', 'noise cancelling', 'sony']
  },
  'v1|itm|headphone_bose_qc45': {
    itemId: 'v1|itm|headphone_bose_qc45',
    title: 'Bose QuietComfort 45 Noise Cancelling Headphones',
    price: 329.00,
    currency: 'USD',
    brand: 'Bose',
    category: 'Headphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/bose-qc45.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['headphones', 'wireless', 'noise cancelling', 'bose']
  },
  'v1|itm|headphone_airpods_max': {
    itemId: 'v1|itm|headphone_airpods_max',
    title: 'Apple AirPods Max - Space Gray',
    price: 549.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Headphones',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/airpods-max.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['headphones', 'wireless', 'airpods', 'apple', 'premium']
  },

  // ========== 智能手表设备 ==========
  'v1|itm|watch_apple_watch_ultra': {
    itemId: 'v1|itm|watch_apple_watch_ultra',
    title: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
    price: 799.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Smart Watches',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/apple-watch-ultra.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['smartwatch', 'apple watch', 'fitness', 'gps']
  },
  'v1|itm|watch_galaxy_watch': {
    itemId: 'v1|itm|watch_galaxy_watch',
    title: 'Samsung Galaxy Watch 6 Classic 47mm',
    price: 399.99,
    currency: 'USD',
    brand: 'Samsung',
    category: 'Smart Watches',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/galaxy-watch.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 3
    },
    keywords: ['smartwatch', 'samsung', 'galaxy watch', 'fitness']
  },

  // ========== 智能手表配件 ==========
  'v1|itm|acc_watch_band_sport': {
    itemId: 'v1|itm|acc_watch_band_sport',
    title: 'Sport Band for Apple Watch Ultra - Ocean Blue',
    price: 49.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Smart Watch Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Smart Watches',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/watch-band.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['watch band', 'apple watch', 'sport', 'strap']
  },
  'v1|itm|acc_watch_charger': {
    itemId: 'v1|itm|acc_watch_charger',
    title: 'Fast Charging Dock for Apple Watch',
    price: 29.99,
    currency: 'USD',
    brand: 'Belkin',
    category: 'Smart Watch Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Smart Watches',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/watch-charger.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['watch charger', 'apple watch', 'charging dock']
  },

  // ========== 其他设备 ==========
  'v1|itm|tablet_ipad_pro': {
    itemId: 'v1|itm|tablet_ipad_pro',
    title: 'Apple iPad Pro 12.9" M2 Chip 256GB Wi-Fi',
    price: 1099.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Tablets & eReaders',
    itemType: 'device',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/ipad-pro.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['ipad', 'tablet', 'apple', 'm2', 'pro']
  },
  'v1|itm|acc_apple_pencil': {
    itemId: 'v1|itm|acc_apple_pencil',
    title: 'Apple Pencil (2nd Generation)',
    price: 129.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Tablet Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Tablets & eReaders',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/apple-pencil.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['apple pencil', 'stylus', 'ipad', 'drawing']
  },
  'v1|itm|acc_ipad_keyboard': {
    itemId: 'v1|itm|acc_ipad_keyboard',
    title: 'Magic Keyboard for iPad Pro 12.9" - Black',
    price: 349.00,
    currency: 'USD',
    brand: 'Apple',
    category: 'Tablet Accessories',
    itemType: 'accessory',
    compatibleBrands: ['Apple'],
    deviceCategory: 'Tablets & eReaders',
    isActive: true,
    imageUrl: 'https://i.ebayimg.com/images/g/magic-keyboard.jpg',
    shippingInfo: {
      freeShipping: true,
      estimatedDays: 2
    },
    keywords: ['keyboard', 'ipad', 'magic keyboard', 'case']
  },

  // ========== 测试用商品 ==========
  'v1|itm|999': {
    itemId: 'v1|itm|999',
    title: 'Discontinued Item - Test',
    price: 99.99,
    currency: 'USD',
    brand: 'Unknown',
    category: 'Test',
    itemType: 'device',
    isActive: false,  // 已下架
    imageUrl: '',
    shippingInfo: {
      freeShipping: false
    },
    keywords: ['test']
  }
};
