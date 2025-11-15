import { useState } from 'react';
import UserSwitcher from './components/UserSwitcher';
import ChannelPanel from './components/ChannelPanel';
import type {UserProfile, GeneratedContent, PushContentUI, EmailContentUI} from './lib/types';
import type {EmailContentResponse, PushContentResponse} from "../server/src/types";

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
// const generateMockPushContent = (userId: string): PushContentUI => {
//   const contents: Record<string, PushContentUI> = {
//     user_001: {
//       type: 'PUSH',
//       mainText: '📷 Sigma 35/1.4 Art lens — tonight 9PM flash sale stacks with cart coupons',
//       subText: 'Perfect match for your A7C II. Free Peak Design strap bundle.',
//       cta: 'View Deal →',
//       verification: {
//         verdict: 'ALLOW',
//         scores: { fact: 0.95, compliance: 1.0, quality: 0.98 },
//         violations: []
//       }
//     },
//     user_002: {
//       type: 'PUSH',
//       mainText: '📱 iPhone 16 Pro MagSafe case + Ugreen 67W charger combo — 25% off ends midnight',
//       subText: 'Based on your recent browsing. Ships same-day.',
//       cta: 'Shop Now →',
//       verification: {
//         verdict: 'ALLOW',
//         scores: { fact: 0.92, compliance: 0.95, quality: 0.96 },
//         violations: [
//           { code: 'COMPLIANCE_EXCESSIVE_PUNCTUATION', msg: 'Too many dashes', severity: 'WARNING' }
//         ]
//       }
//     }
//   };
//   return contents[userId];
// };

// const generateMockEmailContent = (userId: string): EmailContentUI => {
//   const contents: Record<string, EmailContentUI> = {
//     user_001: {
//       type: 'EMAIL',
//       subject: 'Your A7C II gear bundle is ready — save 15% before midnight',
//       preview: 'Complete your Sony setup with handpicked lenses and accessories',
//       body: 'Hi there! We noticed you\'ve been exploring full-frame mirrorless cameras. Here\'s a curated selection based on your browsing:',
//       bullets: [
//         'Sigma 35mm f/1.4 Art — ★4.9/5 · Perfect for street & portrait',
//         'Peak Design Slide Strap — Lightweight, quick-adjust · Ships free',
//         'Sony NP-FZ100 spare battery — Extended shooting time'
//       ],
//       cta: 'View My Bundle →',
//       verification: {
//         verdict: 'ALLOW',
//         scores: { fact: 0.98, compliance: 1.0, quality: 0.95 },
//         violations: []
//       }
//     },
//     user_002: {
//       type: 'EMAIL',
//       subject: 'iPhone 16 Pro accessories — MagSafe + fast charging essentials',
//       preview: 'Upgrade your charging setup with certified MagSafe & GaN tech',
//       body: 'We\'ve put together a power bundle tailored to your iPhone 16 Pro:',
//       bullets: [
//         'Apple MagSafe Charger — Official 15W wireless · ★4.8/5',
//         'Ugreen Nexode 67W GaN — Charge 3 devices · USB-C PD certified',
//         'Belkin 6ft Braided Cable — MFi certified · Lifetime warranty'
//       ],
//       cta: 'Get 20% Off Bundle →',
//       verification: {
//         verdict: 'REVISE',
//         scores: { fact: 0.88, compliance: 0.85, quality: 0.92 },
//         violations: [
//           { code: 'FACT_USER_EVENT_MISS', msg: 'User has not purchased iPhone 16 Pro yet', severity: 'WARNING' }
//         ]
//       }
//     }
//   };
//   return contents[userId];
// };

export default function App() {
  const [currentUser, setCurrentUser] = useState<string>('user_001');
  const [pushContents, setPushContents] = useState<GeneratedContent[]>([]);
  const [emailContents, setEmailContents] = useState<GeneratedContent[]>([]);
  const [pushLoading, setPushLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(false);

  const handleUserChange = (userId: string) => {
    setCurrentUser(userId);
    setPushContents([]);
    setEmailContents([]);
    setShowInfoBanner(true);
    setTimeout(() => setShowInfoBanner(false), 3000);
  };

  const handleGeneratePush = async () => {
    setPushLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));

      // 路径要和 router 对齐：POST /api/generate
      const resp = await fetch('/api/push/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 按你的接口注释，传 userId、channel；locale 可选（全英文可不传或传 'en-US'）
        body: JSON.stringify({
          userId: currentUser,
          channel: 'PUSH',
          // locale: 'en-US',
          // itemIds: ['v1|itm|001'] // 如需指定
        }),
      });

      if (!resp.ok) throw new Error(`Failed to generate: ${resp.status}`);
      const backendContent = await resp.json();

      console.log("backendContent:", backendContent);

      const uiContent: PushContentUI = mapPushBackendToUI(backendContent);
      setPushContents(prev => [...prev, uiContent]);
    } catch (e) {
      console.error(e);
      // TODO: toast error
    } finally {
      setPushLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    setEmailLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));

      // 路径要和 router 对齐：POST /api/generate
      const resp = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 按你的接口注释，传 userId、channel；locale 可选（全英文可不传或传 'en-US'）
        body: JSON.stringify({
          userId: currentUser,
          channel: 'EMAIL',
          // locale: 'en-US',
          // itemIds: ['v1|itm|001'] // 如需指定
        }),
      });

      if (!resp.ok) throw new Error(`Failed to generate: ${resp.status}`);
      const backendContent = await resp.json();

      console.log("backendContent:", backendContent);

      const uiContent: EmailContentUI = mapEmailBackendToUI(backendContent);
      setEmailContents(prev => [...prev, uiContent]);
    } catch (e) {
      console.error(e);
      // TODO: toast error
    } finally {
      setEmailLoading(false);
    }
  };

  /**
   * 将后端返回的 PushContentResponse 转成前端展示用 PushContentUI
   */
  function mapPushBackendToUI(content: PushContentResponse): PushContentUI {
    return {
      type: content.type,
      mainText: content.mainText,
      subText: content.subText,
      cta: content.cta,
      verification: content.verification,
    };
  }

  /**
   * 将后端返回的 EmailContentResponse 转成前端展示用 EmailContentUI
   */
  function mapEmailBackendToUI(content: EmailContentResponse): EmailContentUI {
    return {
      type: content.type,         // 'EMAIL'
      subject: content.subject,
      preview: content.preview,
      body: content.body,
      bullets: content.bullets,
      cta: content.cta,
      verification: content.verification,
    };
  }


  return (
    <main className="min-h-screen bg-slate-50">
      {/* 顶部标题区 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            LLM Dynamic Push/Email Content Enhancement Demo
          </h1>
          <p className="text-sm text-slate-500">
            Personalized marketing content generation with hallucination detection and validation
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
          onRegenerate={handleGeneratePush}
        />

        {/* Email 通道面板 */}
        <ChannelPanel
          channel="EMAIL"
          icon="📧"
          title="Email Marketing"
          contents={emailContents}
          loading={emailLoading}
          onGenerate={handleGenerateEmail}
          onRegenerate={handleGenerateEmail}
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
