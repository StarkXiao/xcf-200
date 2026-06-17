import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, BookmarkPlus, Bookmark, ArrowLeft, Send, MessageSquare, Sparkles, Share2, Bell, FolderOpen, Users, Flag, AlertTriangle, BarChart3, ExternalLink } from 'lucide-react';
import LetterPaper from '@/components/Letter/LetterPaper';
import ReplyCard from '@/components/Letter/ReplyCard';
import ReplyCandidatePool from '@/components/Letter/ReplyCandidatePool';
import MailRouteTracker from '@/components/MailRoute/MailRouteTracker';
import SelectGroupModal from '@/components/Favorites/SelectGroupModal';
import ReminderModal from '@/components/Favorites/ReminderModal';
import GroupModal from '@/components/Favorites/GroupModal';
import CollaborationStatsPanel from '@/components/Letter/CollaborationStats';
import EmotionChainDisplay from '@/components/Letter/EmotionChainDisplay';
import FeaturedReplies from '@/components/Letter/FeaturedReplies';
import ReportModal from '@/components/Report/ReportModal';
import ContentStatusBadge from '@/components/Report/ContentStatusBadge';
import { SharePosterModal } from '@/components/Share';
import { lettersApi } from '@/api/letters';
import { reportsApi } from '@/api/reports';
import { favoritesApi, type GroupWithCount } from '@/api/favorites';
import { sharesApi } from '@/api/shares';
import { useShareTracking } from '@/hooks/useShare';
import useAuthStore from '@/store/useAuthStore';
import useFavoriteStore from '@/store/useFavoriteStore';
import useUIStore from '@/store/useUIStore';
import type { Letter, Reply, LetterCollaborationData, ReportCheckResult, SharePosterData } from '@/types';

type ActiveTab = 'all' | 'featured' | 'chains';

