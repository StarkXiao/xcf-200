import { useEffect, useState } from 'react';
import { MessageSquareHeart, Sparkles, Filter, RefreshCw, Star, Shield, Target, Bell } from 'lucide-react';
import { strangerReplyApi } from '@/api/strangerReply';
import EmotionTag from '@/components/Emotion/EmotionTag';
import ReplyTaskCard from '@/components/StrangerReply/ReplyTaskCard';
import ReplyModal from '@/components/StrangerReply/ReplyModal';
import NotificationPanel from '@/components/StrangerReply/NotificationPanel';
import StatsCard from '@/components/StrangerReply/StatsCard';
import MatchRulesInfo from '@/components/StrangerReply/MatchRulesInfo';
import type { ReplyTask, MatchRule } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

const recipientTypes = [
  { key: 'future', label: '未来的人', icon: '🔮' },
  { key: 'past', label: '过去的人', icon: '📜' },
  { key: 'parallel', label: '平行世界', icon: '🌌' },
  { key: 'unknown', label: '未知收信', icon: '❓' },
];

export default function StrangerReply() {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [tasks, setTasks] = useState<ReplyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [matchRules, setMatchRules] = useState<MatchRule[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [needReplyOnly, setNeedReplyOnly] = useState(false);

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ReplyTask | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await strangerReplyApi.getReplyPool({
        limit: 12,
        emotion: selectedEmotion || undefined,
        recipientType: selectedType || undefined,
        needReply: needReplyOnly,
        userId: user?.id,
      });
      if (res.success) {
        setTasks(res.data);
        setTotal(res.total);
        setMatchRules(res.matchRules);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载任务池失败' });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await strangerReplyApi.getNotifications({
        userId: user.id,
        unreadOnly: true,
        limit: 1,
      });
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmotion, selectedType, needReplyOnly]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleReply = (task: ReplyTask) => {
    if (!isAuthenticated) {
      showToast({ type: 'warning', message: '请先登录后再回信' });
      return;
    }
    setSelectedTask(task);
    setShowReplyModal(true);
  };

  const handleReplySuccess = () => {
    setShowReplyModal(false);
    setSelectedTask(null);
    showToast({ type: 'success', message: '回信已成功寄出 ✨' });
    fetchTasks();
    fetchNotifications();
  };

  const handleRefresh = () => {
    fetchTasks();
  };

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
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-starlight/10 border border-starlight/20 mb-4">
                    <MessageSquareHeart className="w-4 h-4 text-starlight" />
                    <span className="text-sm font-medium text-starlight/90">陌生回信计划</span>
                  </div>
                  <h1 className="font-serif-sc text-3xl sm:text-4xl font-bold text-white mb-2">
                    给陌生人写一封回信
                  </h1>
                  <p className="text-white/60 max-w-xl">
                    在星河中漂流的信件，正等待一份温暖的回应。选择一封信，用你的文字点亮另一个人的星空。
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Bell className="w-5 h-5 text-white/70" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-nebula-pink text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                  icon={<Target className="w-5 h-5" />}
                  label="可回复信件"
                  value={total}
                  color="text-aurora"
                  bgColor="bg-aurora/10"
                />
                <StatsCard
                  icon={<Shield className="w-5 h-5" />}
                  label="身份保护"
                  value="匿名"
                  color="text-nebula-purple"
                  bgColor="bg-nebula-purple/10"
                />
                <StatsCard
                  icon={<Star className="w-5 h-5" />}
                  label="智能匹配"
                  value={matchRules.length + '项规则'}
                  color="text-starlight"
                  bgColor="bg-starlight/10"
                />
                <StatsCard
                  icon={<Sparkles className="w-5 h-5" />}
                  label="温暖传递"
                  value="无限"
                  color="text-nebula-pink"
                  bgColor="bg-nebula-pink/10"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="glass-card p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm font-medium text-white/80">筛选条件</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <p className="text-xs text-white/50 mb-2">收件类型</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      !selectedType
                        ? 'bg-aurora/20 text-aurora border border-aurora/30'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    全部
                  </button>
                  {recipientTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setSelectedType(selectedType === type.key ? null : type.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedType === type.key
                          ? 'bg-aurora/20 text-aurora border border-aurora/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:w-auto">
                <p className="text-xs text-white/50 mb-2">快速筛选</p>
                <button
                  onClick={() => setNeedReplyOnly(!needReplyOnly)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                    needReplyOnly
                      ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  🔥 急需回应
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">情感标签</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEmotion(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    !selectedEmotion
                      ? 'bg-starlight/20 text-starlight border border-starlight/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  全部情感
                </button>
                {['思念', '希望', '勇气', '爱情', '治愈', '孤独', '温暖', '怀念'].map((emo) => (
                  <EmotionTag
                    key={emo}
                    name={emo}
                    size="sm"
                    selected={selectedEmotion === emo}
                    onClick={() => setSelectedEmotion(selectedEmotion === emo ? null : emo)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <MatchRulesInfo rules={matchRules} />

        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-aurora to-nebula-pink" />
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                回信任务池
              </h2>
              <span className="text-sm text-white/50">共 {total} 封等待回应</span>
            </div>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl">
              <div className="text-6xl mb-4">💌</div>
              <p className="text-lg text-white/70 font-serif-sc mb-2">
                暂时没有符合条件的信件
              </p>
              <p className="text-sm text-white/50 mb-6">
                试试调整筛选条件，或者成为第一个寄出信件的人吧
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {tasks.map((task, index) => (
                <ReplyTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onReply={() => handleReply(task)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedTask && (
        <ReplyModal
          isOpen={showReplyModal}
          onClose={() => setShowReplyModal(false)}
          task={selectedTask}
          onSuccess={handleReplySuccess}
        />
      )}

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchNotifications();
        }}
      />
    </div>
  );
}
