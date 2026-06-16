import { useEffect, useState } from 'react';
import { GitBranch, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { healingApi } from '@/api/healing';
import type { EmotionTimelineData, EmotionPhaseRecord } from '@/types';
import { formatFullDate } from '@/utils/helpers';

interface EmotionTimelineProps {
  userId: string;
  onEmotionSelect?: (emotion: string) => void;
}

function PhaseCard({
  phase,
  isLast,
  isCurrent,
  onEmotionClick,
}: {
  phase: EmotionPhaseRecord;
  isLast: boolean;
  isCurrent: boolean;
  onEmotionClick: (emotion: string) => void;
}) {
  const [expanded, setExpanded] = useState(isCurrent);

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${phase.dominantEmotionColor}35 0%, ${phase.dominantEmotionColor}15 100%)`,
            border: `2px solid ${phase.dominantEmotionColor}50`,
            boxShadow: isCurrent ? `0 0 16px ${phase.dominantEmotionColor}30` : undefined,
          }}
        >
          {phase.dominantEmotionIcon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-white/10 my-1" />
        )}
      </div>

      <div className="flex-1 pb-6 min-w-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-serif-sc text-base font-semibold text-white">
              {phase.label}
            </h4>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-aurora/15 text-aurora border border-aurora/25">
                当前
              </span>
            )}
            <span className="text-xs text-white/30 ml-auto flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatFullDate(phase.startDate).split(' ')[0]}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-medium cursor-pointer hover:underline"
              style={{ color: phase.dominantEmotionColor }}
              onClick={(e) => {
                e.stopPropagation();
                onEmotionClick(phase.dominantEmotion);
              }}
            >
              {phase.dominantEmotion}
            </span>
            <span className="text-xs text-white/30">{phase.recordCount} 条记录</span>
            <span className="text-xs text-white/30 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              强度 {phase.averageIntensity}
            </span>
          </div>
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {phase.emotionDistribution.map((emo) => (
                <button
                  key={emo.name}
                  onClick={() => onEmotionClick(emo.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: `${emo.color}15`,
                    color: emo.color,
                    border: `1px solid ${emo.color}25`,
                  }}
                >
                  <span className="text-sm">{emo.icon}</span>
                  {emo.name}
                  <span className="opacity-60">×{emo.count}</span>
                </button>
              ))}
            </div>

            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
              {phase.emotionDistribution.map((emo, idx) => {
                const width = (emo.count / phase.recordCount) * 100;
                return (
                  <div
                    key={idx}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: emo.color,
                      opacity: 0.6,
                      minWidth: width > 0 ? '4px' : '0',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-white/30">
              <span>{formatFullDate(phase.startDate)}</span>
              <span>{formatFullDate(phase.endDate)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmotionTimeline({ userId, onEmotionSelect }: EmotionTimelineProps) {
  const [data, setData] = useState<EmotionTimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [userId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await healingApi.getEmotionTimeline(userId);
      if (res.success && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 sm:p-8">
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse" />
              <div className="flex-1 h-16 bg-white/5 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.phases.length === 0) {
    return (
      <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="w-6 h-6 text-nebula-mint" />
          <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">情绪轨迹</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🛤️</div>
          <p className="text-white/50 text-sm mb-2">还没有情绪记录轨迹</p>
          <p className="text-white/30 text-xs">记录你的情绪变化，查看阶段性成长轨迹</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-6 h-6 text-nebula-mint" />
        <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">情绪轨迹</h3>
        <span className="text-xs text-white/30 ml-2">{data.totalRecords} 条记录</span>
      </div>

      <div className="space-y-0">
        {data.phases.map((phase, idx) => (
          <PhaseCard
            key={phase.period}
            phase={phase}
            isLast={idx === data.phases.length - 1}
            isCurrent={phase === data.currentPhase}
            onEmotionClick={(emotion) => onEmotionSelect?.(emotion)}
          />
        ))}
      </div>
    </div>
  );
}
