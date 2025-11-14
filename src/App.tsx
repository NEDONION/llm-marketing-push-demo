import { useState } from 'react';
import UserSwitcher from './components/UserSwitcher';
import ChannelPanel from './components/ChannelPanel';
import type {UserId, UserProfile, GeneratedContent, PushContent, EmailContent} from './lib/types';

// Mock 数据
const userProfiles: UserProfile[] = [
  {
    id: 'user_001',
    name: 'User 001 (Camera Enthusiast)',
    tags: ['Sony A7C II', 'Sigma 35mm f/1.4', 'Peak Design Strap']
  },
  {
    id: 'user_002',
    name: 'User 002 (Phone Lover)',
    tags: ['iPhone 16 Pro', 'MagSafe Charger', 'Ugreen Cable']
  }
];

// Mock 生成内容函数
const generateMockPushContent = (userId: UserId): PushContent => {
  const contents: Record<UserId, PushContent> = {
    user_001: {
      type: 'PUSH',
      mainText: '📷 Sigma 35/1.4 Art lens — tonight 9PM flash sale stacks with cart coupons',
      subText: 'Perfect match for your A7C II. Free Peak Design strap bundle.',
      cta: 'View Deal →',
      verification: {
        verdict: 'ALLOW',
        scores: { fact: 0.95, compliance: 1.0, quality: 0.98 },
        violations: []
      }
    },
    user_002: {
      type: 'PUSH',
      mainText: '📱 iPhone 16 Pro MagSafe case + Ugreen 67W charger combo — 25% off ends midnight',
      subText: 'Based on your recent browsing. Ships same-day.',
      cta: 'Shop Now →',
      verification: {
        verdict: 'ALLOW',
        scores: { fact: 0.92, compliance: 0.95, quality: 0.96 },
        violations: [
          { code: 'COMPLIANCE_EXCESSIVE_PUNCTUATION', msg: 'Too many dashes', severity: 'WARNING' }
        ]
      }
    }
  };
  return contents[userId];
};

const generateMockEmailContent = (userId: UserId): EmailContent => {
  const contents: Record<UserId, EmailContent> = {
    user_001: {
      type: 'EMAIL',
      subject: 'Your A7C II gear bundle is ready — save 15% before midnight',
      preview: 'Complete your Sony setup with handpicked lenses and accessories',
      body: 'Hi there! We noticed you\'ve been exploring full-frame mirrorless cameras. Here\'s a curated selection based on your browsing:',
      bullets: [
        'Sigma 35mm f/1.4 Art — ★4.9/5 · Perfect for street & portrait',
        'Peak Design Slide Strap — Lightweight, quick-adjust · Ships free',
        'Sony NP-FZ100 spare battery — Extended shooting time'
      ],
      cta: 'View My Bundle →',
      verification: {
        verdict: 'ALLOW',
        scores: { fact: 0.98, compliance: 1.0, quality: 0.95 },
        violations: []
      }
    },
    user_002: {
      type: 'EMAIL',
      subject: 'iPhone 16 Pro accessories — MagSafe + fast charging essentials',
      preview: 'Upgrade your charging setup with certified MagSafe & GaN tech',
      body: 'We\'ve put together a power bundle tailored to your iPhone 16 Pro:',
      bullets: [
        'Apple MagSafe Charger — Official 15W wireless · ★4.8/5',
        'Ugreen Nexode 67W GaN — Charge 3 devices · USB-C PD certified',
        'Belkin 6ft Braided Cable — MFi certified · Lifetime warranty'
      ],
      cta: 'Get 20% Off Bundle →',
      verification: {
        verdict: 'REVISE',
        scores: { fact: 0.88, compliance: 0.85, quality: 0.92 },
        violations: [
          { code: 'FACT_USER_EVENT_MISS', msg: 'User has not purchased iPhone 16 Pro yet', severity: 'WARNING' }
        ]
      }
    }
  };
  return contents[userId];
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserId>('user_001');
  const [pushContents, setPushContents] = useState<GeneratedContent[]>([]);
  const [emailContents, setEmailContents] = useState<GeneratedContent[]>([]);
  const [pushLoading, setPushLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(false);

  const handleUserChange = (userId: UserId) => {
    setCurrentUser(userId);
    setPushContents([]);
    setEmailContents([]);
    setShowInfoBanner(true);
    setTimeout(() => setShowInfoBanner(false), 3000);
  };

  const handleGeneratePush = () => {
    setPushLoading(true);
    setTimeout(() => {
      const newContent = generateMockPushContent(currentUser);
      setPushContents([newContent]);
      setPushLoading(false);
    }, 1500);
  };

  const handleGenerateEmail = () => {
    setEmailLoading(true);
    setTimeout(() => {
      const newContent = generateMockEmailContent(currentUser);
      setEmailContents([newContent]);
      setEmailLoading(false);
    }, 1800);
  };

  const handleRegeneratePush = (index: number) => {
    setPushLoading(true);
    setTimeout(() => {
      const newContent = generateMockPushContent(currentUser);
      const updated = [...pushContents];
      updated[index] = newContent;
      setPushContents(updated);
      setPushLoading(false);
    }, 1500);
  };

  const handleRegenerateEmail = (index: number) => {
    setEmailLoading(true);
    setTimeout(() => {
      const newContent = generateMockEmailContent(currentUser);
      const updated = [...emailContents];
      updated[index] = newContent;
      setEmailContents(updated);
      setEmailLoading(false);
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* 顶部标题区 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            LLM Dynamic Push/Email Optimization
          </h1>
          <p className="text-sm text-slate-500">
            Personalized marketing content generation with three-layer verification
          </p>
        </div>
      </div>

      {/* 信息提示条 */}
      {showInfoBanner && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700">
            User profile switched. Previous content cleared.
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* 用户切换器 */}
        <UserSwitcher
          currentUser={currentUser}
          onUserChange={handleUserChange}
          userProfiles={userProfiles}
        />

        {/* Push 通道面板 */}
        <ChannelPanel
          channel="PUSH"
          icon="📱"
          title="Push Notification"
          contents={pushContents}
          loading={pushLoading}
          onGenerate={handleGeneratePush}
          onRegenerate={handleRegeneratePush}
        />

        {/* Email 通道面板 */}
        <ChannelPanel
          channel="EMAIL"
          icon="📧"
          title="Email Marketing"
          contents={emailContents}
          loading={emailLoading}
          onGenerate={handleGenerateEmail}
          onRegenerate={handleRegenerateEmail}
        />
      </div>

      {/* 页脚 */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-slate-400">
          Demo UI · Blue-white minimal design · Tailwind CSS
        </p>
      </div>
    </main>
  );
}
