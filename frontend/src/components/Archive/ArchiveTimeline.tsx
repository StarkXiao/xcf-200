import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import { archiveApi } from '@/api/archive';
import EmotionTag from '@/components/Emotion/EmotionTag';
import useAuthStore from '@/store/useAuthStore';
import type { ArchiveTimelinePeriod, ArchiveLetter } from '@/types';
import { formatDate, getRecipientTypeLabel } from '@/utils/helpers';

interface ArchiveTimelineProps {
  selectedEmotions: string[];
  selectedRecipientTypes: string[];
  scope?: 'public' | 'user' | 'favorites';
}

export default function ArchiveTimeline({
  selectedEmotions,
  selectedRecipientTypes,
  scope = 'public',
}: ArchiveTimelineProps) {
  const { user } = useAuthStore();
  const [timeline, setTimeline] = useState<ArchiveTimelinePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTimeline();
  }, [selectedEmotions, selectedRecipientTypes, scope]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const params: any = { scope };
      if (scope !== 'public' && user) params.userId = user.id;
      if (selectedEmotions.length > 0) params.emotion = selectedEmotions;
      if (selectedRecipientTypes.length > 0) params.recipientType = selectedRecipientTypes;
      const res = await archiveApi.getTimeline(params);
      if (res.success) {
        setTimeline(res.data);
        const allKeys = new Set(res.data.map((p: ArchiveTimelinePeriod) => p.key));
        setExpandedPeriods(allKeys);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const togglePeriod = (key: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="h-6 w-24 rounded bg-white/10 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-20 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="glass-card p-12 sm:p-16 text-center">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-lg text-white/70 font-serif-sc mb-2">暂无归档信件</p>
        <p className="text-sm text-white/50">试试调整筛选条件，或去信件广场写一封信吧</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] sm:left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-aurora/40 via-nebula-purple/30 to-starlight/20" />

      <div className="space-y-4">
        {timeline.map((period) => {
          const isExpanded = expandedPeriods.has(period.key);
          return (
            <div key={period.key} className="relative animate-fade-in-up">
              <div className="absolute left-[12px] sm:left-[16px] top-3 w-[14px] h-[14px] rounded-full bg-gradient-to-br from-aurora to-nebula-purple border-2 border-cosmic-950 shadow-glow-sm z-10" />

              <div className="ml-10 sm:ml-14">
                <button
                  onClick={() => togglePeriod(period.key)}
                  className="flex items-center gap-3 mb-3 group w-full text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="w-4 h-4 text-aurora shrink-0" />
                    <h4 className="font-serif-sc text-lg font-semibold text-white group-hover:text-aurora transition-colors">
                      {period.label}
                    </h4>
                    <span className="text-xs text-white/40 shrink-0">
                      {period.count} 封
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="space-y-2.5 pb-2">
                    {period.letters.map((letter: ArchiveLetter) => (
                      <TimelineLetterCard key={letter.id} letter={letter} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineLetterCard({ letter }: { letter: ArchiveLetter }) {
  const recipientInfo = getRecipientTypeLabel(letter.recipientType);

  return (
    <Link
      to={`/letter/${letter.id}`}
      className="group block p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${recipientInfo.color}`}>
              <span>{recipientInfo.icon}</span>
              致{recipientInfo.label}
            </span>
            <span className="text-xs text-white/40">
              {formatDate(letter.createdAt)}
            </span>
          </div>
          <h5 className="font-serif-sc text-sm sm:text-base font-medium text-white truncate group-hover:text-aurora transition-colors">
            {letter.title}
          </h5>
          <p className="text-xs text-white/50 mt-1 line-clamp-2">{letter.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {letter.emotions.slice(0, 3).map(emo => (
              <EmotionTag key={emo} name={emo} size="sm" />
            ))}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5 text-xs text-white/40">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-starlight" />
            <span>{letter.senderName}</span>
          </div>
          <span>❤️ {letter.likes}</span>
        </div>
      </div>
    </Link>
  );
}
