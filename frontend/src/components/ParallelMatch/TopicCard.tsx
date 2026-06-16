import { useState } from 'react';
import { Link, ChevronDown, ChevronUp, BookOpen, Users, Zap, Target, Waves } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { ParallelTopic } from '@/types';
import { cn } from '@/utils/helpers';

interface TopicCardProps {
  topic: ParallelTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const md = topic.matchDetails;

  const hasMatchDetails = md && (md.emotion.score + md.recipientType.score + md.theme.score + md.behavior.score) > 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${topic.color}20` }}
            >
              {topic.icon}
            </div>
            <div>
              <h3 className="font-serif-sc text-base font-semibold text-white">{topic.title}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <BookOpen className="w-3 h-3" />
                  {topic.letterCount} 封信
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-white/40">
                  <Users className="w-3 h-3" />
                  {topic.participantCount} 人参与
                </span>
              </div>
            </div>
          </div>

          {topic.relevanceScore > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-starlight/10 text-starlight text-xs font-medium">
              匹配 {topic.relevanceScore}
            </div>
          )}
        </div>

        <p className="text-sm text-white/55 mb-3 line-clamp-2">{topic.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {topic.emotions.map(emo => (
            <EmotionTag key={emo} name={emo} size="sm" />
          ))}
        </div>

        {topic.relevanceReason && (
          <div className="text-xs text-starlight/70 bg-starlight/5 px-3 py-1.5 rounded-lg mb-3">
            💡 {topic.relevanceReason}
          </div>
        )}

        {hasMatchDetails && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs text-white/40 hover:text-white/60 py-1 mb-2 transition-colors"
            >
              {expanded ? '收起匹配维度' : '展开匹配维度'}
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {expanded && (
              <div className="space-y-1.5 mb-3 pt-1 border-t border-white/5 animate-fade-in">
                {md!.emotion.overlap.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-aurora shrink-0" />
                    <span className="text-white/50 w-16 shrink-0">情感共鸣</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {md!.emotion.overlap.map(emo => (
                        <span key={emo} className="text-aurora/80">{emo}</span>
                      ))}
                    </div>
                    <span className="ml-auto text-white/40">+{md!.emotion.score}</span>
                  </div>
                )}
                {md!.theme.overlap.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Target className="w-3 h-3 text-starlight shrink-0" />
                    <span className="text-white/50 w-16 shrink-0">主题契合</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {md!.theme.overlap.map(t => (
                        <span key={t} className="text-starlight/80">{t}</span>
                      ))}
                    </div>
                    <span className="ml-auto text-white/40">+{md!.theme.score}</span>
                  </div>
                )}
                {md!.recipientType.overlap.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-3 h-3 text-nebula-purple shrink-0" />
                    <span className="text-white/50 w-16 shrink-0">收件偏好</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {md!.recipientType.overlap.map(t => (
                        <span key={t} className="text-nebula-purple/80">{t}</span>
                      ))}
                    </div>
                    <span className="ml-auto text-white/40">+{md!.recipientType.score}</span>
                  </div>
                )}
                {md!.behavior.score > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Waves className="w-3 h-3 text-nebula-mint shrink-0" />
                    <span className="text-white/50 w-16 shrink-0">行为共振</span>
                    <span className="text-nebula-mint/80">
                      {md!.behavior.activityMatched && '活跃度匹配'}
                      {md!.behavior.activityMatched && md!.behavior.letterVolumeMatched && ' · '}
                      {md!.behavior.letterVolumeMatched && '内容量匹配'}
                    </span>
                    <span className="ml-auto text-white/40">+{md!.behavior.score}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {topic.sampleLetters.length > 0 && (
          <div className={cn('space-y-1.5', hasMatchDetails && !expanded ? 'pt-1 border-t border-white/5' : '')}>
            <p className="text-xs text-white/40">相关信件</p>
            {topic.sampleLetters.map(letter => (
              <Link
                key={letter.id}
                to={`/letter/${letter.id}`}
                className="block text-xs text-white/60 hover:text-aurora transition-colors truncate"
              >
                📮 {letter.title} — {letter.senderName}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
