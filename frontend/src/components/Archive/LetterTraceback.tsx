import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Sparkles, Tag, Compass, Clock, User, ChevronRight } from 'lucide-react';
import { archiveApi } from '@/api/archive';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { LetterTraceback as LetterTracebackType, TracebackLetter, ArchiveLetter } from '@/types';
import { formatDate, getRecipientTypeLabel } from '@/utils/helpers';

interface LetterTracebackProps {
  letterId: string;
}

export default function LetterTraceback({ letterId }: LetterTracebackProps) {
  const [data, setData] = useState<LetterTracebackType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'emotion' | 'recipient' | 'sender' | 'period'>('emotion');

  useEffect(() => {
    fetchTraceback();
  }, [letterId]);

  const fetchTraceback = async () => {
    try {
      setLoading(true);
      const res = await archiveApi.getLetterTraceback(letterId);
      if (res.success && res.data) setData(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4 animate-pulse">
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sections = [
    { key: 'emotion' as const, label: '同情绪', icon: Tag, count: data.sameEmotionLetters.length, color: 'text-nebula-pink' },
    { key: 'recipient' as const, label: '同收件人', icon: Compass, count: data.sameRecipientLetters.length, color: 'text-aurora' },
    { key: 'sender' as const, label: '同作者', icon: User, count: data.sameSenderLetters.length, color: 'text-starlight' },
    { key: 'period' as const, label: '同时期', icon: Clock, count: data.samePeriodLetters.length, color: 'text-nebula-orange' },
  ];

  const currentLetters = activeSection === 'emotion'
    ? data.sameEmotionLetters
    : activeSection === 'recipient'
    ? data.sameRecipientLetters
    : activeSection === 'sender'
    ? data.sameSenderLetters
    : data.samePeriodLetters;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-aurora" />
        <h3 className="font-serif-sc text-lg font-semibold text-white">信件回溯</h3>
      </div>

      {data.emotionDetail.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-medium text-white/70 mb-3">这封信的情绪印记</h4>
          <div className="flex flex-wrap gap-2.5">
            {data.emotionDetail.map(ed => (
              <div key={ed.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <EmotionTag name={ed.name} icon={ed.icon} color={ed.color} size="sm" />
                <span className="text-xs text-white/40">
                  {ed.relatedCount} 封相关
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-1.5 inline-flex w-full flex-wrap">
        {sections.map(section => {
          const SectionIcon = section.icon;
          return (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`relative flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === section.key
                  ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <SectionIcon className={`w-4 h-4 ${activeSection === section.key ? section.color : ''}`} />
              <span className="hidden sm:inline">{section.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSection === section.key ? 'bg-white/10' : 'bg-white/5'
              }`}>
                {section.count}
              </span>
            </button>
          );
        })}
      </div>

      {currentLetters.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-3xl mb-2">🔭</div>
          <p className="text-sm text-white/50">暂无相关信件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentLetters.map((letter: TracebackLetter | ArchiveLetter) => {
            const isTraceback = 'sharedEmotions' in letter;
            return (
              <Link
                key={letter.id}
                to={`/letter/${letter.id}`}
                className="group block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="font-serif-sc text-sm font-medium text-white truncate group-hover:text-aurora transition-colors flex-1">
                    {letter.title}
                  </h5>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-aurora transition-colors shrink-0" />
                </div>
                <p className="text-xs text-white/40 line-clamp-2 mb-2">{letter.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {letter.emotions.slice(0, 2).map(emo => (
                      <EmotionTag key={emo} name={emo} size="sm" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    {isTraceback && (letter as TracebackLetter).sharedEmotions && (
                      <span className="text-nebula-pink/70">
                        {(letter as TracebackLetter).sharedEmotions}个共同情绪
                      </span>
                    )}
                    <span>❤️ {letter.likes}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <span className="flex items-center gap-1">
            <Compass className="w-4 h-4 text-aurora" />
            致{data.recipientInfo.icon} {data.recipientInfo.label}
          </span>
          <span className="text-white/20">·</span>
          <span>共 {data.recipientInfo.totalCount} 封</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-nebula-orange" />
            {data.periodInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
}
