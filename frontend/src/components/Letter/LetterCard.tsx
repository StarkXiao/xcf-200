import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Clock, Sparkles, Bookmark, BookmarkPlus, Bell } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import useFavoriteStore from '@/store/useFavoriteStore';
import type { LetterListItem } from '@/types';
import { formatDate, getRecipientTypeLabel, truncateText } from '@/utils/helpers';

interface LetterCardProps {
  letter: LetterListItem;
  index?: number;
  onFavoriteClick?: (letterId: string, e: React.MouseEvent) => void;
  onReminderClick?: (letterId: string, e: React.MouseEvent) => void;
  showFavorite?: boolean;
}

const stamps = ['🌙', '⭐', '💫', '🌟', '✨', '☄️', '🪐', '🌌'];

export default function LetterCard({ letter, index = 0, onFavoriteClick, onReminderClick, showFavorite = true }: LetterCardProps) {
  const recipientType = getRecipientTypeLabel(letter.recipientType);
  const stamp = stamps[index % stamps.length];
  const isFavorited = useFavoriteStore((s) => s.isFavorited(letter.id));

  return (
    <div className="group block animate-fade-in-up" style={{ animationDelay: `${(index % 8) * 0.08}s` }}>
      <div className="paper-card p-5 sm:p-6 h-full transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-paper-lg relative">
        <div className="absolute top-3 right-3 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-nebula-pink/80 to-starlight/80 flex items-center justify-center shadow-md transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
          <span className="text-2xl sm:text-2xl">{stamp}</span>
        </div>

        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-nebula-purple via-cosmic-400 to-aurora opacity-80" />

        <div className="mb-3 pr-14 sm:pr-16">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${recipientType.color}`}>
            <span>{recipientType.icon}</span>
            <span>致{recipientType.label}</span>
          </div>
          <Link to={`/letter/${letter.id}`} className="block">
            <h3 className="font-serif-sc text-lg sm:text-xl font-semibold text-cosmic-900 leading-snug line-clamp-1 hover:text-cosmic-700 transition-colors">
              {letter.title}
            </h3>
          </Link>
        </div>

        <Link to={`/letter/${letter.id}`} className="block">
          <div className="mb-4">
            <p className="text-sm sm:text-base text-cosmic-800/80 leading-relaxed line-clamp-3 whitespace-pre-line">
              {letter.content}
            </p>
          </div>
        </Link>

        <div className="mb-4 min-h-[28px]">
          <div className="flex flex-wrap gap-1.5">
            {letter.emotions.slice(0, 3).map((emo) => (
              <EmotionTag key={emo} name={emo} size="sm" />
            ))}
            {letter.emotions.length > 3 && (
              <span className="inline-flex items-center text-xs text-cosmic-700/60 px-2">
                +{letter.emotions.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-cosmic-900/10">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-cosmic-700/70">
            <Sparkles className="w-3.5 h-3.5 text-starlight" />
            <span className="truncate max-w-[120px]">{letter.senderName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-cosmic-700/60">
            {showFavorite && onFavoriteClick && (
              <button
                onClick={(e) => onFavoriteClick(letter.id, e)}
                className={`flex items-center gap-1 text-xs sm:text-sm transition-all p-1 rounded-lg hover:bg-cosmic-900/10 ${
                  isFavorited ? 'text-starlight' : 'text-cosmic-700/50 hover:text-cosmic-700/80'
                }`}
                title={isFavorited ? '已收藏' : '收藏'}
              >
                {isFavorited ? (
                  <Bookmark className="w-3.5 h-3.5 fill-starlight" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {isFavorited && onReminderClick && (
              <button
                onClick={(e) => onReminderClick(letter.id, e)}
                className="flex items-center gap-1 text-xs sm:text-sm text-cosmic-700/50 hover:text-nebula-orange transition-all p-1 rounded-lg hover:bg-nebula-orange/10"
                title="设置回看提醒"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <Heart className="w-3.5 h-3.5 text-nebula-pink" />
              <span>{letter.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <MessageCircle className="w-3.5 h-3.5 text-aurora" />
              <span>{letter.repliesCount}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(letter.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-br from-transparent via-transparent to-paper-dark/60 rounded-tr-xl" />
      </div>
    </div>
  );
}
