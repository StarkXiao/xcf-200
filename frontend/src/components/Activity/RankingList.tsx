import { Link } from 'react-router-dom';
import { Crown, Heart, Eye } from 'lucide-react';
import type { RankingItem } from '@/types';
import { cn } from '@/utils/helpers';

interface RankingListProps {
  rankings: RankingItem[];
  activityId: string;
}

export default function RankingList({ rankings, activityId }: RankingListProps) {
  const rankStyles = {
    1: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
    2: 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30',
    3: 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30'
  };

  const rankIcons = {
    1: '👑',
    2: '🥈',
    3: '🥉'
  };

  return (
    <div className="space-y-3">
      {rankings.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无排行数据</p>
        </div>
      ) : (
        rankings.map((item) => (
          <Link
            key={item.workId}
            to={`/activities/${activityId}/works/${item.workId}`}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:border-white/30',
              rankStyles[item.rank as 1 | 2 | 3] || 'bg-white/5 border-white/10 hover:bg-white/10'
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              {item.rank <= 3 ? (
                <span className="text-2xl">{rankIcons[item.rank as 1 | 2 | 3]}</span>
              ) : (
                <span className="text-lg font-bold text-white/60">#{item.rank}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate group-hover:text-aurora transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  {item.isAnonymous ? '🎭' : item.userAvatar}
                  {item.isAnonymous ? '匿名创作者' : item.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-white/50">
                <Eye className="w-4 h-4" />
                {item.views}
              </span>
              <span className="flex items-center gap-1 text-nebula-pink">
                <Heart className="w-4 h-4 fill-current" />
                {item.likes}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
