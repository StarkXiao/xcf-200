import { Link } from 'react-router-dom';
import { Heart, Eye, Calendar } from 'lucide-react';
import type { Work } from '@/types';
import { cn } from '@/utils/helpers';
import EmotionTag from '@/components/Emotion/EmotionTag';

interface WorkCardProps {
  work: Work;
  activityId: string;
  rank?: number;
  showRank?: boolean;
}

export default function WorkCard({ work, activityId, rank, showRank = false }: WorkCardProps) {
  const rankColors = {
    1: 'from-yellow-400 to-amber-500',
    2: 'from-gray-300 to-gray-400',
    3: 'from-amber-600 to-amber-700'
  };

  return (
    <Link
      to={`/activities/${activityId}/works/${work.id}`}
      className="group block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      <div className="p-5">
        {showRank && rank && (
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br',
              rank <= 3 ? rankColors[rank as 1 | 2 | 3] : 'from-gray-600 to-gray-700'
            )}>
              {rank}
            </div>
            <span className="text-xs text-white/60">
              {rank === 1 ? '🏆 第一名' : rank === 2 ? '🥈 第二名' : rank === 3 ? '🥉 第三名' : `第 ${rank} 名`}
            </span>
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{work.userAvatar}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {work.username}
              </span>
              {work.isAnonymous && (
                <span className="text-xs text-white/40">（匿名）</span>
              )}
            </div>
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(work.publishedAt || work.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        <h4 className="text-base font-bold text-white mb-2 group-hover:text-aurora transition-colors">
          {work.title}
        </h4>

        <p className="text-white/60 text-sm mb-3 line-clamp-3">
          {work.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {work.emotions.slice(0, 3).map((emotion, idx) => (
              <EmotionTag key={idx} name={emotion} size="sm" />
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {work.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {work.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
