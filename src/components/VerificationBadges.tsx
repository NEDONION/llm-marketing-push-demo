import { useState } from 'react';
import type {VerificationResult} from '../lib/types';

interface VerificationBadgesProps {
  verification: VerificationResult;
}

export default function VerificationBadges({ verification }: VerificationBadgesProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  const getBadgeIcon = (score: number) => {
    if (score >= 0.9) return '✅';
    if (score >= 0.7) return '⚠️';
    return '❌';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 0.9) return 'border-green-200 bg-green-50 text-green-700';
    if (score >= 0.7) return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-rose-200 bg-rose-50 text-rose-700';
  };

  const badges = [
    {
      key: 'fact',
      label: 'Fact',
      score: verification.scores.fact,
      reason: verification.scores.fact >= 0.9
        ? 'All claims verified against user history & catalog'
        : 'Some claims could not be verified'
    },
    {
      key: 'compliance',
      label: 'Compliance',
      score: verification.scores.compliance,
      reason: verification.scores.compliance >= 0.9
        ? 'No policy violations detected'
        : verification.violations.filter(v => v.code.startsWith('COMPLIANCE')).map(v => v.msg).join('; ') || 'Minor compliance issues'
    },
    {
      key: 'quality',
      label: 'Quality',
      score: verification.scores.quality,
      reason: verification.scores.quality >= 0.9
        ? 'Meets all quality standards'
        : 'Quality can be improved'
    }
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {badges.map((badge) => (
        <div
          key={badge.key}
          className="relative"
          onMouseEnter={() => setHoveredBadge(badge.key)}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getBadgeColor(badge.score)}`}>
            <span>{getBadgeIcon(badge.score)}</span>
            <span>{badge.label}</span>
            <span className="text-slate-500">
              {Math.round(badge.score * 100)}%
            </span>
          </div>

          {/* Popover */}
          {hoveredBadge === badge.key && (
            <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white rounded-lg shadow-lg border border-slate-200">
              <div className="text-xs text-slate-600">
                {badge.reason}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
