/**
 * 生产环境限流服务
 * 限制：每天最多 10 次 API 调用
 */
export class RateLimiterService {
  private callCount: number = 0;
  private lastResetDate: string;
  private readonly MAX_CALLS_PER_DAY = 10;
  private readonly isProduction: boolean;

  constructor() {
    // 判断是否为生产环境
    this.isProduction = process.env.NODE_ENV === 'production';
    this.lastResetDate = this.getCurrentDate();

    console.log(`🔒 Rate Limiter 已启动 (${this.isProduction ? '生产环境' : '开发环境'})`);
    if (this.isProduction) {
      console.log(`   限制: ${this.MAX_CALLS_PER_DAY} 次/天`);
    } else {
      console.log('   开发环境无限制');
    }
  }

  /**
   * 检查是否允许调用
   */
  checkLimit(): { allowed: boolean; remaining: number; resetAt: string } {
    // 开发环境不限制
    if (!this.isProduction) {
      return {
        allowed: true,
        remaining: 999,
        resetAt: 'N/A (开发环境)'
      };
    }

    // 检查日期，如果是新的一天则重置计数器
    const currentDate = this.getCurrentDate();
    if (currentDate !== this.lastResetDate) {
      this.resetCounter();
      this.lastResetDate = currentDate;
    }

    // 检查是否超出限制
    const allowed = this.callCount < this.MAX_CALLS_PER_DAY;
    const remaining = Math.max(0, this.MAX_CALLS_PER_DAY - this.callCount);
    const resetAt = this.getNextResetTime();

    return { allowed, remaining, resetAt };
  }

  /**
   * 记录一次调用
   */
  recordCall(): void {
    if (this.isProduction) {
      this.callCount++;
      console.log(`📊 API 调用计数: ${this.callCount}/${this.MAX_CALLS_PER_DAY}`);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    const currentDate = this.getCurrentDate();
    if (currentDate !== this.lastResetDate && this.isProduction) {
      this.resetCounter();
      this.lastResetDate = currentDate;
    }

    return {
      isProduction: this.isProduction,
      callCount: this.callCount,
      maxCalls: this.MAX_CALLS_PER_DAY,
      remaining: Math.max(0, this.MAX_CALLS_PER_DAY - this.callCount),
      resetAt: this.getNextResetTime(),
      lastResetDate: this.lastResetDate
    };
  }

  /**
   * 重置计数器（仅供测试使用）
   */
  reset(): void {
    this.callCount = 0;
    this.lastResetDate = this.getCurrentDate();
    console.log('🔄 Rate Limiter 已重置');
  }

  /**
   * 获取当前日期字符串 (YYYY-MM-DD)
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取下次重置时间
   */
  private getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 重置计数器
   */
  private resetCounter(): void {
    this.callCount = 0;
    if (this.isProduction) {
      console.log('🔄 每日限制已重置');
    }
  }
}

// 单例实例
export const rateLimiterService = new RateLimiterService();
