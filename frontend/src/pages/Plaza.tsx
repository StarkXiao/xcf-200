import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenLine, Search, Sparkles, TrendingUp, Clock, Filter, X, ChevronDown, ChevronUp, MessageCircle, Flame, Mail, CalendarCheck } from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import EmotionCloud from '@/components/Emotion/EmotionCloud';
import SelectGroupModal from '@/components/Favorites/SelectGroupModal';
import ReminderModal from '@/components/Favorites/ReminderModal';
import GroupModal from '@/components/Favorites/GroupModal';
import { lettersApi } from '@/api/letters';
import { favoritesApi } from '@/api/favorites';
import useAuthStore from '@/store/useAuthStore';
import useFavoriteStore from '@/store/useFavoriteStore';
import useUIStore from '@/store/useUIStore';
import type { LetterListItem } from '@/types';
import CombatSkillBar from '@/components/Skill/CombatSkillBar';

type SortType = 'latest' | 'popular' | 'most_replied';
type TimeRangeType = 'today' | 'week' | 'month' | 'year' | null;
type ReplyStatusType = 'has_reply' | 'no_reply' | null;
type RecipientType = 'future' | 'past' | 'parallel' | 'unknown';

interface FilterState {
  minLikes: number | null;
  timeRange: TimeRangeType;
  recipientTypes: RecipientType[];
  replyStatus: ReplyStatusType;
}

const TIME_RANGE_OPTIONS = [
  { key: 'today', label: '今天', icon: '🌅' },
  { key: 'week', label: '本周', icon: '📅' },
  { key: 'month', label: '本月', icon: '🗓️' },
  { key: 'year', label: '今年', icon: '📆' },
] as const;

const RECIPIENT_TYPE_OPTIONS = [
  { key: 'future', label: '未来', icon: '🔮' },
  { key: 'past', label: '过去', icon: '🕰️' },
  { key: 'parallel', label: '平行世界', icon: '🌌' },
  { key: 'unknown', label: '未知', icon: '✨' },
] as const;

const HEAT_LEVELS = [
  { value: null, label: '全部', minLikes: 0 },
  { value: 1, label: '有点热度', minLikes: 1 },
  { value: 5, label: '小热门', minLikes: 5 },
  { value: 20, label: '热门之星', minLikes: 20 },
  { value: 50, label: '超级爆款', minLikes: 50 },
];

