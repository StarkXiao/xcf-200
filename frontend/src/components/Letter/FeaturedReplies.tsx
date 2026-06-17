import type { Reply } from '@/types';
import { Crown, Sparkles } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { formatDate } from '@/utils/helpers';

interface FeaturedRepliesProps {
  replies: Reply[];
  letterId: string;
}

export default function FeaturedReplies({ replies, letterId }: FeaturedRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6 border-starlight/30">
      <div className="flex items-center gap-2 mb-5">
        <Crown className="w-5 h-5 text-starlight" />
        <h4 className="font-serif-sc text-lg font-semibold text-white">精选回复</h4>
        <span className="text-sm text-white/50">{replies.length} 条</span>
      </div>

      <div className="space-y-4">
        {replies.slice(0, 3).map((reply, index) => (
          <div
            key={reply.id}
            className="relative p-4 rounded-xl bg-gradient-to-br from-starlight/10 via-transparent to-aurora/10 border border-starlight/20"
          >
            <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-starlight/30 to-nebula-orange/30 border border-starlight/40 text-[10px] font-medium text-starlight">
              <Sparkles className="w-2.5 h-2.5" />
              <span>TOP {index + 1}</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-white text-sm">{reply.senderName}</span>
              {reply.emotion && <EmotionTag name={reply.emotion} size="sm" />}
            </div>

            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line mb-3">
              {reply.content.length > 150
                ? reply.content.substring(0, 150) + '...'
                : reply.content}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">{formatDate(reply.createdAt)}</span>
              {reply.likes && reply.likes > 0 && (
                <span className="text-xs text-nebula-pink/80">💫 {reply.likes}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
