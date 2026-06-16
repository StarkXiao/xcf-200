import { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, Trophy, TrendingUp, Calendar } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { activitiesApi } from '@/api/activities';
import ActivityCard from '@/components/Activity/ActivityCard';
import type { Activity } from '@/types';

export default function Community() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'settled'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 0
  });

  const tabs = [
    { key: 'all', label: '全部活动', icon: Sparkles },
    { key: 'active', label: '进行中', icon: TrendingUp },
    { key: 'upcoming', label: '即将开始', icon: Calendar },
    { key: 'settled', label: '已结束', icon: Trophy }
  ];

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await activitiesApi.getActivities({
        page: pagination.page,
        limit: pagination.limit,
        status,
        sort: 'latest'
      });

      let data = response.data.data;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        data = data.filter((a: Activity) =>
          a.title.toLowerCase().includes(kw) ||
          a.description.toLowerCase().includes(kw) ||
          a.theme.toLowerCase().includes(kw)
        );
      }

      setActivities(data);
      setPagination({
        ...pagination,
        total: response.data.total,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [activeTab]);

  useEffect(() => {
    fetchActivities();
  }, [activeTab, pagination.page]);

  const stats = [
    { label: '进行中活动', value: activities.filter(a => a.status === 'active').length, icon: TrendingUp, color: 'text-green-400' },
    { label: '即将开始', value: activities.filter(a => a.status === 'upcoming').length, icon: Calendar, color: 'text-blue-400' },
    { label: '已完成活动', value: activities.filter(a => a.status === 'settled').length, icon: Trophy, color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent">
            星球社群
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            参与主题征文活动，用文字连接每一个孤独的灵魂。在这里，每个故事都值得被看见，每份热爱都能收获荣誉。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="flex-1 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-glow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索活动..."
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl h-80 animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg mb-2">暂无活动</p>
            <p className="text-white/30 text-sm">
              {searchKeyword ? '试试其他关键词' : '新活动即将上线，敬请期待'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-white/50 text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
