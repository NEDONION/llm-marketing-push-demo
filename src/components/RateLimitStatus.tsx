import { useState, useEffect } from 'react';

interface RateLimitData {
  isProduction: boolean;
  callCount: number;
  maxCalls: number;
  remaining: number;
  resetAt: string;
  lastResetDate: string;
}

export default function RateLimitStatus() {
  const [rateLimitData, setRateLimitData] = useState<RateLimitData | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取限流状态
  const fetchRateLimitStatus = async () => {
    try {
      const response = await fetch('/api/rate-limit/status');
      if (response.ok) {
        const data = await response.json();
        setRateLimitData(data);
      }
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimitStatus();
    // 每30秒刷新一次
    const interval = setInterval(fetchRateLimitStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !rateLimitData) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!rateLimitData.isProduction) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (rateLimitData.remaining === 0) return 'bg-red-100 text-red-700 border-red-200';
    if (rateLimitData.remaining <= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getProgressPercentage = () => {
    if (!rateLimitData.isProduction) return 100;
    return (rateLimitData.remaining / rateLimitData.maxCalls) * 100;
  };

  const getTimeUntilReset = () => {
    if (!rateLimitData?.resetAt) return '';
    const now = new Date();
    const reset = new Date(rateLimitData.resetAt);
    const diffMs = reset.getTime() - now.getTime();

    if (diffMs <= 0) return 'Resetting...';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Environment Badge */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${getStatusColor()}`}>
        <span className="text-xs font-semibold">
          {rateLimitData.isProduction ? '🔴 Production' : '🟢 Development'}
        </span>
        <button
          onClick={fetchRateLimitStatus}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
          title="Refresh status"
        >
          🔄
        </button>
      </div>

      {/* Usage Stats */}
      {rateLimitData.isProduction ? (
        <div className="space-y-3">
          {/* Remaining Calls */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900">
                {rateLimitData.remaining}
              </span>
              <span className="text-xs text-slate-500">
                / {rateLimitData.maxCalls} calls
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  rateLimitData.remaining === 0
                    ? 'bg-red-500'
                    : rateLimitData.remaining <= 3
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Reset Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Resets in</span>
            <span className="font-semibold text-slate-900">{getTimeUntilReset()}</span>
          </div>

          {/* Usage Details */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Used today</span>
              <span className="font-medium text-slate-900">{rateLimitData.callCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Daily limit</span>
              <span className="font-medium text-slate-900">{rateLimitData.maxCalls}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">∞</div>
          <div className="text-sm font-medium text-slate-700">Unlimited Calls</div>
          <div className="text-xs text-slate-500 mt-1">Development Mode</div>
        </div>
      )}
    </div>
  );
}
