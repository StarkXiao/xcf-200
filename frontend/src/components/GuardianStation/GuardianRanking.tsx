import { Trophy, Star, TrendingUp } from 'lucide-react';
import type { GuardianRankingItem } from '@/types';

interface GuardianRankingProps {
  ranking: GuardianRankingItem[];
  loading?: boolean;
}

export default function GuardianRanking({ ranking, loading }: GuardianRankingProps) {
  const rankColors = [
    'from-yellow-400 to-orange-500',
    'from-gray-300 to-gray-400',
    'from-amber-600 to-amber-700',
  ];

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-starlight" />
          守护员排行榜
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-starlight" />
        守护员排行榜
      </h3>

      <div className="space-y-3">
        {ranking.slice(0, 10).map((item, index) => (
          <div
            key={item.userId}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index < 3
                  ? `bg-gradient-to-br ${rankColors[index]} text-white`
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : item.rank}
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora/30 to-nebula-pink/30 flex items-center justify-center text-lg">
              {item.avatar || '👤'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium truncate">{item.username}</p>
                <span className="text-sm">{item.levelIcon}</span>
              </div>
              <p className="text-xs text-white/40">{item.level}</p>
            </div>

            <div className="text-right">
              <p className="text-white font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 text-starlight" />
                {item.score}
              </p>
              <p className="text-xs text-white/40">
                {item.totalReviews}审 / {item.totalInterventions}干
              </p>
            </div>
          </div>
        ))}

        {ranking.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/50">暂无排行数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
