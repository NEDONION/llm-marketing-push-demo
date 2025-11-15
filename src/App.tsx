import { useState } from 'react';
import UserSwitcher from './components/UserSwitcher';
import ChannelPanel from './components/ChannelPanel';
import RateLimitStatus from './components/RateLimitStatus';
import type {GeneratedContent, PushContentUI, EmailContentUI, UserProfile} from './lib/types';
import type {EmailContentResponse, PushContentResponse} from "../server/src/types";

const userProfiles: UserProfile[] = [
  {
    id: 'user_001',
    name: 'User 001 (Camera)',
    recentSummary: 'Recently engaged with Sony camera gear, showing strong interest but no purchase yet.'
  },
  {
    id: 'user_002',
    name: 'User 002 (iPhone)',
    recentSummary: 'Recently purchased an iPhone 15 Pro, indicating clear Apple affinity and readiness for accessories.'
  },
  {
    id: 'user_003',
    name: 'User 003 (Samsung)',
    recentSummary: 'Recently purchased a Samsung S24, suggesting strong Samsung loyalty and accessory needs.'
  },
  {
    id: 'user_004',
    name: 'User 004 (Canon)',
    recentSummary: 'Recently purchased a Canon R5, likely needing lenses, camera bags, and tripod accessories.'
  },
  {
    id: 'user_005',
    name: 'User 005 (Browsing Phones)',
    recentSummary: 'Actively browsing multiple smartphones and currently in the comparison stage.'
  },
  {
    id: 'user_006',
    name: 'User 006 (Laptop)',
    recentSummary: 'Recently purchased a MacBook Pro 16", making laptop accessories highly relevant.'
  },
  {
    id: 'user_007',
    name: 'User 007 (Headphones)',
    recentSummary: 'Recently exploring premium headphones and comparing Sony, Bose, and AirPods Max.'
  }
];


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
      setPushContents([uiContent]); // 替换而不是追加
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
      setEmailContents([uiContent]); // 替换而不是追加
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
      timing: content.timing,
      meta: content.meta,
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
      timing: content.timing,
      meta: content.meta,
    };
  }


  return (
    <main className="min-h-screen bg-slate-50">
      {/* 顶部标题区 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
                LLM Dynamic Push/Email Content Enhancement Demo
              </h1>
              <p className="text-sm text-slate-500">
                Personalized marketing content generation with hallucination detection and validation
              </p>
            </div>
          </div>
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

      {/* 主内容区 - 侧边栏布局 */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* 左侧主内容 */}
          <div className="flex-1 space-y-6 md:space-y-8">
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

          {/* 右侧边栏 - 全局状态面板 */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Rate Limit Status Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⚡</span>
                  <h3 className="text-sm font-semibold text-slate-900">API Usage</h3>
                </div>
                <RateLimitStatus />
              </div>
            </div>
          </aside>
        </div>
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
