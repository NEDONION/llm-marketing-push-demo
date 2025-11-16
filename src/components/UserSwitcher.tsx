import { useState, useEffect, useRef } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

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

  // 过滤用户列表
  const filteredProfiles = userProfiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理用户选择
  const handleUserSelect = (userId: string) => {
    onUserChange(userId);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-900">User Profile</h2>
        <button className="text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
          Edit Profile
        </button>
      </div>

      {/* User Selector Dropdown */}
      <div className="mb-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Current User:</span>
            <span className="text-sm font-semibold text-indigo-600">{activeProfile?.name || currentUser}</span>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-96 flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-200">
              <input
                type="text"
                placeholder="Search users by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-64">
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleUserSelect(profile.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                      currentUser === profile.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{profile.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{profile.id}</div>
                      </div>
                      {currentUser === profile.id && (
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
              <span>{filteredProfiles.length} of {userProfiles.length} users</span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
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