export default function LetterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();
  const favStore = useFavoriteStore();
  const { pendingShareView, shareId } = useShareTracking();

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoadingLocal] = useState(true);
  const [likes, setLikes] = useState(0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyName, setReplyName] = useState('');
  const [replyEmotion, setReplyEmotion] = useState('温暖');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [showSelectGroup, setShowSelectGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [favoriteGroupId, setFavoriteGroupId] = useState<string | null>(null);

  const [collaboration, setCollaboration] = useState<(LetterCollaborationData & { replyTree: Reply[] }) | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCheck, setReportCheck] = useState<ReportCheckResult | null>(null);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const [shareStats, setShareStats] = useState<{ totalShares: number; totalViews: number } | null>(null);

  const isFavorited = id ? favStore.isFavorited(id) : false;

  const emotions = ['温暖', '治愈', '希望', '思念', '神秘', '幸福', '勇气'];

  const fetchLetter = async () => {
    if (!id) return;
    try {
      setLoadingLocal(true);
      const res = await lettersApi.getLetterById(id, user?.id);
      if (res.success && res.data) {
        setLetter(res.data);
        setLikes(res.data.likes);
        if (shareId) {
          pendingShareView('letter', id);
        }
      } else {
        showToast({ type: 'error', message: '信件不存在' });
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载信件失败' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const fetchCollaboration = async () => {
    if (!id) return;
    try {
      const res = await lettersApi.getCollaboration(id);
      if (res.success && res.data) {
        setCollaboration(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch collaboration data', err);
    }
  };

  const loadFavoriteGroupId = async () => {
    if (!user || !id) return;
    try {
      const res = await favoritesApi.getFavoriteLetters(user.id);
      if (res.success) {
        const fav = res.data.find((l) => l.id === id);
        if (fav) {
          setFavoriteGroupId((fav as any).groupId || null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkReportStatus = async () => {
    if (!id) return;
    try {
      const res = await reportsApi.checkReported(id, 'letter', user?.id);
      if (res.success && res.data) {
        setReportCheck(res.data);
      }
    } catch (err) {
      console.error('Failed to check report status', err);
    }
  };

  const fetchShareStats = async () => {
    if (!id) return;
    try {
      const res = await sharesApi.getShareStatsByTarget('letter', id);
      if (res.success && res.data) {
        setShareStats({
          totalShares: res.data.totalShares,
          totalViews: res.data.totalViews,
        });
      }
    } catch (err) {
      console.error('Failed to fetch share stats', err);
    }
  };

  useEffect(() => {
    fetchLetter();
    fetchCollaboration();
    checkReportStatus();
    fetchShareStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user) {
      favStore.initIfNeeded(user.id);
      loadFavoriteGroupId();
    }
    checkReportStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLike = async () => {
    if (!id) return;
    try {
      const res = await lettersApi.likeLetter(id);
      if (res.success) {
        setLikes(res.likes);
        showToast({ type: 'success', message: res.message });
      }
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    }
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated || !user || !id) {
      showToast({ type: 'info', message: '请先登录才能收藏哦' });
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    if (isFavorited) {
      handleRemoveFavorite();
    } else {
      favStore.refreshGroups(user.id);
      setShowSelectGroup(true);
    }
  };

  const handleRemoveFavorite = async () => {
    if (!user || !id) return;
    try {
      const res = await favStore.removeFavorite(user.id, id);
      if (res.success) {
        setFavoriteGroupId(null);
        showToast({ type: 'info', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const handleAddFavoriteToGroup = async (groupId: string | null) => {
    if (!user || !id) return;
    try {
      const res = await favStore.addFavorite(user.id, id, groupId || undefined);
      if (res.success) {
        setFavoriteGroupId(groupId);
        showToast({ type: 'success', message: res.message });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const handleCreateGroupFromDetail = async (data: { name: string; icon: string; color: string; description: string }) => {
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

  const handleSetReminder = async (data: { remindAt: string; note: string }) => {
    if (!user || !id) return;
    try {
      const res = await favoritesApi.createReminder(user.id, {
        letterId: id,
        ...data,
      });
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setShowReminderModal(false);
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '设置失败' });
    }
  };

  const handleMoveToGroup = async (groupId: string | null) => {
    if (!user || !id) return;
    try {
      const res = await favoritesApi.moveFavorites(user.id, [id], groupId);
      if (res.success) {
        showToast({ type: 'success', message: res.message });
        setFavoriteGroupId(groupId);
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '操作失败' });
    }
  };

  const handleSubmitReply = async () => {
    if (!id || !replyContent.trim()) return;
    try {
      setSubmittingReply(true);
      setLoading(true);
      const res = await lettersApi.replyLetter(id, {
        senderName: replyName.trim() || (user?.username || '匿名星人'),
        content: replyContent.trim(),
        emotion: replyEmotion,
      });
      if (res.success && res.data) {
        setLetter((prev) =>
          prev ? { ...prev, replies: [...(prev.replies || []), res.data as Reply] } : prev
        );
        setReplyContent('');
        setReplyName('');
        setShowReplyForm(false);
        showToast({ type: 'success', message: res.message || '回信已送达' });
        fetchCollaboration();
      }
    } catch (err) {
      showToast({ type: 'error', message: '回复失败，请重试' });
    } finally {
      setSubmittingReply(false);
      setLoading(false);
    }
  };

  const handleReplyUpdated = (_updatedReply: Reply) => {
    fetchCollaboration();
  };

  const handleRelaySubmitted = () => {
    fetchLetter();
    fetchCollaboration();
  };

  const getDisplayReplies = (): Reply[] => {
    if (activeTab === 'featured') {
      return collaboration?.featuredReplies || [];
    }
    return collaboration?.replyTree || letter?.replies || [];
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-cosmic-400/30 border-t-starlight animate-spin" />
          <p className="text-white/60">信件正在穿越时空而来...</p>
        </div>
      </div>
    );
  }

  if (!letter) return null;

  const displayReplies = getDisplayReplies();
  const totalReplies = collaboration?.stats?.totalReplies || letter.replies?.length || 0;

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        {shareId && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-nebula-purple/20 to-aurora/20 border border-nebula-purple/30 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-nebula-purple/20 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-aurora" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  ✨ 你正在通过好友分享的链接访问此信件
                </p>
                <p className="text-xs text-white/50">
                  每次分享都让温暖传递得更远
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('share');
                window.history.replaceState({}, '', url.toString());
                window.location.reload();
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
            >
              移除参数
            </button>
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span>返回星河</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-scale-in">
              <LetterPaper letter={letter} />
            </div>

            {id && (
              <div className="mt-2">
                <MailRouteTracker letterId={id} />
              </div>
            )}

            <div className="glass-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-6">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nebula-pink/10 border border-nebula-pink/20 hover:bg-nebula-pink/20 transition-all group"
                  >
                    <Heart className="w-5 h-5 text-nebula-pink group-hover:fill-nebula-pink transition-all" />
                    <span className="font-medium text-nebula-pink">{likes}</span>
                  </button>

                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    disabled={letter?.isHidden || letter?.isRemoved}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                      letter?.isHidden || letter?.isRemoved
                        ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                        : 'bg-aurora/10 border-aurora/20 hover:bg-aurora/20'
                    }`}
                    title={letter?.isRemoved ? '信件已删除，无法回复' : letter?.isHidden ? '信件已隐藏，暂时无法回复' : ''}
                  >
                    <MessageSquare className={`w-5 h-5 ${letter?.isHidden || letter?.isRemoved ? 'text-white/30' : 'text-aurora'}`} />
                    <span className={`font-medium ${letter?.isHidden || letter?.isRemoved ? 'text-white/30' : 'text-aurora'}`}>{totalReplies}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFavoriteClick}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                        isFavorited
                          ? 'bg-starlight/20 border-starlight/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {isFavorited ? (
                        <Bookmark className="w-5 h-5 text-starlight fill-starlight" />
                      ) : (
                        <BookmarkPlus className="w-5 h-5 text-white/70" />
                      )}
                      <span className={`font-medium ${isFavorited ? 'text-starlight' : 'text-white/70'}`}>
                        {isFavorited ? '已收藏' : '收藏'}
                      </span>
                    </button>

                    {isFavorited && (
                      <>
                        <select
                          value={favoriteGroupId || ''}
                          onChange={(e) => handleMoveToGroup(e.target.value || null)}
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-aurora/50"
                          title="移动到分组"
                        >
                          <option value="">📁 未分组</option>
                          {favStore.groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.icon} {g.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setShowReminderModal(true)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-nebula-orange/15 hover:border-nebula-orange/30 transition-all text-white/70 hover:text-nebula-orange"
                          title="设置回看提醒"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSharePoster(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-nebula-purple/20 to-aurora/20 border border-nebula-purple/30 hover:from-nebula-purple/30 hover:to-aurora/30 transition-all text-white"
                  >
                    <Sparkles className="w-5 h-5 text-starlight" />
                    <span className="text-sm font-medium">生成海报</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast({ type: 'success', message: '链接已复制到剪贴板 ✨' });
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">复制链接</span>
                  </button>
                  {shareStats && (shareStats.totalShares > 0 || shareStats.totalViews > 0) && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-starlight/10 border border-starlight/20">
                      <BarChart3 className="w-4 h-4 text-starlight" />
                      <span className="text-xs text-starlight font-medium">
                        {shareStats.totalShares > 0 && `${shareStats.totalShares}次分享`}
                        {shareStats.totalShares > 0 && shareStats.totalViews > 0 && ' · '}
                        {shareStats.totalViews > 0 && `${shareStats.totalViews}次浏览`}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowReportModal(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    reportCheck?.hasReported
                      ? 'bg-nebula-pink/10 border-nebula-pink/30 text-nebula-pink'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {reportCheck?.hasReported ? '已举报' : '举报'}
                  </span>
                </button>
              </div>

              {letter.reviewStatus && letter.reviewStatus !== 'normal' && (
                <div className="mt-4">
                  <ContentStatusBadge status={letter.reviewStatus} />
                </div>
              )}
            </div>

            {id && (
              <ReplyCandidatePool
                letterId={id}
                onCandidateSelected={() => {
                  fetchLetter();
                  fetchCollaboration();
                }}
              />
            )}

            <section>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
                  <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-starlight" />
                    回信协作区
                  </h3>
                  <span className="text-sm text-white/50">
                    {totalReplies} 封回信
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                  {(['all', 'featured', 'chains'] as ActiveTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-aurora/20 text-aurora border border-aurora/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab === 'all' ? '全部' : tab === 'featured' ? '精选' : '接龙'}
                    </button>
                  ))}
                </div>
              </div>

              {showReplyForm && !letter?.isRemoved && (
                <div className="glass-card p-5 sm:p-6 mb-6 animate-scale-in">
                  <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-aurora" />
                    {letter?.isHidden ? '信件已隐藏，暂时无法回复' : '从你的平行世界送来回信'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5">你的署名（选填）</label>
                      <input
                        type="text"
                        value={replyName}
                        onChange={(e) => setReplyName(e.target.value)}
                        placeholder="如：来自宇宙另一端的朋友"
                        maxLength={20}
                        className="input-field py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5">回信内容</label>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="写下你想说的话..."
                        rows={4}
                        maxLength={500}
                        className="input-field py-2.5 text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">情绪标签</label>
                      <div className="flex flex-wrap gap-2">
                        {emotions.map((e) => (
                          <button
                            key={e}
                            onClick={() => setReplyEmotion(e)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              replyEmotion === e
                                ? 'bg-aurora/20 text-aurora border border-aurora/40'
                                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setShowReplyForm(false)}
                        className="btn-secondary px-5 py-2 text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSubmitReply}
                        disabled={submittingReply || !replyContent.trim()}
                        className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
                      >
                        {submittingReply ? '发送中...' : <><Send className="w-4 h-4" />送出回信</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chains' && collaboration?.emotionChains ? (
                <EmotionChainDisplay chains={collaboration.emotionChains} />
              ) : activeTab === 'featured' && collaboration?.featuredReplies ? (
                collaboration.featuredReplies.length > 0 ? (
                  <div className="space-y-5 sm:space-y-6 animate-stagger">
                    {collaboration.featuredReplies.map((reply, index) => (
                      <ReplyCard
                        key={reply.id}
                        reply={reply}
                        index={index}
                        letterId={id!}
                        onReplyUpdated={handleReplyUpdated}
                        onRelaySubmitted={handleRelaySubmitted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-10 sm:p-14 text-center">
                    <div className="text-5xl mb-4">🏆</div>
                    <p className="text-lg text-white/70 font-serif-sc mb-2">
                      还没有精选回复...
                    </p>
                    <p className="text-sm text-white/50 mb-6">
                      优质回复可以被标记为精选，让更多人看到
                    </p>
                  </div>
                )
              ) : displayReplies && displayReplies.length > 0 ? (
                <div className="space-y-5 sm:space-y-6 animate-stagger">
                  {displayReplies.map((reply, index) => (
                    <ReplyCard
                      key={reply.id}
                      reply={reply}
                      index={index}
                      letterId={id!}
                      onReplyUpdated={handleReplyUpdated}
                      onRelaySubmitted={handleRelaySubmitted}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-10 sm:p-14 text-center">
                  <div className="text-5xl mb-4">🌠</div>
                  <p className="text-lg text-white/70 font-serif-sc mb-2">
                    这封信还没有收到回信...
                  </p>
                  <p className="text-sm text-white/50 mb-6">
                    也许在某个平行时空，它正被人阅读。要不要先留下你的回音？
                  </p>
                  {!showReplyForm && !letter?.isHidden && !letter?.isRemoved && (
                    <button
                      onClick={() => setShowReplyForm(true)}
                      className="btn-secondary inline-flex items-center gap-2 px-6"
                    >
                      <Send className="w-4 h-4" />
                      送出第一封回信
                    </button>
                  )}
                </div>
              )}

              {letter?.isRemoved && (
                <div className="glass-card p-10 sm:p-14 text-center mt-8">
                  <div className="text-5xl mb-4">🚫</div>
                  <p className="text-lg text-white/70 font-serif-sc mb-2">
                    互动已停止
                  </p>
                  <p className="text-sm text-white/50">
                    此信件因违反社区规范已被删除，无法继续进行互动
                  </p>
                </div>
              )}
            </section>

            <div className="mt-10 flex justify-center">
              <Link to="/" className="btn-secondary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                继续探索信件广场
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {collaboration?.stats && (
              <CollaborationStatsPanel stats={collaboration.stats} />
            )}

            {collaboration?.featuredReplies && collaboration.featuredReplies.length > 0 && (
              <FeaturedReplies replies={collaboration.featuredReplies} letterId={id!} />
            )}

            {collaboration?.emotionChains && collaboration.emotionChains.filter(c => c.totalLength > 1).length > 0 && (
              <EmotionChainDisplay chains={collaboration.emotionChains} />
            )}

            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-nebula-mint" />
                <h4 className="font-serif-sc text-lg font-semibold text-white">协作指南</h4>
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-aurora">🔗</span>
                  <span>点击「接力」可以延续某条回复，形成多人对话链</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nebula-purple">🎭</span>
                  <span>选择情绪标签加入「情绪接龙」，让心意层层传递</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-starlight">🏆</span>
                  <span>优质回复可以加精，在「精选」标签页突出展示</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-nebula-pink">💫</span>
                  <span>为喜欢的回复点赞，温暖的心意见证者越多越好</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <SelectGroupModal
          open={showSelectGroup}
          onClose={() => setShowSelectGroup(false)}
          groups={favStore.groups}
          ungroupedCount={favStore.ungroupedCount}
          onSelect={(groupId) => {
            handleAddFavoriteToGroup(groupId);
            setShowSelectGroup(false);
          }}
          onCreateNew={() => {
            setShowSelectGroup(false);
            setShowGroupModal(true);
          }}
        />

        <GroupModal
          open={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          onSubmit={handleCreateGroupFromDetail}
        />

        <ReminderModal
          open={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          onSubmit={handleSetReminder}
          letterTitle={letter?.title}
        />

        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={id || ''}
          targetType="letter"
          targetTitle={letter?.title}
          onSuccess={() => {
            checkReportStatus();
            fetchLetter();
          }}
        />

        <SharePosterModal
          open={showSharePoster}
          onClose={() => {
            setShowSharePoster(false);
            fetchShareStats();
          }}
          data={{
            targetType: 'letter',
            targetId: id || '',
            title: letter?.title,
            content: letter?.content,
            senderName: letter?.senderName,
            recipient: letter?.recipient,
            emotions: letter?.emotions,
            likes: likes,
            repliesCount: totalReplies,
            views: letter?.views,
            createdAt: letter?.createdAt,
          } as SharePosterData}
        />
      </div>
    </div>
  );
}
