import { useEffect, useState } from 'react';
import { Award, TrendingUp, MessageSquare, Star, Sparkles } from 'lucide-react';
import { strangerReplyApi } from '@/api/strangerReply';
import type { UserReplyStats } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

interface UserReplyStatsCardProps {
  userId?: string;
}

export default function UserReplyStatsCard({ userId }: UserReplyStatsCardProps) {
  const { user: currentUser } = useAuthStore();
  const { showToast } = useUIStore();

  const [stats, setStats] = useState<UserReplyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const fetchStats = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const res = await strangerReplyApi.getUserReplyStats(targetUserId);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载统计数据失败' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-starlight rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-starlight/20 to-aurora/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-starlight" />
          </div>
          <div>
            <h3 className="font-serif-sc text-lg font-semibold text-white">回信成就</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{stats.level.icon}</span>
              <span className="text-sm font-medium text-starlight">{stats.level.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-white/50">升级进度</span>
          <span className="text-starlight">
            {stats.nextLevelProgress.next
              ? `${stats.nextLevelProgress.current}/${stats.nextLevelProgress.next} 封回信`
              : '已达最高等级'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-starlight via-aurora to-nebula-pink rounded-full transition-all duration-500"
            style={{ width: `${stats.nextLevelProgress.progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-aurora/5 border border-aurora/10">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-aurora" />
            <span className="text-xs text-white/60">寄出回信</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalReplies}</p>
        </div>

        <div className="p-3 rounded-xl bg-nebula-pink/5 border border-nebula-pink/10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-nebula-pink" />
            <span className="text-xs text-white/60">收到回信</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.receivedReplies}</p>
        </div>

        <div className="p-3 rounded-xl bg-starlight/5 border border-starlight/10">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-starlight" />
            <span className="text-xs text-white/60">平均评分</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.averageRating > 0 ? `${stats.averageRating} 星` : '暂无'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-nebula-purple/5 border border-nebula-purple/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-nebula-purple" />
            <span className="text-xs text-white/60">收到评价</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalReviews}</p>
        </div>
      </div>
    </div>
  );
}
