import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, HandMetal, MailPlus, ChevronRight } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { ParallelMatchResult } from '@/types';
import { cn } from '@/utils/helpers';

interface MatchCardProps {
  match: ParallelMatchResult;
  index: number;
  onInteract: (match: ParallelMatchResult, type: 'wave' | 'resonate' | 'invite') => void;
}

function getMatchTier(score: number) {
  if (score >= 70) return { label: '灵魂共振', color: 'from-starlight to-aurora', textColor: 'text-starlight', bg: 'bg-starlight/10' };
  if (score >= 50) return { label: '频率相近', color: 'from-aurora to-nebula-mint', textColor: 'text-aurora', bg: 'bg-aurora/10' };
  if (score >= 30) return { label: '微弱信号', color: 'from-nebula-purple to-cosmic-400', textColor: 'text-nebula-purple', bg: 'bg-nebula-purple/10' };
  return { label: '遥远星光', color: 'from-white/30 to-white/10', textColor: 'text-white/60', bg: 'bg-white/5' };
}

function getActivityBadge(level: string) {
  switch (level) {
    case 'active': return { label: '活跃', color: 'bg-nebula-mint/20 text-nebula-mint' };
    case 'moderate': return { label: '温和', color: 'bg-starlight/20 text-starlight' };
    default: return { label: '宁静', color: 'bg-white/10 text-white/50' };
  }
}

export default function MatchCard({ match, index, onInteract }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = getMatchTier(match.matchScore);
  const activity = getActivityBadge(match.activityLevel);

  return (
    <div
      className="glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-glow group animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-400 to-aurora flex items-center justify-center text-xl">
              {match.avatar}
            </div>
            <div>
              <h3 className="font-serif-sc text-lg font-semibold text-white">{match.username}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', activity.color)}>
                  {activity.label}
                </span>
              </div>
            </div>
          </div>

          <div className={cn('px-3 py-1.5 rounded-xl bg-gradient-to-r text-center', tier.bg)}>
            <div className={cn('text-lg font-bold', tier.textColor)}>{match.matchScore}</div>
            <div className={cn('text-[10px]', tier.textColor)}>{tier.label}</div>
          </div>
        </div>

        <p className="text-sm text-white/60 mb-3 line-clamp-2">{match.bio}</p>

        {match.commonEmotions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {match.commonEmotions.slice(0, 4).map(emo => (
              <EmotionTag key={emo} name={emo} size="sm" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
          <span className="inline-flex items-center gap-1">
            💫 {match.interactionHint}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-white/40 hover:text-white/60 py-1 transition-colors"
        >
          {expanded ? '收起维度分析' : '查看匹配维度'}
          <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fade-in">
            {match.matchDimensions.map(dim => (
              <div key={dim.key} className="flex items-center gap-2">
                <span className="text-sm">{dim.icon}</span>
                <span className="text-xs text-white/60 w-16 shrink-0">{dim.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${dim.score}%`,
                      backgroundColor: dim.color,
                    }}
                  />
                </div>
                <span className="text-xs text-white/50 w-8 text-right">{dim.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onInteract(match, 'wave')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-starlight/10 text-starlight text-xs hover:bg-starlight/20 transition-all"
          >
            <Zap className="w-3 h-3" />
            星波
          </button>
          <button
            onClick={() => onInteract(match, 'resonate')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-aurora/10 text-aurora text-xs hover:bg-aurora/20 transition-all"
          >
            <HandMetal className="w-3 h-3" />
            共鸣
          </button>
          <button
            onClick={() => onInteract(match, 'invite')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nebula-pink/10 text-nebula-pink text-xs hover:bg-nebula-pink/20 transition-all"
          >
            <MailPlus className="w-3 h-3" />
            邀信
          </button>
        </div>

        {match.recentLetterId && (
          <Link
            to={`/letter/${match.recentLetterId}`}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            最近信件
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
