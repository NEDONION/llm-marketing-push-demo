import type {UserProfile} from '../lib/types';

interface UserSwitcherProps {
  currentUser: string;
  onUserChange: (userId: string) => void;
  userProfiles: UserProfile[];
}

export default function UserSwitcher({ currentUser, onUserChange, userProfiles }: UserSwitcherProps) {
  const activeProfile = userProfiles.find(u => u.id === currentUser);

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

      {/* 画像标签 */}
      {activeProfile && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 mr-1">Recent interests:</span>
          {activeProfile.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
