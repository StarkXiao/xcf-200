import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mailbox, Clock, Calendar as CalendarIcon, Plus, Search, Filter,
  X, Check, AlertTriangle, RotateCcw, History, Eye, Send, Sparkles,
  Clock as ClockIcon,
} from 'lucide-react';
import { futureMailboxApi } from '@/api/futureMailbox';
import { emotionsApi } from '@/api/emotions';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import ScheduledLetterCard from '@/components/FutureMailbox/ScheduledLetterCard';
import FutureMailboxStatsCard from '@/components/FutureMailbox/FutureMailboxStatsCard';
import VersionHistory from '@/components/FutureMailbox/VersionHistory';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type {
  ScheduledLetter,
  LetterVersion,
  FutureMailboxStats,
  Emotion,
} from '@/types';
import { cn, formatFullDate } from '@/utils/helpers';

type TabType = 'all' | 'pending' | 'delivered' | 'cancelled' | 'resent';
type ModalType = 'create' | 'cancel' | 'reschedule' | 'resent' | 'versions' | 'detail' | null;

export default function FutureMailbox() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [scheduledLetters, setScheduledLetters] = useState<ScheduledLetter[]>([]);
  const [stats, setStats] = useState<FutureMailboxStats | null>(null);
  const [loading, setLoadingLocal] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedLetter, setSelectedLetter] = useState<ScheduledLetter | null>(null);
  const [versions, setVersions] = useState<LetterVersion[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);

  const [createForm, setCreateForm] = useState({
    recipient: '',
    recipientType: 'future',
    title: '',
    content: '',
    selectedEmotions: [] as string[],
    scheduledDate: '',
    scheduledTime: '',
    isPublic: false,
    isAnonymous: false,
    reminder24h: true,
    reminder1h: true,
    reminderOnTime: true,
    versionNote: '',
  });

  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [resentDate, setResentDate] = useState('');
  const [resentTime, setResentTime] = useState('');
  const [resentTitle, setResentTitle] = useState('');
  const [resentContent, setResentContent] = useState('');
  const [resentRecipient, setResentRecipient] = useState('');
  const [resentUpdateContent, setResentUpdateContent] = useState(false);

  const recipientTypes = [
    { value: 'future', label: '未来的人', icon: '🔮', desc: '给未来的自己或某人' },
    { value: 'past', label: '过去的人', icon: '🕰️', desc: '给曾经的Ta或过去的自己' },
    { value: 'parallel', label: '平行世界', icon: '🌌', desc: '给另一个宇宙的人' },
    { value: 'unknown', label: '未知宇宙', icon: '✨', desc: '随机漂流到未知目的地' },
  ];

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    fetchData();
    fetchEmotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab, page]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoadingLocal(true);
      const [scheduledRes, statsRes] = await Promise.all([
        futureMailboxApi.getScheduledLetters(user.id, {
          status: activeTab === 'all' ? undefined : activeTab,
          page,
          limit,
        }),
        futureMailboxApi.getStats(user.id),
      ]);
      if (scheduledRes.success) {
        setScheduledLetters(scheduledRes.data);
        setTotal(scheduledRes.total);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: '加载数据失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const fetchEmotions = async () => {
    try {
      const res = await emotionsApi.getAll();
      if (res.success) setEmotions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVersions = async (scheduledId: string) => {
    try {
      const res = await futureMailboxApi.getLetterVersions(scheduledId);
      if (res.success) {
        setVersions(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type: ModalType, letter?: ScheduledLetter) => {
    setModalType(type);
    if (letter) {
      setSelectedLetter(letter);
      if (type === 'versions') {
        fetchVersions(letter.id);
      }
      if (type === 'resent') {
        setResentTitle(letter.title);
        setResentRecipient(letter.recipient);
      }
    }
    if (type === 'create') {
      setCreateForm({
        recipient: '',
        recipientType: 'future',
        title: '',
        content: '',
        selectedEmotions: [],
        scheduledDate: '',
        scheduledTime: '',
        isPublic: false,
        isAnonymous: false,
        reminder24h: true,
        reminder1h: true,
        reminderOnTime: true,
        versionNote: '',
      });
    }
    if (type === 'cancel') {
      setCancelReason('');
    }
    if (type === 'reschedule') {
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedLetter(null);
  };

  const handleCreate = async () => {
    if (!user) return;

    if (!createForm.recipient.trim()) {
      showToast({ type: 'error', message: '请填写收件人' });
      return;
    }
    if (!createForm.title.trim()) {
      showToast({ type: 'error', message: '请填写信件标题' });
      return;
    }
    if (!createForm.content.trim() || createForm.content.length < 20) {
      showToast({ type: 'error', message: '信件内容至少20个字' });
      return;
    }
    if (createForm.selectedEmotions.length === 0) {
      showToast({ type: 'error', message: '请至少选择一个情绪标签' });
      return;
    }
    if (!createForm.scheduledDate || !createForm.scheduledTime) {
      showToast({ type: 'error', message: '请选择预约送达时间' });
      return;
    }

    const scheduledDeliverAt = new Date(
      `${createForm.scheduledDate}T${createForm.scheduledTime}`
    ).toISOString();

    if (new Date(scheduledDeliverAt).getTime() <= Date.now()) {
      showToast({ type: 'error', message: '预约送达时间必须晚于当前时间' });
      return;
    }

    try {
      setLoading(true);
      const res = await futureMailboxApi.createScheduledLetter({
        senderId: user.id,
        senderName: user.username,
        recipient: createForm.recipient.trim(),
        recipientType: createForm.recipientType,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        emotions: createForm.selectedEmotions,
        isPublic: createForm.isPublic,
        isAnonymous: createForm.isAnonymous,
        scheduledDeliverAt,
        reminderSettings: {
          before24h: createForm.reminder24h,
          before1h: createForm.reminder1h,
          onTime: createForm.reminderOnTime,
        },
        versionNote: createForm.versionNote || '初始版本',
      });

      if (res.success) {
        showToast({ type: 'success', message: '预约信件已创建！' });
        closeModal();
        fetchData();
      } else {
        showToast({ type: 'error', message: res.message || '创建失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '创建失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedLetter) return;

    try {
      setLoading(true);
      const res = await futureMailboxApi.cancelScheduledLetter(
        selectedLetter.id,
        cancelReason
      );
      if (res.success) {
        showToast({ type: 'success', message: '信件已撤回' });
        closeModal();
        fetchData();
      } else {
        showToast({ type: 'error', message: res.message || '撤回失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '撤回失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedLetter) return;

    if (!rescheduleDate || !rescheduleTime) {
      showToast({ type: 'error', message: '请选择新的送达时间' });
      return;
    }

    const newDeliverAt = new Date(
      `${rescheduleDate}T${rescheduleTime}`
    ).toISOString();

    if (new Date(newDeliverAt).getTime() <= Date.now()) {
      showToast({ type: 'error', message: '新的送达时间必须晚于当前时间' });
      return;
    }

    try {
      setLoading(true);
      const res = await futureMailboxApi.rescheduleLetter(
        selectedLetter.id,
        newDeliverAt,
        rescheduleReason
      );
      if (res.success) {
        showToast({ type: 'success', message: '送达时间已更新' });
        closeModal();
        fetchData();
      } else {
        showToast({ type: 'error', message: res.message || '修改失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '修改失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleResent = async () => {
    if (!selectedLetter) return;

    if (!resentDate || !resentTime) {
      showToast({ type: 'error', message: '请选择新的送达时间' });
      return;
    }

    const newDeliverAt = new Date(
      `${resentDate}T${resentTime}`
    ).toISOString();

    if (new Date(newDeliverAt).getTime() <= Date.now()) {
      showToast({ type: 'error', message: '送达时间必须晚于当前时间' });
      return;
    }

    const updateContent = resentUpdateContent
      ? {
          title: resentTitle || undefined,
          content: resentContent || undefined,
          recipient: resentRecipient || undefined,
        }
      : undefined;

    try {
      setLoading(true);
      const res = await futureMailboxApi.resendLetter(
        selectedLetter.id,
        newDeliverAt,
        updateContent
      );
      if (res.success) {
        showToast({ type: 'success', message: '信件已重新预约寄送！' });
        closeModal();
        fetchData();
      } else {
        showToast({ type: 'error', message: res.message || '二次寄送失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '二次寄送失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selectedLetter) return;

    try {
      setLoading(true);
      const res = await futureMailboxApi.restoreVersion(selectedLetter.id, versionId);
      if (res.success) {
        showToast({ type: 'success', message: '版本已恢复' });
        fetchVersions(selectedLetter.id);
        fetchData();
      } else {
        showToast({ type: 'error', message: res.message || '恢复失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '恢复失败' });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmotion = (name: string) => {
    setCreateForm((prev) => ({
      ...prev,
      selectedEmotions: prev.selectedEmotions.includes(name)
        ? prev.selectedEmotions.filter((e) => e !== name)
        : prev.selectedEmotions.length < 5
        ? [...prev.selectedEmotions, name]
        : prev.selectedEmotions,
    }));
  };

  const tabs = [
    { key: 'all' as TabType, label: '全部', count: stats?.total || 0 },
    { key: 'pending' as TabType, label: '待送达', count: stats?.pending || 0 },
    { key: 'delivered' as TabType, label: '已送达', count: stats?.delivered || 0 },
    { key: 'cancelled' as TabType, label: '已撤回', count: stats?.cancelled || 0 },
    { key: 'resent' as TabType, label: '二次寄送', count: stats?.resent || 0 },
  ];

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Mailbox className="w-10 h-10 text-aurora animate-float" />
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            未来<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 信箱预约</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            给未来写一封信，让时光替你保管，在约定的那天送达
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => openModal('create')}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <Plus className="w-5 h-5" />
            <Sparkles className="w-4 h-4" />
            预约一封信
          </button>
        </div>

        {stats && <FutureMailboxStatsCard stats={stats} className="mb-8" />}

        <div className="glass-card p-1.5 inline-flex w-full flex-wrap mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={cn(
                'relative flex-1 min-w-[80px] flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : scheduledLetters.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center">
            <div className="text-5xl mb-4">📬</div>
            <p className="text-lg text-white/70 font-serif-sc mb-2">
              还没有预约的信件...
            </p>
            <p className="text-sm text-white/50 mb-6">
              给未来的自己或某人写一封信吧
            </p>
            <button
              onClick={() => openModal('create')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              预约第一封信
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scheduledLetters.map((letter, index) => (
              <ScheduledLetterCard
                key={letter.id}
                letter={letter}
                index={index}
                onView={(l) => openModal('detail', l)}
                onCancel={(l) => openModal('cancel', l)}
                onReschedule={(l) => openModal('reschedule', l)}
                onResent={(l) => openModal('resent', l)}
                onViewVersions={(l) => openModal('versions', l)}
              />
            ))}
          </div>
        )}

        {total > limit && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="flex items-center px-4 text-white/60">
              第 {page} 页 / 共 {Math.ceil(total / limit)} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {modalType === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cosmic-950/90 backdrop-blur-sm z-10">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-aurora" />
                预约一封信
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-aurora" />
                  选择收件人类型
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {recipientTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setCreateForm((prev) => ({ ...prev, recipientType: type.value }))
                      }
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-300 text-left',
                        createForm.recipientType === type.value
                          ? 'border-aurora/60 bg-aurora/10 shadow-glow'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-white text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-white/50 leading-relaxed">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  收件人 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.recipient}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, recipient: e.target.value }))
                  }
                  placeholder="如：未来的自己、平行世界的Ta..."
                  maxLength={30}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  信件标题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="给这封信起个名字吧..."
                  maxLength={50}
                  className="input-field font-serif-sc text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
                  <span>信件内容 <span className="text-red-400">*</span></span>
                  <span className={cn('text-xs font-normal', createForm.content.length >= 500 ? 'text-nebula-orange' : 'text-white/50')}>
                    {createForm.content.length} / 5000
                  </span>
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      content: e.target.value.slice(0, 5000),
                    }))
                  }
                  placeholder={`亲爱的${createForm.recipient || '(收件人)'}：\n\n在这里写下你的心里话...\n\n未来的某一天，Ta会收到这封信。`}
                  rows={8}
                  className="input-field font-serif-sc leading-loose resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  情绪标签 <span className="text-red-400">*</span>
                  <span className="text-xs text-white/50 font-normal">
                    (最多选择5个，{createForm.selectedEmotions.length}/5)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((emo) => (
                    <EmotionTag
                      key={emo.id}
                      name={emo.name}
                      icon={emo.icon}
                      color={emo.color}
                      selected={createForm.selectedEmotions.includes(emo.name)}
                      onClick={() => toggleEmotion(emo.name)}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-aurora/5 border border-aurora/20">
                <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-aurora" />
                  预约送达时间 <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">送达日期</label>
                    <input
                      type="date"
                      value={createForm.scheduledDate}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, scheduledDate: e.target.value }))
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">送达时间</label>
                    <input
                      type="time"
                      value={createForm.scheduledTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, scheduledTime: e.target.value }))
                      }
                      className="input-field"
                    />
                  </div>
                </div>
                {createForm.scheduledDate && createForm.scheduledTime && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-white/70 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 text-aurora shrink-0" />
                      <span>
                        信件将于 <strong className="text-aurora">
                          {new Date(`${createForm.scheduledDate}T${createForm.scheduledTime}`).toLocaleString('zh-CN')}
                        </strong> 准时送达。在此之前，信件会在时光邮局中静静等待。
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  提醒设置
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.reminder24h}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, reminder24h: e.target.checked }))
                      }
                      className="w-5 h-5 rounded border-cosmic-300 text-aurora focus:ring-aurora bg-white/20"
                    />
                    <div>
                      <div className="text-sm text-white/80">送达前24小时提醒</div>
                      <div className="text-xs text-white/50">提前一天提醒你信件即将送达</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.reminder1h}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, reminder1h: e.target.checked }))
                      }
                      className="w-5 h-5 rounded border-cosmic-300 text-aurora focus:ring-aurora bg-white/20"
                    />
                    <div>
                      <div className="text-sm text-white/80">送达前1小时提醒</div>
                      <div className="text-xs text-white/50">即将送达时给你最后提醒</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.reminderOnTime}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, reminderOnTime: e.target.checked }))
                      }
                      className="w-5 h-5 rounded border-cosmic-300 text-aurora focus:ring-aurora bg-white/20"
                    />
                    <div>
                      <div className="text-sm text-white/80">送达时通知</div>
                      <div className="text-xs text-white/50">信件准时送达时立即通知你</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  确认预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'cancel' && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-nebula-orange" />
                撤回预约信件
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-nebula-orange/10 border border-nebula-orange/30">
                <p className="text-sm text-nebula-orange/90">
                  ⚠️ 撤回后信件将不会送达，且无法恢复。你确定要撤回吗？
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-white/80 font-medium mb-2">{selectedLetter.title}</div>
                <div className="text-xs text-white/50">
                  致 {selectedLetter.recipient} · 原计划 {formatFullDate(selectedLetter.scheduledDeliverAt)} 送达
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  撤回原因（可选）
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="填写撤回原因..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">
                  再想想
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white font-medium bg-nebula-pink/20 border border-nebula-pink/40 hover:bg-nebula-pink/30 transition-all"
                >
                  确认撤回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'reschedule' && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-aurora" />
                修改送达时间
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-white/80 font-medium mb-2">{selectedLetter.title}</div>
                <div className="text-xs text-white/50">
                  当前送达时间：{formatFullDate(selectedLetter.scheduledDeliverAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  新的送达时间
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">日期</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">时间</label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  修改原因（可选）
                </label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="填写修改原因..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">
                  取消
                </button>
                <button onClick={handleReschedule} className="btn-primary flex-1">
                  确认修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'resent' && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cosmic-950/90 backdrop-blur-sm z-10">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-nebula-mint" />
                二次寄送
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-nebula-mint/10 border border-nebula-mint/30">
                <p className="text-sm text-nebula-mint/90">
                  ✨ 创建一封新的预约信件，基于原信件内容重新寄送。
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-white/80 font-medium mb-1">原信件：{selectedLetter.title}</div>
                <div className="text-xs text-white/50">
                  致 {selectedLetter.recipient} · {formatFullDate(selectedLetter.scheduledDeliverAt)} 已送达
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  新的送达时间 <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">日期</label>
                    <input
                      type="date"
                      value={resentDate}
                      onChange={(e) => setResentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">时间</label>
                    <input
                      type="time"
                      value={resentTime}
                      onChange={(e) => setResentTime(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resentUpdateContent}
                  onChange={(e) => setResentUpdateContent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-cosmic-300 text-aurora focus:ring-aurora bg-white/20"
                />
                <div>
                  <div className="text-sm text-white/80">修改信件内容</div>
                  <div className="text-xs text-white/50">可以调整标题、内容和收件人</div>
                </div>
              </label>

              {resentUpdateContent && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">收件人</label>
                    <input
                      type="text"
                      value={resentRecipient}
                      onChange={(e) => setResentRecipient(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">标题</label>
                    <input
                      type="text"
                      value={resentTitle}
                      onChange={(e) => setResentTitle(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">内容</label>
                    <textarea
                      value={resentContent}
                      onChange={(e) => setResentContent(e.target.value)}
                      rows={4}
                      placeholder="留空则使用原信件内容..."
                      className="input-field text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">
                  取消
                </button>
                <button onClick={handleResent} className="btn-primary flex-1">
                  确认二次寄送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalType === 'versions' && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cosmic-950/90 backdrop-blur-sm z-10">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-starlight" />
                版本历史
                <span className="text-sm font-normal text-white/50">
                  （共 {selectedLetter.versionCount} 个版本）
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedLetter.currentStatus === 'pending' ? (
                <VersionHistory
                  versions={versions}
                  currentVersion={selectedLetter.versionCount}
                  onRestore={handleRestoreVersion}
                />
              ) : (
                <VersionHistory versions={versions} />
              )}
            </div>
          </div>
        </div>
      )}

      {modalType === 'detail' && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-cosmic-950/90 backdrop-blur-sm z-10">
              <h3 className="font-serif-sc text-xl font-semibold text-white">
                {selectedLetter.title}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50 mb-1">收件人</div>
                  <div className="text-sm text-white/80">{selectedLetter.recipient}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50 mb-1">状态</div>
                  <div className="text-sm text-white/80 capitalize">
                    {selectedLetter.currentStatus === 'pending' && '等待送达'}
                    {selectedLetter.currentStatus === 'delivered' && '已送达'}
                    {selectedLetter.currentStatus === 'cancelled' && '已撤回'}
                    {selectedLetter.currentStatus === 'resent' && '已二次寄送'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50 mb-1">预约送达</div>
                  <div className="text-sm text-white/80">
                    {formatFullDate(selectedLetter.scheduledDeliverAt)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50 mb-1">创建时间</div>
                  <div className="text-sm text-white/80">
                    {formatFullDate(selectedLetter.createdAt)}
                  </div>
                </div>
              </div>

              {selectedLetter.rescheduleHistory && selectedLetter.rescheduleHistory.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-white/80 mb-3">改期记录</div>
                  <div className="space-y-2">
                    {selectedLetter.rescheduleHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white/5 text-xs text-white/60"
                      >
                        <div>
                          从 {formatFullDate(item.from)} → {formatFullDate(item.to)}
                        </div>
                        {item.reason && <div className="mt-1">原因：{item.reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => openModal('versions', selectedLetter)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  查看版本历史
                </button>
                {selectedLetter.currentStatus === 'delivered' && (
                  <button
                    onClick={() => openModal('resent', selectedLetter)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    二次寄送
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
