/**
 * 测试推荐策略服务
 * 运行: tsx server/src/test-recommendations.ts
 */

import { recommendationStrategyService, getLatestUserEvent } from './services/recommendation-strategy.service.js';
import { mockUserEvents } from './data/mock-events.js';

console.log('='.repeat(80));
console.log('测试推荐策略服务');
console.log('='.repeat(80));

// 测试所有用户
const userIds = Object.keys(mockUserEvents);

for (const userId of userIds) {
  console.log('\n' + '-'.repeat(80));
  console.log(`用户: ${userId}`);
  console.log('-'.repeat(80));

  // 获取用户最近事件
  const context = getLatestUserEvent(userId);
  if (!context) {
    console.log('  ❌ 没有找到用户事件');
    continue;
  }

  console.log(`  最近事件: ${context.triggerEvent.eventType}`);
  console.log(`  触发商品: ${context.triggerItem.title}`);
  console.log(`  商品类型: ${context.triggerItem.itemType}`);
  console.log(`  品牌: ${context.triggerItem.brand}`);
  console.log(`  类别: ${context.triggerItem.category}`);

  // 获取推荐
  const recommendations = recommendationStrategyService.getRecommendations(userId, 8);

  console.log(`\n  推荐商品数量: ${recommendations.length}`);
  console.log('  推荐列表:');

  recommendations.forEach((rec, index) => {
    console.log(`    ${index + 1}. [${rec.itemType}] ${rec.title}`);
    console.log(`       品牌: ${rec.brand}, 价格: $${rec.price}`);
    if (rec.compatibleBrands) {
      console.log(`       兼容品牌: ${rec.compatibleBrands.join(', ')}`);
    }
  });

  // 验证推荐策略
  if (context.triggerEvent.eventType === 'purchase' && context.triggerItem.itemType === 'device') {
    const hasOnlyAccessories = recommendations.every(r => r.itemType === 'accessory');
    if (hasOnlyAccessories) {
      console.log(`  ✅ 策略正确: 购买设备后只推荐配件`);
    } else {
      console.log(`  ❌ 策略错误: 购买设备后应该只推荐配件，但推荐了设备`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('测试完成');
console.log('='.repeat(80));
