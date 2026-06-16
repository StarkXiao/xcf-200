import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Heart } from 'lucide-react';
import { healingApi } from '@/api/healing';
import type { RecommendedLetter } from '@/types';
import { truncateText } from '@/utils/helpers';
import EmotionTag from '@/components/Emotion/EmotionTag';

interface RecommendedLettersProps {
  emotion?: string | null;
}

export default function RecommendedLetters({ emotion }: RecommendedLettersProps) {
  const [letters, setLetters] = useState<RecommendedLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLetters();
  }, [emotion]);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const res = await healingApi.getRecommendedLetters(emotion || undefined, 6);
      if (res.success && res.data) setLetters(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 sm:p-8">
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-aurora" />
        <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">疗愈信笺</h3>
        {emotion && (
          <span className="text-sm text-white/50 ml-2">
            — 为「{emotion}」精选
          </span>
        )}
      </div>

      {letters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">💌</div>
          <p className="text-white/50 text-sm mb-2">暂时没有推荐信件</p>
          <p className="text-white/30 text-xs">写下你的第一封信，成为别人的星光</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
          {letters.map((letter) => (
            <Link
              key={letter.id}
              to={`/letter/${letter.id}`}
              className="group block"
            >
              <div
                className="relative rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 bg-aurora group-hover:opacity-30 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-serif-sc text-base font-semibold text-white group-hover:text-aurora transition-colors line-clamp-1 flex-1 mr-2">
                      {letter.title}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-aurora/10 text-aurora border border-aurora/20">
                      {letter.matchReason}
                    </span>
                  </div>

                  <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
                    {truncateText(letter.content, 100)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {letter.emotions.slice(0, 3).map((emo) => (
                        <EmotionTag key={emo} name={emo} size="sm" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-white/30 text-xs shrink-0 ml-2">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {letter.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/write"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
        >
          <Sparkles className="w-4 h-4 text-starlight" />
          写一封疗愈信
        </Link>
      </div>
    </div>
  );
}
