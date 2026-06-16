import { useState, useEffect, useCallback } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { achievementsApi } from '@/api/achievements';
import AchievementOverview from '@/components/Achievement/AchievementOverview';
import LevelProgress from '@/components/Achievement/LevelProgress';
import TaskCard from '@/components/Achievement/TaskCard';
import BadgeCard from '@/components/Achievement/BadgeCard';
import type { AchievementCenterData, AchievementCategory } from '@/types';

type TabKey = 'tasks' | 'badges';

export default function AchievementCenter() {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const [data, setData] = useState<AchievementCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await achievementsApi.getAchievementCenter(user.id);
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch achievement center:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async (taskId: string) => {
    if (!user || claimingTaskId) return;
    setClaimingTaskId(taskId);
    try {
      const response = await achievementsApi.claimReward(user.id, taskId);
      if (response.data.success) {
        showToast({ type: 'success', message: response.data.message || '奖励领取成功 ✨' });
        await fetchData();
      } else {
        showToast({ type: 'error', message: response.data.message || '领取失败' });
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.response?.data?.message || '领取失败，请稍后重试'
      });
    } finally {
      setClaimingTaskId(null);
    }
  };

  const tabs: { key: TabKey; label: string; icon: typeof Trophy }[] = [
    { key: 'tasks', label: '任务体系', icon: Trophy },
    { key: 'badges', label: '徽章收集', icon: Sparkles },
  ];

  const categoryFilters: { key: AchievementCategory | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'writing', label: '写信' },
    { key: 'replying', label: '回信' },
    { key: 'sharing', label: '分享' },
    { key: 'emotion', label: '情绪' },
  ];

  const filteredTasks = data
    ? categoryFilter === 'all'
      ? data.tasks
      : data.tasks.filter(t => t.category === categoryFilter)
    : [];

  const earnedBadges = data ? data.badges.filter(b => b.isEarned) : [];
  const unearnedBadges = data ? data.badges.filter(b => !b.isEarned) : [];
  const sortedBadges = [...earnedBadges, ...unearnedBadges];

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <p className="text-white/40 text-lg mb-2">请先登录</p>
          <p className="text-white/30 text-sm">登录后即可查看你的成就中心</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            星邮成就中心
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            每一封信、每一次回信、每一份分享与情绪探索，都在点亮你专属的星途。完成任务、收集徽章、提升等级，成为星邮局最闪耀的信使。
          </p>
        </div>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-white/5 rounded-2xl" />
            <div className="h-36 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            <LevelProgress
              userProgress={data.userProgress}
              levels={data.levels}
            />

            <div className="mt-6 mb-6">
              <AchievementOverview userProgress={data.userProgress} />
            </div>

            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white border-b-2 border-amber-400'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'tasks' && (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {categoryFilters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setCategoryFilter(f.key)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        categoryFilter === f.key
                          ? 'bg-white/15 text-white shadow-glow-sm'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 animate-stagger">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClaim={handleClaim}
                      claiming={claimingTaskId === task.id}
                    />
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-white/30 text-sm">暂无该类别的任务</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'badges' && (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-white/40">
                  <Sparkles className="w-4 h-4" />
                  已收集 {earnedBadges.length}/{data.badges.length} 枚徽章
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-stagger">
                  {sortedBadges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">暂无成就数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
