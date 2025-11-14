import { useState } from 'react';
import type {GeneratedContent} from '../lib/types';
import VerificationBadges from './VerificationBadges';

interface ContentCardProps {
  content: GeneratedContent;
  onRegenerate: () => void;
}

export default function ContentCard({ content, onRegenerate }: ContentCardProps) {
  const [showToast, setShowToast] = useState(false);

  const handleCopy = () => {
    const textToCopy = content.type === 'PUSH'
      ? `${content.mainText}${content.subText ? '\n' + content.subText : ''}`
      : `${content.subject}\n\n${content.preview}\n\n${content.body}`;

    navigator.clipboard.writeText(textToCopy);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleCopy}
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors font-medium"
        >
          Copy
        </button>
        <button
          onClick={onRegenerate}
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors font-medium"
        >
          Regenerate
        </button>
      </div>

      {/* 内容区域 */}
      {content.type === 'PUSH' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {content.mainText}
          </p>
          {content.subText && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {content.subText}
            </p>
          )}
          {content.cta && (
            <div className="pt-2">
              <span className="inline-block text-xs font-medium text-indigo-600">
                {content.cta}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Email 主题 */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Subject</div>
            <p className="text-sm font-medium text-slate-900">
              {content.subject}
            </p>
          </div>

          {/* Email 预览 */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Preview</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {content.preview}
            </p>
          </div>

          {/* Email 正文 */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Body</div>
            <div className="text-xs text-slate-700 leading-relaxed space-y-2">
              <p>{content.body}</p>
              {content.bullets && content.bullets.length > 0 && (
                <ul className="space-y-1 pl-4">
                  {content.bullets.map((bullet, idx) => (
                    <li key={idx} className="list-disc">
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* CTA */}
          {content.cta && (
            <div className="pt-2">
              <span className="inline-block text-xs font-medium text-indigo-600">
                {content.cta}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 校验徽章 */}
      <div className="pt-3 border-t border-slate-200">
        <VerificationBadges verification={content.verification} />
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
