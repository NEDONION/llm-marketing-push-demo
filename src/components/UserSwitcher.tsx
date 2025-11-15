import { useState, useEffect } from 'react';
import type {UserProfile} from '../lib/types';

interface UserEvent {
  userId: string;
  eventType: 'view' | 'add_to_cart' | 'purchase';
  itemId: string;
  timestamp: string;
  window: '7d' | '14d' | '30d';
}

interface UserProfileData {
  userId: string;
  signals: {
    recent_view: number;
    recent_add_to_cart: number;
    recent_purchase: number;
    tags: string[];
    favorite_brands?: string[];
  };
  recentEvents: UserEvent[];
  recommendedItems: any[];
}

interface UserSwitcherProps {
  currentUser: string;
  onUserChange: (userId: string) => void;
  userProfiles: UserProfile[];
}

export default function UserSwitcher({ currentUser, onUserChange, userProfiles }: UserSwitcherProps) {
  const activeProfile = userProfiles.find(u => u.id === currentUser);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取用户画像数据
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/user/${currentUser}/profile`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'view': return '👁️';
      case 'add_to_cart': return '🛒';
      case 'purchase': return '✅';
      default: return '📝';
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'view': return 'Viewed';
      case 'add_to_cart': return 'Added to cart';
      case 'purchase': return 'Purchased';
      default: return eventType;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-900">User Profile</h2>
        <button className="text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
          Edit Profile
        </button>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-2 mb-4">
        {userProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onUserChange(profile.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentUser === profile.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* 用户信号统计 */}
      {profileData && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Views (7d)</div>
            <div className="text-lg font-semibold text-blue-700">{profileData.signals.recent_view}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <div className="text-xs text-orange-600 mb-1">Add to Cart</div>
            <div className="text-lg font-semibold text-orange-700">{profileData.signals.recent_add_to_cart}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="text-xs text-green-600 mb-1">Purchases</div>
            <div className="text-lg font-semibold text-green-700">{profileData.signals.recent_purchase}</div>
          </div>
        </div>
      )}

      {/* 画像标签 */}
      {/* User behavior summary */}
      {activeProfile && (
          <div className="flex flex-col gap-1 mb-4">
            <span className="text-xs text-slate-500 mr-1">Recent behavior:</span>

            <span className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
      {activeProfile.recentSummary}
    </span>
          </div>
      )}


      {/* 行为历史记录 */}
      {profileData && profileData.recentEvents && profileData.recentEvents.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <span>📋 Recent Activity</span>
            <span className="text-xs text-slate-400">({profileData.recentEvents.length} events)</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profileData.recentEvents.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{getEventIcon(event.eventType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-600 font-medium">
                      {getEventLabel(event.eventType)}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {event.itemId}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-sm text-slate-400">
          Loading user profile...
        </div>
      )}
    </div>
  );
}