export default function Plaza() {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const favStore = useFavoriteStore();

  const [letters, setLetters] = useState<LetterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    minLikes: null,
    timeRange: null,
    recipientTypes: [],
    replyStatus: null,
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    heat: true,
    time: true,
    recipient: true,
    reply: true,
  });

  const [showSelectGroup, setShowSelectGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [pendingLetterId, setPendingLetterId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      favStore.initIfNeeded(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLetters = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const res = await lettersApi.getLetters({
        page: currentPage,
        limit: 8,
        keyword: appliedKeyword || undefined,
        emotion: selectedEmotion || undefined,
        sort,
        minLikes: filters.minLikes ?? undefined,
        timeRange: filters.timeRange ?? undefined,
        recipientType: filters.recipientTypes.length > 0 ? filters.recipientTypes : undefined,
        replyStatus: filters.replyStatus ?? undefined,
      });
      if (res.success) {
        setLetters(reset ? res.data : [...letters, ...res.data]);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        if (reset) setPage(1);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载信件失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKeyword, selectedEmotion, sort, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(searchKeyword.trim());
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      setPage(page + 1);
      setTimeout(() => fetchLetters(false), 0);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchLetters(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFavoriteClick = (letterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      showToast({ type: 'info', message: '请先登录才能收藏哦' });
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    if (favStore.isFavorited(letterId)) {
      handleRemoveFavorite(letterId);
    } else {
      setPendingLetterId(letterId);
      setShowSelectGroup(true);
    }
  };

  const handleRemoveFavorite = async (letterId: string) => {
    if (!user) return;
    try {
      const res = await favStore.removeFavorite(user.id, letterId);
      if (res.success) {
        showToast({ type: 'info', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const handleAddFavoriteToGroup = async (groupId: string | null) => {
    if (!user || !pendingLetterId) return;
    try {
      const res = await favStore.addFavorite(user.id, pendingLetterId, groupId || undefined);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '收藏失败' });
    }
  };

  const handleCreateGroupFromPlaza = async (data: { name: string; icon: string; color: string; description: string }) => {
    if (!user) return;
    try {
      const res = await favoritesApi.createGroup(user.id, data);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        favStore.refreshGroups(user.id);
        setShowGroupModal(false);
        setShowSelectGroup(true);
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '创建失败' });
    }
  };

  const handleReminderClick = (letterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      showToast({ type: 'info', message: '请先登录才能设置提醒' });
      return;
    }
    setPendingLetterId(letterId);
    setShowReminderModal(true);
  };

  const handleSetReminder = async (data: { remindAt: string; note: string }) => {
    if (!user || !pendingLetterId) return;
    try {
      const res = await favoritesApi.createReminder(user.id, {
        letterId: pendingLetterId,
        ...data,
      });
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setShowReminderModal(false);
        setPendingLetterId(null);
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '设置失败' });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleRecipientType = (type: RecipientType) => {
    setFilters(prev => ({
      ...prev,
      recipientTypes: prev.recipientTypes.includes(type)
        ? prev.recipientTypes.filter(t => t !== type)
        : [...prev.recipientTypes, type],
    }));
  };

  const hasActiveFilters =
    selectedEmotion !== null ||
    appliedKeyword !== '' ||
    filters.minLikes !== null ||
    filters.timeRange !== null ||
    filters.recipientTypes.length > 0 ||
    filters.replyStatus !== null;

  const clearAllFilters = () => {
    setSelectedEmotion(null);
    setSearchKeyword('');
    setAppliedKeyword('');
    setFilters({
      minLikes: null,
      timeRange: null,
      recipientTypes: [],
      replyStatus: null,
    });
  };

  const pendingLetter = letters.find((l) => l.id === pendingLetterId);

  return (
    <div className="relative z-10">
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-starlight/10 border border-starlight/20 mb-6">
              <Sparkles className="w-4 h-4 text-starlight animate-pulse" />
              <span className="text-sm font-medium text-starlight/90">
                {total} 封穿越时空的信件正在星河中漂流
              </span>
            </div>

            <h1 className="font-serif-sc text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              在<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 星河邮局 </span>
              <br />
              寄出你的思念
            </h1>

            <p className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed">
              给未来的自己写一封信，向平行世界的 Ta 送去问候，
              <br className="hidden sm:block" />
              每一封信都会化作星星，在宇宙中闪耀。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/write' : '/login'}
                className="btn-primary flex items-center gap-2 text-base px-8 py-4 animate-pulse-glow"
              >
                <PenLine className="w-5 h-5" />
                写一封信
              </Link>
              <a
                href="#letters"
                className="btn-secondary flex items-center gap-2 text-base px-8 py-4"
              >
                <Sparkles className="w-5 h-5" />
                探索广场
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                情绪星河
              </h2>
              <span className="text-sm text-white/50 ml-2">点击标签筛选信件</span>
            </div>
            <EmotionCloud
              selected={selectedEmotion}
              onSelect={setSelectedEmotion}
              showAll
            />
          </div>
        </div>
      </section>

      <section id="letters" className="py-8 sm:py-10">
        <div className="container">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-starlight to-nebula-pink" />
              <h2 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">
                信件广场
              </h2>
              {total > 0 && (
                <span className="text-sm text-white/50">共 {total} 封</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索信件..."
                    className="input-field pl-10 py-2.5 text-sm w-full"
                  />
                </div>
                <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">
                  搜索
                </button>
              </form>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSort('latest')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    sort === 'latest'
                      ? 'bg-aurora/20 text-aurora border border-aurora/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  最新
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    sort === 'popular'
                      ? 'bg-starlight/20 text-starlight border border-starlight/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  热门
                </button>
                <button
                  onClick={() => setSort('most_replied')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    sort === 'most_replied'
                      ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  最多回复
                </button>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 sm:flex-initial justify-center ${
                    showFilterPanel || hasActiveFilters
                      ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/30'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>
          </div>

          {showFilterPanel && (
            <div className="glass-card p-5 sm:p-6 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-nebula-purple" />
                  <h3 className="font-serif-sc text-base font-semibold text-white">高级筛选</h3>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    清除全部
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <button
                    onClick={() => toggleSection('heat')}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <Flame className="w-4 h-4 text-orange-400" />
                      按热度筛选
                    </span>
                    {expandedSections.heat ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                  {expandedSections.heat && (
                    <div className="flex flex-wrap gap-2">
                      {HEAT_LEVELS.map((level) => {
                        const isSelected = filters.minLikes === level.value;
                        return (
                          <button
                            key={level.label}
                            onClick={() => setFilters(prev => ({ ...prev, minLikes: level.value }))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-orange-400/25 text-orange-400 border border-orange-400/50 shadow-glow-sm'
                                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {level.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('time')}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <CalendarCheck className="w-4 h-4 text-starlight" />
                      按时间筛选
                    </span>
                    {expandedSections.time ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                  {expandedSections.time && (
                    <div className="flex flex-wrap gap-2">
                      {TIME_RANGE_OPTIONS.map((opt) => {
                        const isSelected = filters.timeRange === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setFilters(prev => ({
                              ...prev,
                              timeRange: isSelected ? null : opt.key,
                            }))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-starlight/25 text-starlight border border-starlight/50 shadow-glow-sm'
                                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('recipient')}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <Mail className="w-4 h-4 text-aurora" />
                      按收件类型
                    </span>
                    {expandedSections.recipient ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                  {expandedSections.recipient && (
                    <div className="flex flex-wrap gap-2">
                      {RECIPIENT_TYPE_OPTIONS.map((opt) => {
                        const isSelected = filters.recipientTypes.includes(opt.key as RecipientType);
                        return (
                          <button
                            key={opt.key}
                            onClick={() => toggleRecipientType(opt.key as RecipientType)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-aurora/25 text-aurora border border-aurora/50 shadow-glow-sm'
                                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('reply')}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <MessageCircle className="w-4 h-4 text-nebula-pink" />
                      按回信状态
                    </span>
                    {expandedSections.reply ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                  {expandedSections.reply && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          replyStatus: prev.replyStatus === 'has_reply' ? null : 'has_reply',
                        }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.replyStatus === 'has_reply'
                            ? 'bg-nebula-pink/25 text-nebula-pink border border-nebula-pink/50 shadow-glow-sm'
                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>💬</span>
                        <span>已回信</span>
                      </button>
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          replyStatus: prev.replyStatus === 'no_reply' ? null : 'no_reply',
                        }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          filters.replyStatus === 'no_reply'
                            ? 'bg-nebula-purple/25 text-nebula-purple border border-nebula-purple/50 shadow-glow-sm'
                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>📭</span>
                        <span>待回信</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">筛选条件：</span>
              {selectedEmotion && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-nebula-purple/20 text-nebula-purple/90 text-xs border border-nebula-purple/30">
                  🏷️ {selectedEmotion}
                  <button onClick={() => setSelectedEmotion(null)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {appliedKeyword && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-aurora/20 text-aurora/90 text-xs border border-aurora/30">
                  🔍 "{appliedKeyword}"
                  <button
                    onClick={() => { setSearchKeyword(''); setAppliedKeyword(''); }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.minLikes !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-400/20 text-orange-400/90 text-xs border border-orange-400/30">
                  🔥 {HEAT_LEVELS.find(l => l.value === filters.minLikes)?.label || `≥${filters.minLikes}赞`}
                  <button onClick={() => setFilters(prev => ({ ...prev, minLikes: null }))} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.timeRange && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-starlight/20 text-starlight/90 text-xs border border-starlight/30">
                  {TIME_RANGE_OPTIONS.find(t => t.key === filters.timeRange)?.icon}{' '}
                  {TIME_RANGE_OPTIONS.find(t => t.key === filters.timeRange)?.label}
                  <button onClick={() => setFilters(prev => ({ ...prev, timeRange: null }))} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.recipientTypes.map(type => {
                const opt = RECIPIENT_TYPE_OPTIONS.find(o => o.key === type);
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-aurora/20 text-aurora/90 text-xs border border-aurora/30"
                  >
                    {opt?.icon} {opt?.label}
                    <button onClick={() => toggleRecipientType(type)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {filters.replyStatus && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-nebula-pink/20 text-nebula-pink/90 text-xs border border-nebula-pink/30">
                  {filters.replyStatus === 'has_reply' ? '💬 已回信' : '📭 待回信'}
                  <button onClick={() => setFilters(prev => ({ ...prev, replyStatus: null }))} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 ml-2"
              >
                清除筛选
              </button>
            </div>
          )}

          {loading && letters.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 sm:h-80 rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌠</div>
              <p className="text-lg text-white/70 font-serif-sc mb-2">
                这片星域暂时没有信件...
              </p>
              <p className="text-sm text-white/50 mb-6">
                {hasActiveFilters ? '试试调整筛选条件吧！' : '不如成为第一位寄出信件的人吧！'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  清除筛选条件
                </button>
              ) : (
                <Link
                  to={isAuthenticated ? '/write' : '/login'}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PenLine className="w-4 h-4" />
                  写第一封信
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {letters.map((letter, index) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    index={index}
                    onFavoriteClick={handleFavoriteClick}
                    onReminderClick={handleReminderClick}
                  />
                ))}
              </div>

              {page < totalPages && (
                <div className="text-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn-secondary px-8 py-3.5"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                        加载中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        探索更多信件
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <SelectGroupModal
        open={showSelectGroup}
        onClose={() => {
          setShowSelectGroup(false);
          setPendingLetterId(null);
        }}
        groups={favStore.groups}
        ungroupedCount={favStore.ungroupedCount}
        onSelect={(groupId) => {
          handleAddFavoriteToGroup(groupId);
          setShowSelectGroup(false);
          setPendingLetterId(null);
        }}
        onCreateNew={() => {
          setShowSelectGroup(false);
          setShowGroupModal(true);
        }}
      />

      <GroupModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSubmit={handleCreateGroupFromPlaza}
      />

      <ReminderModal
        open={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setPendingLetterId(null);
        }}
        onSubmit={handleSetReminder}
        letterTitle={pendingLetter?.title}
      />
    </div>
  );
}
