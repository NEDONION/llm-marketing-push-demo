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

      {/* 调用链时间展示 - 垂直链条布局 */}
      {content.timing && (
        <div className="pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-2">
            <span>⏱️ Call Chain Timeline</span>
            <span className="text-slate-400">({content.timing.total}ms total)</span>
          </div>
          <div className="space-y-2 text-xs">
            {/* Step 1: Catalog */}
            {content.timing.catalog !== undefined && (
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="bg-blue-50 rounded px-3 py-2 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">1. Catalog Service</span>
                    <span className="font-semibold text-blue-600">{content.timing.catalog}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: LLM */}
            {content.timing.llm !== undefined && (
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="bg-indigo-50 rounded px-3 py-2 border border-indigo-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">2. LLM Generation</span>
                    <span className="font-semibold text-indigo-600">{content.timing.llm}ms</span>
                  </div>
                  {content.timing.breakdown?.promptBuild !== undefined && (
                    <div className="mt-1 text-xs text-slate-500 flex justify-between">
                      <span className="pl-2">↳ Prompt Build</span>
                      <span>{content.timing.breakdown.promptBuild}ms</span>
                    </div>
                  )}
                  {content.timing.breakdown?.llmGenerate !== undefined && (
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span className="pl-2">↳ LLM Call</span>
                      <span>{content.timing.breakdown.llmGenerate}ms</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Verification */}
            {content.timing.verification !== undefined && (
              <div className="relative pl-6">
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
                <div className="bg-green-50 rounded px-3 py-2 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">3. Verification</span>
                    <span className="font-semibold text-green-600">{content.timing.verification}ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
