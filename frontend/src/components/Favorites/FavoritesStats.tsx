import { Bookmark, FolderOpen, Bell, CheckCircle2, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import type { FavoriteStats } from '@/types';
import { formatDate } from '@/utils/helpers';

interface FavoritesStatsProps {
  stats: FavoriteStats | null;
  loading?: boolean;
}

export default function FavoritesStats({ stats, loading }: FavoritesStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: '收藏总数',
      value: stats.totalFavorites,
      icon: Bookmark,
      color: 'text-starlight',
      bg: 'bg-starlight/15',
      iconColor: 'text-starlight',
    },
    {
      label: '分组数量',
      value: stats.totalGroups,
      icon: FolderOpen,
      color: 'text-aurora',
      bg: 'bg-aurora/15',
      iconColor: 'text-aurora',
    },
    {
      label: '待回看',
      value: stats.pendingReminders,
      icon: Bell,
      color: 'text-nebula-orange',
      bg: 'bg-nebula-orange/15',
      iconColor: 'text-nebula-orange',
    },
    {
      label: '已回看',
      value: stats.completedReminders,
      icon: CheckCircle2,
      color: 'text-nebula-mint',
      bg: 'bg-nebula-mint/15',
      iconColor: 'text-nebula-mint',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4 text-center">
              <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{card.value}</div>
              <div className="text-xs text-white/60">{card.label}</div>
            </div>
          );
        })}
      </div>

      {(stats.weeklyReviewCount > 0 || stats.lastReviewAt) && (
        <div className="glass-card p-5">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-aurora" />
            回看动态
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-aurora/8 border border-aurora/20">
              <div className="text-xs text-white/50 mb-1">本周回看</div>
              <div className="text-xl font-bold text-aurora">{stats.weeklyReviewCount} 封</div>
            </div>
            <div className="p-3 rounded-xl bg-starlight/8 border border-starlight/20">
              <div className="text-xs text-white/50 mb-1">上次回看</div>
              <div className="text-sm font-medium text-starlight flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {stats.lastReviewAt ? formatDate(stats.lastReviewAt) : '暂无记录'}
              </div>
            </div>
          </div>
        </div>
      )}

      {stats.groupDistribution && stats.groupDistribution.some((g) => g.count > 0) && (
        <div className="glass-card p-5">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-nebula-purple" />
            分组分布
          </h4>
          <div className="space-y-3">
            {stats.groupDistribution
              .filter((g) => g.count > 0)
              .map((group) => {
                const percentage = stats.totalFavorites > 0
                  ? Math.round((group.count / stats.totalFavorites) * 100)
                  : 0;
                return (
                  <div key={group.groupId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/80">{group.groupName}</span>
                      <span className="text-xs text-white/50">{group.count} 封 ({percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-aurora to-nebula-purple transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {stats.emotionDistribution && Object.keys(stats.emotionDistribution).length > 0 && (
        <div className="glass-card p-5">
          <h4 className="font-medium text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-nebula-pink" />
            收藏情绪分布
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.emotionDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([emotion, count]) => (
                <span
                  key={emotion}
                  className="px-3 py-1.5 rounded-full bg-nebula-pink/10 text-nebula-pink text-xs font-medium border border-nebula-pink/20"
                >
                  {emotion} × {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
