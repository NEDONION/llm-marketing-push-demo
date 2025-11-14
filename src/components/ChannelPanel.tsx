import type {Channel, GeneratedContent} from '../lib/types';
import ContentCard from './ContentCard';

interface ChannelPanelProps {
  channel: Channel;
  icon: string;
  title: string;
  contents: GeneratedContent[];
  loading: boolean;
  onGenerate: () => void;
  onRegenerate: (index: number) => void;
}

export default function ChannelPanel({
  channel,
  icon,
  title,
  contents,
  loading,
  onGenerate,
  onRegenerate
}: ChannelPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 面板头部 */}
      <div className="p-5 md:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h2 className="text-lg font-medium text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {channel === 'PUSH' ? '≤45 chars main · concise CTA' : 'Subject + preview + body structure'}
              </p>
            </div>
          </div>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:from-indigo-300 disabled:to-blue-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-5 md:p-6">
        {loading && (
          <div className="space-y-4">
            {/* Skeleton Loading */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        )}

        {!loading && contents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-20">{icon}</div>
            <p className="text-sm text-slate-500">
              Click "Generate" to create personalized {channel.toLowerCase()} content
            </p>
          </div>
        )}

        {!loading && contents.length > 0 && (
          <div className="space-y-4">
            {contents.map((content, idx) => (
              <ContentCard
                key={idx}
                content={content}
                onRegenerate={() => onRegenerate(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
