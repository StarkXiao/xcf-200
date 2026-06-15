import type { Reply } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { formatDate } from '@/utils/helpers';
import { Globe2, Sparkles } from 'lucide-react';

const parallelColors = [
  { from: 'from-aurora', to: 'from-nebula-purple', border: 'border-aurora/40', bg: 'bg-aurora/10' },
  { from: 'from-starlight', to: 'from-nebula-orange', border: 'border-starlight/40', bg: 'bg-starlight/10' },
  { from: 'from-nebula-mint', to: 'from-aurora', border: 'border-nebula-mint/40', bg: 'bg-nebula-mint/10' },
  { from: 'from-nebula-pink', to: 'from-nebula-purple', border: 'border-nebula-pink/40', bg: 'bg-nebula-pink/10' },
  { from: 'from-cosmic-300', to: 'from-aurora', border: 'border-cosmic-300/40', bg: 'bg-cosmic-300/10' },
];

interface ReplyCardProps {
  reply: Reply;
  index?: number;
}

export default function ReplyCard({ reply, index = 0 }: ReplyCardProps) {
  const colorScheme = parallelColors[index % parallelColors.length];

  return (
    <div
      className={`relative p-5 sm:p-6 rounded-2xl border backdrop-blur-sm animate-fade-in-up ${colorScheme.bg} ${colorScheme.border}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`absolute -top-3 left-6 h-6 w-6 rounded-t-full border-x-2 border-t-2 ${colorScheme.border} ${colorScheme.bg}`} />

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-gradient-to-br ${colorScheme.from}/20 ${colorScheme.to}/20 flex items-center justify-center shadow-inner`}>
          <Globe2 className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-serif-sc text-base sm:text-lg font-semibold text-white">
              {reply.senderName}
            </h4>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10">
              <Sparkles className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{reply.fromParallel}</span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-white/85 leading-relaxed whitespace-pre-line mb-4">
            {reply.content}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {reply.emotion && (
              <EmotionTag name={reply.emotion} size="sm" />
            )}
            <span className="text-xs text-white/50">
              {formatDate(reply.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
