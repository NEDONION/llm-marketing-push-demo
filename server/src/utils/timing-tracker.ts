import { AsyncLocalStorage } from 'async_hooks';

export interface TimingInfo {
  total: number;
  llm?: number;
  verification?: number;
  catalog?: number;
  breakdown?: Record<string, number>;
}

interface TimingContext {
  startTime: number;
  breakdown: Record<string, number>;
}

const asyncLocalStorage = new AsyncLocalStorage<TimingContext>();

/**
 * 初始化时间追踪上下文（在请求开始时调用）
 */
export function initTimingContext<T>(fn: () => Promise<T>): Promise<T> {
  const context: TimingContext = {
    startTime: Date.now(),
    breakdown: {},
  };
  return asyncLocalStorage.run(context, fn);
}

/**
 * 追踪异步函数执行时间
 * @param name 步骤名称（如 'llm', 'verification', 'catalog' 等）
 * @param fn 要执行的异步函数
 */
export async function track<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const context = asyncLocalStorage.getStore();
  if (!context) {
    // 如果没有上下文，直接执行函数
    return fn();
  }

  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    context.breakdown[name] = (context.breakdown[name] || 0) + duration;
  }
}

/**
 * 获取当前的时间信息
 */
export function getTimingInfo(): TimingInfo | undefined {
  const context = asyncLocalStorage.getStore();
  if (!context) {
    return undefined;
  }

  const total = Date.now() - context.startTime;
  const { breakdown } = context;

  // 计算聚合时间
  const llm = (breakdown.promptBuild || 0) + (breakdown.llmGenerate || 0);
  const verification = breakdown.verification;
  const catalog = breakdown.catalog;

  return {
    total,
    llm: llm > 0 ? llm : undefined,
    verification,
    catalog,
    breakdown,
  };
}

/**
 * 装饰器：自动追踪方法执行时间
 * @param name 时间追踪的名称（可选，默认使用方法名）
 *
 * 使用示例：
 * ```typescript
 * class MyService {
 *   @Track('llmGenerate')
 *   async generate() {
 *     // 业务代码完全不需要改动
 *   }
 * }
 * ```
 */
export function Track(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const trackName = name || propertyKey;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      const context = asyncLocalStorage.getStore();
      if (!context) {
        // 如果没有上下文，直接执行原方法
        return originalMethod.apply(this, args);
      }

      const start = Date.now();
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const duration = Date.now() - start;
        context.breakdown[trackName] = (context.breakdown[trackName] || 0) + duration;
      }
    };

    return descriptor;
  };
}
