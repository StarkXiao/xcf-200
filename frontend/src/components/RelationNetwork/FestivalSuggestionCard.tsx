import { Calendar, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FestivalSuggestion } from '@/types';

interface FestivalSuggestionCardProps {
  suggestion: FestivalSuggestion;
  onWriteLetter?: () => void;
}

export default function FestivalSuggestionCard({
  suggestion,
  onWriteLetter,
}: FestivalSuggestionCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onWriteLetter) {
      onWriteLetter();
    } else {
      navigate('/write');
    }
  };

  return (
    <div
      className={`glass-card p-5 relative overflow-hidden transition-all duration-300 hover:bg-white/10 ${
        suggestion.isUrgent ? 'border-nebula-orange/40 bg-nebula-orange/5' : ''
      }`}
    >
      {suggestion.isUrgent && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-nebula-orange/20 text-nebula-orange text-xs font-medium animate-pulse-glow">
          <AlertCircle className="w-3 h-3" />
          即将到来
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-starlight/20 to-nebula-orange/20 flex items-center justify-center text-3xl shrink-0 border border-starlight/30">
          {suggestion.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-serif-sc font-semibold text-white">{suggestion.festivalName}</h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
              <Calendar className="w-3 h-3" />
              {suggestion.daysUntil}天后
            </span>
          </div>

          <p className="text-sm text-white/60 mb-3 leading-relaxed">{suggestion.suggestion}</p>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-white/40">推荐情绪：</span>
            {suggestion.recommendedEmotions.map((emotion) => (
              <span
                key={emotion}
                className="px-2 py-0.5 rounded-full text-xs bg-aurora/15 text-aurora"
              >
                {emotion}
              </span>
            ))}
          </div>

          {suggestion.recipientGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/40">适合写给：</span>
              {suggestion.recipientGroups.map((group) => (
                <span
                  key={group}
                  className="px-2 py-0.5 rounded-full text-xs bg-nebula-pink/15 text-nebula-pink"
                >
                  {group}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleClick}
        className="mt-4 w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        现在就写
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
