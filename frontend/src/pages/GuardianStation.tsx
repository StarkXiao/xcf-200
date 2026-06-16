import { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  Heart,
  AlertTriangle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { guardianStationApi } from '@/api/guardianStation';
import {
  StatsOverview,
  ReviewTaskCard,
  InterventionCard,
  InterventionDetailModal,
  GuardianProfileCard,
  GuardianRanking,
  RiskLevelBadge,
} from '@/components/GuardianStation';
import type {
  GuardianStationStats,
  ReplyReviewTask,
  Intervention,
  GuardianProfile,
  GuardianRankingItem,
  GuardianSubmitReviewData,
  AddInterventionRecordData,
} from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

type TabType = 'overview' | 'review' | 'intervention' | 'ranking';

export default function GuardianStation() {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<GuardianStationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [reviewTasks, setReviewTasks] = useState<ReplyReviewTask[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('pending');
  const [reviewRiskFilter, setReviewRiskFilter] = useState<string>('');
  const [reviewTotal, setReviewTotal] = useState(0);

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionStatusFilter, setInterventionStatusFilter] = useState<string>('');
  const [interventionPriorityFilter, setInterventionPriorityFilter] = useState<string>('');
  const [interventionTotal, setInterventionTotal] = useState(0);

  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  const [guardianProfile, setGuardianProfile] = useState<GuardianProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [ranking, setRanking] = useState<GuardianRankingItem[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const tabs = [
    { key: 'overview' as TabType, label: '总览', icon: <Shield className="w-4 h-4" /> },
    { key: 'review' as TabType, label: '内容审核', icon: <Eye className="w-4 h-4" /> },
    { key: 'intervention' as TabType, label: '干预记录', icon: <Heart className="w-4 h-4" /> },
    { key: 'ranking' as TabType, label: '守护排行', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await guardianStationApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载统计数据失败' });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReviewTasks = async () => {
    if (!user) return;
    try {
      setReviewLoading(true);
      const res = await guardianStationApi.getReviewTasks({
        status: reviewStatusFilter || undefined,
        riskLevel: reviewRiskFilter || undefined,
        limit: 20,
      });
      if (res.success) {
        setReviewTasks(res.data);
        setReviewTotal(res.total);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载审核任务失败' });
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchInterventions = async () => {
    try {
      setInterventionLoading(true);
      const res = await guardianStationApi.getInterventions({
        status: interventionStatusFilter || undefined,
        priority: interventionPriorityFilter || undefined,
        limit: 20,
      });
      if (res.success) {
        setInterventions(res.data);
        setInterventionTotal(res.total);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载干预记录失败' });
    } finally {
      setInterventionLoading(false);
    }
  };

  const fetchGuardianProfile = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    try {
      setProfileLoading(true);
      const res = await guardianStationApi.getGuardianProfile(user.id);
      if (res.success) {
        setGuardianProfile(res.data);
      }
    } catch (err) {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchRanking = async () => {
    try {
      setRankingLoading(true);
      const res = await guardianStationApi.getGuardianRanking(20);
      if (res.success) {
        setRanking(res.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载排行榜失败' });
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGuardianProfile();
    fetchRanking();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'review') {
      fetchReviewTasks();
    } else if (activeTab === 'intervention') {
      fetchInterventions();
    }
  }, [activeTab, reviewStatusFilter, reviewRiskFilter, interventionStatusFilter, interventionPriorityFilter]);

  const handleApplyGuardian = async () => {
    if (!user) {
      showToast({ type: 'warning', message: '请先登录' });
      return;
    }
    try {
      setApplying(true);
      const res = await guardianStationApi.applyGuardian(user.id);
      if (res.success) {
        showToast({ type: 'success', message: '欢迎加入守护站！✨' });
        setGuardianProfile(res.data);
        fetchStats();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '申请失败' });
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (task: ReplyReviewTask, decision: 'approved' | 'rejected' | 'escalated') => {
    if (!user) return;
    
    let reason = '';
    if (decision === 'rejected') {
      reason = prompt('请输入驳回原因：') || '';
      if (!reason) return;
    } else if (decision === 'escalated') {
      reason = prompt('请输入升级原因：') || '';
      if (!reason) return;
    }

    try {
      const res = await guardianStationApi.submitReview({
        reviewId: task.id,
        decision,
        reason,
        reviewerId: user.id,
      });
      if (res.success) {
        showToast({ type: 'success', message: '审核已提交' });
        fetchReviewTasks();
        fetchStats();
        fetchGuardianProfile();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '审核失败' });
    }
  };

  const handleInterventionClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowInterventionModal(true);
  };

  const handleAddInterventionRecord = async (data: {
    type: string;
    content: string;
    status?: string;
    newType?: string;
  }) => {
    if (!user || !selectedIntervention) return;

    try {
      const res = await guardianStationApi.addInterventionRecord(
        selectedIntervention.id,
        {
          ...data,
          operatorId: user.id,
        } as AddInterventionRecordData
      );
      if (res.success) {
        showToast({ type: 'success', message: '记录已添加' });
        setSelectedIntervention(res.data);
        setInterventions(prev =>
          prev.map(i => (i.id === res.data.id ? res.data : i))
        );
        fetchStats();
        fetchGuardianProfile();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const isGuardian = guardianProfile?.isGuardian !== false;

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container">
        <section className="mb-8">
          <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-aurora/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-nebula-pink/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aurora/10 border border-aurora/20 mb-4">
                    <Shield className="w-4 h-4 text-aurora" />
                    <span className="text-sm font-medium text-aurora/90">匿名守护站</span>
                  </div>
                  <h1 className="font-serif-sc text-3xl sm:text-4xl font-bold text-white mb-2">
                    守护每一颗柔软的心
                  </h1>
                  <p className="text-white/60 max-w-xl">
                    在这里，我们共同守护匿名空间的温暖与安全。内容分级、互助审核、风险干预，让善意流动。
                  </p>
                </div>

                <button
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 text-sm self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              </div>

              <StatsOverview stats={stats} loading={statsLoading} />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-aurora/30 to-nebula-pink/30 text-white shadow-lg shadow-aurora/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-starlight" />
                  待审核任务
                  <span className="text-sm font-normal text-white/50">
                    ({stats?.reviews.pending || 0} 条)
                  </span>
                </h3>
                {reviewLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : reviewTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviewTasks.slice(0, 4).map((task) => (
                      <ReviewTaskCard
                        key={task.id}
                        task={task}
                        onApprove={(t) => handleReview(t, 'approved')}
                        onReject={(t) => handleReview(t, 'rejected')}
                        onEscalate={(t) => handleReview(t, 'escalated')}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/50">暂无待审核内容</p>
                  </div>
                )}
                {reviewTasks.length > 0 && (
                  <button
                    onClick={() => setActiveTab('review')}
                    className="mt-4 text-aurora text-sm hover:underline"
                  >
                    查看全部 →
                  </button>
                )}
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-nebula-pink" />
                  待处理干预
                  <span className="text-sm font-normal text-white/50">
                    ({stats?.interventions.pending || 0} 条)
                  </span>
                </h3>
                {interventionLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : interventions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {interventions.slice(0, 4).map((intervention) => (
                      <InterventionCard
                        key={intervention.id}
                        intervention={intervention}
                        onClick={handleInterventionClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/50">暂无待处理干预</p>
                  </div>
                )}
                {interventions.length > 0 && (
                  <button
                    onClick={() => setActiveTab('intervention')}
                    className="mt-4 text-aurora text-sm hover:underline"
                  >
                    查看全部 →
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <GuardianProfileCard
                profile={guardianProfile}
                loading={profileLoading}
                onApply={handleApplyGuardian}
                applying={applying}
              />
              <GuardianRanking ranking={ranking} loading={rankingLoading} />
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            <div className="glass-card p-5 sm:p-6 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">筛选条件</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-2">审核状态</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: '', label: '全部' },
                      { key: 'pending', label: '待审核' },
                      { key: 'approved', label: '已通过' },
                      { key: 'rejected', label: '已驳回' },
                      { key: 'escalated', label: '已升级' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setReviewStatusFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          reviewStatusFilter === opt.key
                            ? 'bg-aurora/20 text-aurora border border-aurora/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:w-auto">
                  <p className="text-xs text-white/50 mb-2">风险等级</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: '', label: '全部' },
                      { key: 'severe', label: '重度' },
                      { key: 'moderate', label: '中度' },
                      { key: 'mild', label: '轻度' },
                      { key: 'safe', label: '安全' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setReviewRiskFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          reviewRiskFilter === opt.key
                            ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-aurora to-nebula-pink" />
                <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                  审核任务池
                </h2>
                <span className="text-sm text-white/50">共 {reviewTotal} 条</span>
              </div>
            </div>

            {!isGuardian ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  仅守护员可参与内容审核
                </p>
                <p className="text-sm text-white/50 mb-6">
                  申请成为守护员，一起守护匿名空间的温暖
                </p>
                <button
                  onClick={handleApplyGuardian}
                  disabled={applying}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-aurora to-nebula-pink text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {applying ? '申请中...' : '立即加入 ✨'}
                </button>
              </div>
            ) : reviewLoading && reviewTasks.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : reviewTasks.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  暂无符合条件的审核任务
                </p>
                <p className="text-sm text-white/50 mb-6">
                  试试调整筛选条件
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {reviewTasks.map((task) => (
                  <ReviewTaskCard
                    key={task.id}
                    task={task}
                    onApprove={(t) => handleReview(t, 'approved')}
                    onReject={(t) => handleReview(t, 'rejected')}
                    onEscalate={(t) => handleReview(t, 'escalated')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'intervention' && (
          <div>
            <div className="glass-card p-5 sm:p-6 rounded-2xl mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">筛选条件</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-2">状态</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: '', label: '全部' },
                      { key: 'pending', label: '待处理' },
                      { key: 'in_progress', label: '处理中' },
                      { key: 'resolved', label: '已解决' },
                      { key: 'closed', label: '已关闭' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setInterventionStatusFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          interventionStatusFilter === opt.key
                            ? 'bg-aurora/20 text-aurora border border-aurora/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:w-auto">
                  <p className="text-xs text-white/50 mb-2">优先级</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: '', label: '全部' },
                      { key: 'high', label: '🔴 高' },
                      { key: 'medium', label: '🟡 中' },
                      { key: 'low', label: '🟢 低' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setInterventionPriorityFilter(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          interventionPriorityFilter === opt.key
                            ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-pink to-aurora" />
                <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                  干预记录
                </h2>
                <span className="text-sm text-white/50">共 {interventionTotal} 条</span>
              </div>
            </div>

            {!isGuardian ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  仅守护员可查看干预记录
                </p>
                <p className="text-sm text-white/50 mb-6">
                  申请成为守护员，一起守护每一颗柔软的心
                </p>
                <button
                  onClick={handleApplyGuardian}
                  disabled={applying}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-aurora to-nebula-pink text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {applying ? '申请中...' : '立即加入 ✨'}
                </button>
              </div>
            ) : interventionLoading && interventions.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : interventions.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">💝</div>
                <p className="text-lg text-white/70 font-serif-sc mb-2">
                  暂无干预记录
                </p>
                <p className="text-sm text-white/50">
                  愿每颗心都被温柔以待
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {interventions.map((intervention) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    onClick={handleInterventionClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuardianRanking ranking={ranking} loading={rankingLoading} />
            
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">守护员等级说明</h3>
              <div className="space-y-3">
                {[
                  { icon: '🌱', name: '见习守护者', desc: '0 - 4 次审核', req: 0 },
                  { icon: '⭐', name: '星光守护者', desc: '5 - 14 次审核', req: 5 },
                  { icon: '🌙', name: '月光守护者', desc: '15 - 29 次审核', req: 15 },
                  { icon: '🌈', name: '极光守护者', desc: '30 - 49 次审核', req: 30 },
                  { icon: '👑', name: '传奇守护者', desc: '50+ 次审核', req: 50 },
                ].map((level, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                      {level.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{level.name}</p>
                      <p className="text-sm text-white/50">{level.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedIntervention && (
        <InterventionDetailModal
          isOpen={showInterventionModal}
          onClose={() => {
            setShowInterventionModal(false);
            setSelectedIntervention(null);
          }}
          intervention={selectedIntervention}
          onAddRecord={handleAddInterventionRecord}
          operatorId={user?.id || ''}
        />
      )}
    </div>
  );
}
