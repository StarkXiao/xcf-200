import { Sparkles, MessageCircle, Clock, Heart } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { ReplyTask } from '@/types';
import { formatDate, getRecipientTypeLabel } from '@/utils/helpers';

interface ReplyTaskCardProps {
  task: ReplyTask;
  index?: number;
  onReply: () => void;
}

const stamps = ['💌', '✉️', '📮', '💝', '🌸', '🌙', '⭐', '🦋'];

export default function ReplyTaskCard({ task, index = 0, onReply }: ReplyTaskCardProps) {
  const recipientType = getRecipientTypeLabel(task.recipientType);
  const stamp = stamps[index % stamps.length];
  const matchPercentage = Math.round((task.matchScore / task.matchMaxScore) * 100);

  const handleReplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReply();
  };

  return (
    <div
      className="group relative animate-fade-in-up"
      style={{ animationDelay: `${(index % 6) * 0.08}s` }}
    >
      <div className="paper-card p-5 sm:p-6 h-full transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-paper-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-aurora via-nebula-purple to-nebula-pink opacity-80" />

        <div className="absolute top-3 right-3 w-11 h-11 rounded-lg bg-gradient-to-br from-aurora/80 to-nebula-pink/80 flex items-center justify-center shadow-md transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
          <span className="text-xl">{stamp}</span>
        </div>

        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-starlight/90 text-white text-xs font-bold shadow-md">
            <Sparkles className="w-3 h-3" />
            <span>{matchPercentage}% 匹配</span>
          </div>
        </div>

        <div className="pt-10 pb-3 pr-12">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${recipientType.color}`}>
            <span>{recipientType.icon}</span>
            <span>致{recipientType.label}</span>
          </div>
          <h3 className="font-serif-sc text-lg font-semibold text-cosmic-900 leading-snug line-clamp-1">
            {task.title}
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-cosmic-800/80 leading-relaxed line-clamp-4 whitespace-pre-line">
            {task.content}
          </p>
        </div>

        <div className="mb-4 min-h-[28px]">
          <div className="flex flex-wrap gap-1.5">
            {task.emotions.slice(0, 3).map((emo) => (
              <EmotionTag key={emo} name={emo} size="sm" />
            ))}
            {task.emotions.length > 3 && (
              <span className="inline-flex items-center text-xs text-cosmic-700/60 px-2">
                +{task.emotions.length - 3}
              </span>
            )}
          </div>
        </div>

        {task.matchDetails && task.matchDetails.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-starlight/5 border border-starlight/10">
            <p className="text-xs text-cosmic-700/60 mb-2">匹配原因</p>
            <div className="flex flex-wrap gap-1.5">
              {task.matchDetails.slice(0, 2).map((detail, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-aurora/10 text-aurora/80"
                  title={detail.reason}
                >
                  {detail.reason}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-cosmic-900/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-cosmic-700/70">
              <Heart className="w-3.5 h-3.5 text-nebula-pink" />
              <span>{task.repliesCount} 回信</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-cosmic-700/70">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(task.createdAt)}</span>
            </div>
          </div>

          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-aurora to-nebula-pink text-white text-xs font-medium hover:shadow-lg hover:shadow-aurora/30 transition-all transform hover:scale-105"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            写回信
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-br from-transparent via-transparent to-paper-dark/60 rounded-tr-xl" />
      </div>
    </div>
  );
}
