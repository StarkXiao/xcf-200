import { useEffect, useState, useCallback } from 'react';
import { Orbit, RefreshCw, Users, BookOpen, Sparkles, Target } from 'lucide-react';
import { parallelMatchApi } from '@/api/parallelMatch';
import { MatchCard, TopicCard, MatchStatsCard, MatchRulesCard } from '@/components/ParallelMatch';
import type { ParallelMatchResult, ParallelTopic, ParallelMatchStats, ParallelMatchRule } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

type TabType = 'recommendations' | 'topics';

export default function ParallelMatch() {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('recommendations');
  const [recommendations, setRecommendations] = useState<ParallelMatchResult[]>([]);
  const [topics, setTopics] = useState<ParallelTopic[]>([]);
  const [stats, setStats] = useState<ParallelMatchStats | null>(null);
  const [matchRules, setMatchRules] = useState<ParallelMatchRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await parallelMatchApi.getRecommendations(user.id, 12);
      if (res.success && res.data) {
        setRecommendations(res.data.recommendations);
        setTopics(res.data.topics);
        setStats(res.data.stats);
        setMatchRules(res.data.matchRules);
      }
    } catch {
      showToast({ type: 'error', message: '加载匹配数据失败' });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInteract = async (match: ParallelMatchResult, type: 'wave' | 'resonate' | 'invite') => {
    if (!isAuthenticated || !user) {
      showToast({ type: 'warning', message: '请先登录后再互动' });
      return;
    }

    try {
      const typeLabels = { wave: '星波', resonate: '共鸣', invite: '邀信' };
      await parallelMatchApi.submitInteraction({
        fromUserId: user.id,
        toUserId: match.userId,
        type,
        message: `${user.username} 向你发送了${typeLabels[type]}`,
      });
      showToast({ type: 'success', message: `${typeLabels[type]}已发送给 ${match.username} ✨` });
    } catch {
      showToast({ type: 'error', message: '互动发送失败，请稍后再试' });
    }
  };

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container">
        <section className="mb-8">
          <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-nebula-purple/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-aurora/15 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-purple/10 border border-nebula-purple/20 mb-4">
                    <Orbit className="w-4 h-4 text-nebula-purple" />
                    <span className="text-sm font-medium text-nebula-purple/90">平行宇宙匹配</span>
                  </div>
                  <h1 className="font-serif-sc text-3xl sm:text-4xl font-bold text-white mb-2">
                    在平行宇宙寻找同频灵魂
                  </h1>
                  <p className="text-white/60 max-w-xl">
                    基于你的情绪标签、信件主题和活跃行为，系统在浩瀚星海中为你匹配最有可能产生共鸣的平行旅人。
                  </p>
                </div>

                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 text-sm shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  重新匹配
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MatchStatsCard
                    icon={<Users className="w-5 h-5" />}
                    label="匹配灵魂"
                    value={stats.matchedUsers}
                    color="text-nebula-purple"
                    bgColor="bg-nebula-purple/10"
                  />
                  <MatchStatsCard
                    icon={<BookOpen className="w-5 h-5" />}
                    label="内容专题"
                    value={stats.totalTopics}
                    color="text-starlight"
                    bgColor="bg-starlight/10"
                  />
                  <MatchStatsCard
                    icon={<Target className="w-5 h-5" />}
                    label="最高匹配"
                    value={stats.topMatchScore ? `${stats.topMatchScore}%` : '--'}
                    color="text-aurora"
                    bgColor="bg-aurora/10"
                  />
                  <MatchStatsCard
                    icon={<Sparkles className="w-5 h-5" />}
                    label="情感覆盖"
                    value={stats.emotionCoverage}
                    color="text-nebula-pink"
                    bgColor="bg-nebula-pink/10"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {matchRules.length > 0 && <MatchRulesCard rules={matchRules} />}

        <section className="mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-nebula-purple/20 text-nebula-purple shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Users className="w-4 h-4" />
              同频灵魂
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'topics'
                  ? 'bg-starlight/20 text-starlight shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              内容专题
            </button>
          </div>
        </section>

        {activeTab === 'recommendations' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
                <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                  平行宇宙推荐
                </h2>
                {recommendations.length > 0 && (
                  <span className="text-sm text-white/50">
                    发现 {recommendations.length} 个同频灵魂
                  </span>
                )}
              </div>
            </div>

            {loading && recommendations.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : !isAuthenticated ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">🌌</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  登录后解锁平行宇宙匹配
                </p>
                <p className="text-sm text-white/50 mb-6">
                  系统将根据你的情感标签、信件主题和活跃行为，为你寻找平行世界的同频灵魂
                </p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">🔭</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  还没有找到匹配的灵魂
                </p>
                <p className="text-sm text-white/50 mb-6">
                  多写几封信、记录更多情绪，让系统更好地了解你
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {recommendations.map((match, index) => (
                  <MatchCard
                    key={match.userId}
                    match={match}
                    index={index}
                    onInteract={handleInteract}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'topics' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-starlight to-nebula-pink" />
                <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                  推荐内容专题
                </h2>
                {topics.length > 0 && (
                  <span className="text-sm text-white/50">
                    {topics.length} 个专题待探索
                  </span>
                )}
              </div>
            </div>

            {loading && topics.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  暂无推荐专题
                </p>
                <p className="text-sm text-white/50">
                  更多信件正在路上，专题将根据内容动态生成
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <TopicCard topic={topic} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {stats && stats.dimensionAverages.length > 0 && (
          <section className="mt-10">
            <div className="glass-card p-5 sm:p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-aurora to-nebula-mint" />
                <h3 className="font-serif-sc text-lg font-semibold text-white">匹配维度概览</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.dimensionAverages.map(dim => (
                  <div key={dim.key} className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-2xl font-bold text-white mb-1">{dim.average}%</p>
                    <p className="text-xs text-white/50">{dim.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
