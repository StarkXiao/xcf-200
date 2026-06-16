import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive as ArchiveIcon, Clock, BarChart3, Search, Sparkles, PenLine, GitBranch } from 'lucide-react';
import LetterCard from '@/components/Letter/LetterCard';
import ArchiveFilterPanel from '@/components/Archive/ArchiveFilterPanel';
import ArchiveTimeline from '@/components/Archive/ArchiveTimeline';
import ArchiveStatsPanel from '@/components/Archive/ArchiveStatsPanel';
import LetterTraceback from '@/components/Archive/LetterTraceback';
import { archiveApi } from '@/api/archive';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { ArchiveLetter } from '@/types';

type ArchiveTab = 'browse' | 'timeline' | 'stats' | 'traceback';
type ArchiveScope = 'public' | 'user' | 'favorites';

export default function Archive() {
  const { isAuthenticated, user } = useAuthStore();
  const { showToast } = useUIStore();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<ArchiveTab>('browse');
  const [scope, setScope] = useState<ArchiveScope>('public');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedRecipientTypes, setSelectedRecipientTypes] = useState<string[]>([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [sort, setSort] = useState<'latest' | 'popular' | 'oldest'>('latest');

  const [letters, setLetters] = useState<ArchiveLetter[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [tracebackLetterId, setTracebackLetterId] = useState<string>('');

  useEffect(() => {
    const tab = searchParams.get('tab') as ArchiveTab | null;
    if (tab && ['browse', 'timeline', 'stats', 'traceback'].includes(tab)) {
      setActiveTab(tab);
    }
    const tid = searchParams.get('traceback');
    if (tid) {
      setTracebackLetterId(tid);
      setActiveTab('traceback');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated && (scope === 'user' || scope === 'favorites')) {
      setScope('public');
    }
  }, [isAuthenticated, scope]);

  const fetchLetters = useCallback(async (reset: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const params: any = {
        page: currentPage,
        limit: 12,
        scope,
        sort,
      };
      if (appliedKeyword) params.keyword = appliedKeyword;
      if (selectedEmotions.length > 0) params.emotion = selectedEmotions;
      if (selectedRecipientTypes.length > 0) params.recipientType = selectedRecipientTypes;
      if (selectedTimePeriod) params.timePeriod = selectedTimePeriod;
      if (scope !== 'public' && user) params.userId = user.id;

      const res = await archiveApi.getLetters(params);
      if (res.success) {
        setLetters(reset ? res.data : [...letters, ...res.data]);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        if (reset) setPage(1);
      }
    } catch {
      showToast({ type: 'error', message: '加载归档信件失败' });
    } finally {
      setLoading(false);
    }
  }, [page, scope, sort, appliedKeyword, selectedEmotions, selectedRecipientTypes, selectedTimePeriod, user, letters.length]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchLetters(true);
    }
  }, [activeTab, appliedKeyword, selectedEmotions, selectedRecipientTypes, selectedTimePeriod, sort, scope]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(keyword.trim());
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      setPage(page + 1);
    }
  };

  useEffect(() => {
    if (page > 1 && activeTab === 'browse') {
      fetchLetters(false);
    }
  }, [page]);

  const tabs = [
    { key: 'browse' as const, label: '归档浏览', icon: ArchiveIcon },
    { key: 'timeline' as const, label: '时间轴', icon: Clock },
    { key: 'stats' as const, label: '用户画像', icon: BarChart3 },
    { key: 'traceback' as const, label: '详情回溯', icon: GitBranch },
  ];

  return (
    <div className="relative z-10 py-6 sm:py-10">
      <div className="container">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-starlight/10 border border-starlight/20 mb-4">
            <ArchiveIcon className="w-4 h-4 text-starlight" />
            <span className="text-sm font-medium text-starlight/90">星愿档案馆</span>
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
            按<span className="bg-gradient-to-r from-aurora via-nebula-purple to-starlight bg-clip-text text-transparent"> 情绪 · 收件人 · 时间 </span>归档
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto">
            穿越星河的每一封信，都在这里留下印记。按情绪归档、按时间回溯、发现你的星际画像。
          </p>
        </div>

        <div className="glass-card p-1.5 inline-flex w-full flex-wrap mb-6">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 min-w-[80px] flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-cosmic-500/20 to-aurora/20 text-white shadow-inner'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {(activeTab === 'browse' || activeTab === 'timeline') && (
            <div className="lg:w-72 xl:w-80 shrink-0">
              {activeTab === 'browse' && (
                <div className="lg:sticky lg:top-24 space-y-4">
                  <ArchiveFilterPanel
                    selectedEmotions={selectedEmotions}
                    selectedRecipientTypes={selectedRecipientTypes}
                    selectedTimePeriod={selectedTimePeriod}
                    onEmotionChange={setSelectedEmotions}
                    onRecipientTypeChange={setSelectedRecipientTypes}
                    onTimePeriodChange={setSelectedTimePeriod}
                    scope={scope}
                  />

                  <div className="glass-card p-4">
                    <div className="text-sm font-medium text-white/70 mb-3">查看范围</div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { key: 'public' as const, label: '公开信件', icon: '🌐' },
                        ...(isAuthenticated && user ? [
                          { key: 'user' as const, label: '我写的信', icon: '✍️' },
                          { key: 'favorites' as const, label: '我的收藏', icon: '⭐' },
                        ] : []),
                      ].map(s => (
                        <button
                          key={s.key}
                          onClick={() => setScope(s.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            scope === s.key
                              ? 'bg-aurora/15 text-aurora border border-aurora/30'
                              : 'text-white/60 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="lg:sticky lg:top-24 space-y-4">
                  <ArchiveFilterPanel
                    selectedEmotions={selectedEmotions}
                    selectedRecipientTypes={selectedRecipientTypes}
                    selectedTimePeriod={selectedTimePeriod}
                    onEmotionChange={setSelectedEmotions}
                    onRecipientTypeChange={setSelectedRecipientTypes}
                    onTimePeriodChange={setSelectedTimePeriod}
                    scope={scope}
                  />
                  <div className="glass-card p-4">
                    <div className="text-sm font-medium text-white/70 mb-3">查看范围</div>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { key: 'public' as const, label: '公开信件', icon: '🌐' },
                        ...(isAuthenticated && user ? [
                          { key: 'user' as const, label: '我写的信', icon: '✍️' },
                          { key: 'favorites' as const, label: '我的收藏', icon: '⭐' },
                        ] : []),
                      ].map(s => (
                        <button
                          key={s.key}
                          onClick={() => setScope(s.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                            scope === s.key
                              ? 'bg-aurora/15 text-aurora border border-aurora/30'
                              : 'text-white/60 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {activeTab === 'browse' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-aurora to-nebula-purple" />
                    <h2 className="font-serif-sc text-xl font-semibold text-white">归档信件</h2>
                    {total > 0 && (
                      <span className="text-sm text-white/50">共 {total} 封</span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-initial sm:w-52">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="搜索归档..."
                          className="input-field pl-10 py-2.5 text-sm w-full"
                        />
                      </div>
                      <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">
                        搜索
                      </button>
                    </form>

                    <div className="flex gap-1.5">
                      {([
                        { key: 'latest', label: '最新' },
                        { key: 'popular', label: '热门' },
                        { key: 'oldest', label: '最早' },
                      ] as const).map(s => (
                        <button
                          key={s.key}
                          onClick={() => setSort(s.key)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            sort === s.key
                              ? 'bg-aurora/20 text-aurora border border-aurora/30'
                              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {loading && letters.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : letters.length === 0 ? (
                  <div className="glass-card p-12 sm:p-16 text-center">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">这片星域还没有归档信件...</p>
                    <p className="text-sm text-white/50 mb-6">换个筛选条件试试，或者去写一封信吧</p>
                    <Link
                      to={isAuthenticated ? '/write' : '/login'}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <PenLine className="w-4 h-4" />
                      写一封信
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {letters.map((letter, index) => (
                        <LetterCard key={letter.id} letter={letter} index={index} />
                      ))}
                    </div>

                    {page < totalPages && (
                      <div className="text-center mt-8">
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
                              加载更多
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <ArchiveTimeline
                selectedEmotions={selectedEmotions}
                selectedRecipientTypes={selectedRecipientTypes}
                scope={scope}
              />
            )}

            {activeTab === 'stats' && (
              <div>
                {isAuthenticated && user ? (
                  <ArchiveStatsPanel userId={user.id} />
                ) : (
                  <div className="glass-card p-12 sm:p-16 text-center">
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">登录后查看你的星际画像</p>
                    <p className="text-sm text-white/50 mb-6">你的情绪画像、收件人分布、月度活跃度都在这里</p>
                    <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      去登录
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'traceback' && (
              <div>
                {tracebackLetterId ? (
                  <LetterTraceback letterId={tracebackLetterId} />
                ) : (
                  <div className="glass-card p-12 sm:p-16 text-center">
                    <div className="text-5xl mb-4">🔗</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">选择一封信件开始回溯</p>
                    <p className="text-sm text-white/50 mb-6">
                      在信件详情页点击"回溯"或输入信件ID，即可查看与之相关的信件
                    </p>
                    <div className="max-w-md mx-auto">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tracebackLetterId}
                          onChange={(e) => setTracebackLetterId(e.target.value)}
                          placeholder="输入信件ID..."
                          className="input-field text-sm"
                        />
                        <button
                          onClick={() => {
                            if (tracebackLetterId.trim()) {
                              setTracebackLetterId(tracebackLetterId.trim());
                            }
                          }}
                          className="btn-primary px-5 py-3 text-sm shrink-0"
                        >
                          回溯
                        </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Link to="/" className="text-sm text-aurora/70 hover:text-aurora transition-colors">
                        去信件广场找一封信 →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
