import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Users, FileText, Heart, Trophy, Clock,
  User, CheckCircle, XCircle, AlertCircle, ArrowLeft,
  ListOrdered, Plus, Star
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { activitiesApi } from '@/api/activities';
import type { Activity, Registration, Work, RankingItem, ActivityStats } from '@/types';
import WorkCard from '@/components/Activity/WorkCard';
import RankingList from '@/components/Activity/RankingList';
import RegisterModal from '@/components/Activity/RegisterModal';
import SubmitWorkModal from '@/components/Activity/SubmitWorkModal';

type TabType = 'works' | 'ranking' | 'prizes' | 'rules';

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [myRegistration, setMyRegistration] = useState<Registration | null>(null);
  const [myWorks, setMyWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('works');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [worksSort, setWorksSort] = useState<'latest' | 'popular'>('latest');

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'works', label: '作品展示', icon: FileText },
    { key: 'ranking', label: '点赞排行', icon: ListOrdered },
    { key: 'prizes', label: '奖项设置', icon: Trophy },
    { key: 'rules', label: '活动规则', icon: AlertCircle }
  ];

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [activityRes, statsRes, worksRes, rankingRes] = await Promise.all([
        activitiesApi.getActivity(id),
        activitiesApi.getActivityStats(id, user?.id),
        activitiesApi.getWorks(id, { page: 1, limit: 12, sort: worksSort }),
        activitiesApi.getRanking(id, 20)
      ]);

      setActivity(activityRes.data.data);
      setStats(statsRes.data.data);
      setWorks(worksRes.data.data);
      setRankings(rankingRes.data.data);
      setMyRegistration(statsRes.data.data.myRegistration || null);
      setMyWorks(statsRes.data.data.myWorks || []);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, user?.id, worksSort]);

  const canRegister = activity &&
    (activity.status === 'active') &&
    (activity.currentStage === 'registration') &&
    !myRegistration;

  const canSubmitWork = activity &&
    (activity.status === 'active') &&
    (activity.currentStage === 'submission' || activity.currentStage === 'registration') &&
    myRegistration?.status === 'approved' &&
    myWorks.length < 3;

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm">
            <Clock className="w-4 h-4" />
            审核中
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-sm">
            <CheckCircle className="w-4 h-4" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-sm">
            <XCircle className="w-4 h-4" />
            未通过
          </span>
        );
      default:
        return null;
    }
  };

  const timeline = activity ? [
    { key: 'registration', label: '报名阶段', date: activity.registrationStart, endDate: activity.registrationEnd, icon: User },
    { key: 'submission', label: '作品提交', date: activity.submissionStart, endDate: activity.submissionEnd, icon: Plus },
    { key: 'voting', label: '点赞投票', date: activity.votingStart, endDate: activity.votingEnd, icon: Heart },
    { key: 'settled', label: '结果公布', date: activity.settlementDate, icon: Trophy }
  ] : [];

  if (loading && !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-aurora/30 border-t-aurora rounded-full" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-4">活动不存在</p>
          <button
            onClick={() => navigate('/activities')}
            className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            返回活动列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <button
          onClick={() => navigate('/activities')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回活动列表
        </button>

        <div className="bg-gradient-to-br from-cosmic-900/50 via-nebula-purple/20 to-aurora/20 rounded-3xl p-8 mb-8 border border-white/10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 w-40 h-40 rounded-2xl bg-white/10 flex items-center justify-center text-8xl">
              {activity.coverImage}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-aurora/20 text-aurora text-sm font-medium">
                  #{activity.theme}
                </span>
                {activity.status === 'active' && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium animate-pulse">
                    {activity.stageLabel}
                  </span>
                )}
                {activity.status === 'voting' && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium animate-pulse">
                    {activity.stageLabel}
                  </span>
                )}
                {activity.status === 'settled' && (
                  <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm font-medium">
                    {activity.stageLabel}
                  </span>
                )}
                {activity.status === 'upcoming' && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                    {activity.stageLabel}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-3">{activity.title}</h1>
              <p className="text-white/70 mb-6 leading-relaxed">{activity.description}</p>

              <div className="flex flex-wrap gap-6 text-sm text-white/60 mb-6">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-aurora" />
                  {stats?.totalParticipants || 0} 人参与
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-nebula-pink" />
                  {stats?.totalWorks || 0} 篇作品
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  {stats?.totalLikes || 0} 次点赞
                </span>
              </div>

              {myRegistration && (
                <div className="inline-flex items-center gap-4 mb-4">
                  {getRegistrationStatusBadge(myRegistration.status)}
                  {myRegistration.reviewComment && (
                    <span className="text-sm text-white/50">
                      {myRegistration.reviewComment}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!user ? (
                  <Link
                    to="/login"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cosmic-500 to-aurora text-white font-medium hover:shadow-glow transition-all"
                  >
                    登录后参与
                  </Link>
                ) : canRegister ? (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cosmic-500 to-aurora text-white font-medium hover:shadow-glow transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    立即报名
                  </button>
                ) : canSubmitWork ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cosmic-500 to-aurora text-white font-medium hover:shadow-glow transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    提交作品
                  </button>
                ) : myRegistration?.status === 'pending' ? (
                  <div className="px-6 py-3 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    等待审核中
                  </div>
                ) : myRegistration?.status === 'rejected' ? (
                  <div className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    报名未通过
                  </div>
                ) : myWorks.length >= 3 ? (
                  <div className="px-6 py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    已提交 {myWorks.length}/3 篇作品
                  </div>
                ) : activity.status === 'upcoming' ? (
                  <div className="px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    活动即将开始
                  </div>
                ) : activity.status === 'settled' ? (
                  <div className="px-6 py-3 rounded-xl bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    活动已结束
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-white font-medium mb-4">活动时间线</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {timeline.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activity.currentStage === item.key;
                const isPast = timeline.findIndex(t => t.key === activity.currentStage) > idx ||
                  (activity.status === 'settled' && idx < timeline.length - 1) ||
                  (activity.status === 'settled' && idx === timeline.length - 1);

                return (
                  <div
                    key={item.key}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-aurora/10 border-aurora/30 shadow-glow-sm'
                        : isPast
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isActive ? 'bg-aurora/20 text-aurora' : isPast ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className={`font-medium mb-1 ${
                      isActive ? 'text-aurora' : isPast ? 'text-white' : 'text-white/40'
                    }`}>
                      {item.label}
                    </h4>
                    <p className="text-xs text-white/40">
                      {new Date(item.date).toLocaleDateString('zh-CN')}
                      {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('zh-CN')}`}
                    </p>
                    {idx < timeline.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-white/10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-white border-b-2 border-aurora bg-white/5'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'works' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">排序：</span>
                    <button
                      onClick={() => setWorksSort('latest')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        worksSort === 'latest'
                          ? 'bg-aurora/20 text-aurora'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      最新
                    </button>
                    <button
                      onClick={() => setWorksSort('popular')}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        worksSort === 'popular'
                          ? 'bg-aurora/20 text-aurora'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      最热
                    </button>
                  </div>
                </div>

                {works.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
                    <p className="text-white/40 mb-2">暂无作品</p>
                    <p className="text-white/30 text-sm">
                      {canSubmitWork ? '成为第一个提交作品的人吧！' : '活动进行中，期待创作者的精彩作品'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {works.map((work) => (
                      <WorkCard key={work.id} work={work} activityId={activity.id} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ranking' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-aurora" />
                  <h3 className="text-lg font-medium text-white">点赞排行榜</h3>
                </div>
                <RankingList rankings={rankings} activityId={activity.id} />
              </div>
            )}

            {activeTab === 'prizes' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-aurora" />
                  <h3 className="text-lg font-medium text-white">奖项设置</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.prizes.map((prize, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">
                          {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white">{prize.title}</h4>
                            <span className="text-xs text-white/40">
                              第{prize.rank}名
                            </span>
                          </div>
                          <p className="text-aurora text-sm mb-1">{prize.honor}</p>
                          <p className="text-white/50 text-sm">{prize.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle className="w-5 h-5 text-aurora" />
                  <h3 className="text-lg font-medium text-white">活动规则</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <ol className="space-y-3">
                    {activity.rules.map((rule, idx) => (
                      <li key={idx} className="flex gap-3 text-white/70">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-aurora/20 text-aurora text-sm flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        activityId={activity.id}
        activityTitle={activity.title}
        onSuccess={fetchData}
      />

      <SubmitWorkModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        activityId={activity.id}
        activityTitle={activity.title}
        onSuccess={fetchData}
      />
    </div>
  );
}
