import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, BookmarkPlus, Bookmark, ArrowLeft, Send, MessageSquare, Sparkles, Share2 } from 'lucide-react';
import LetterPaper from '@/components/Letter/LetterPaper';
import ReplyCard from '@/components/Letter/ReplyCard';
import MailRouteTracker from '@/components/MailRoute/MailRouteTracker';
import { lettersApi } from '@/api/letters';
import { userApi } from '@/api/user';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { Letter, Reply } from '@/types';

export default function LetterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoadingLocal] = useState(true);
  const [likes, setLikes] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyName, setReplyName] = useState('');
  const [replyEmotion, setReplyEmotion] = useState('温暖');
  const [submittingReply, setSubmittingReply] = useState(false);

  const emotions = ['温暖', '治愈', '希望', '思念', '神秘', '幸福', '勇气'];

  const fetchLetter = async () => {
    if (!id) return;
    try {
      setLoadingLocal(true);
      const res = await lettersApi.getLetterById(id);
      if (res.success && res.data) {
        setLetter(res.data);
        setLikes(res.data.likes);
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

  const checkFavorite = async () => {
    if (!user || !id) return;
    try {
      const res = await userApi.getFavorites(user.id);
      if (res.success) {
        setIsFavorited(res.data.some((l) => l.id === id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLetter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user) checkFavorite();
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

  const handleFavorite = async () => {
    if (!isAuthenticated || !user || !id) {
      showToast({ type: 'info', message: '请先登录才能收藏哦' });
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    try {
      if (isFavorited) {
        const res = await userApi.removeFavorite(user.id, id);
        if (res.success) {
          setIsFavorited(false);
          showToast({ type: 'info', message: res.message });
        }
      } else {
        const res = await userApi.addFavorite(user.id, id);
        if (res.success) {
          setIsFavorited(true);
          showToast({ type: 'success', message: res.message });
        }
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
      }
    } catch (err) {
      showToast({ type: 'error', message: '回复失败，请重试' });
    } finally {
      setSubmittingReply(false);
      setLoading(false);
    }
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

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          <span>返回星河</span>
        </button>

        <div className="animate-scale-in">
          <LetterPaper letter={letter} />
        </div>

        {id && (
          <div className="mt-8">
            <MailRouteTracker letterId={id} />
          </div>
        )}

        <div className="mt-8 glass-card p-5 sm:p-6">
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-aurora/10 border border-aurora/20 hover:bg-aurora/20 transition-all"
              >
                <MessageSquare className="w-5 h-5 text-aurora" />
                <span className="font-medium text-aurora">{letter.replies?.length || 0}</span>
              </button>

              <button
                onClick={handleFavorite}
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
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast({ type: 'success', message: '链接已复制到剪贴板 ✨' });
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">分享</span>
            </button>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-nebula-purple to-aurora" />
            <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-starlight" />
              平行世界的回信
            </h3>
            <span className="text-sm text-white/50">
              {letter.replies?.length || 0} 封回信
            </span>
          </div>

          {showReplyForm && (
            <div className="glass-card p-5 sm:p-6 mb-6 animate-scale-in">
              <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-aurora" />
                从你的平行世界送来回信
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

          {letter.replies && letter.replies.length > 0 ? (
            <div className="space-y-5 sm:space-y-6 animate-stagger">
              {letter.replies.map((reply, index) => (
                <ReplyCard key={reply.id} reply={reply} index={index} />
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
              {!showReplyForm && (
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
        </section>

        <div className="mt-12 flex justify-center">
          <Link to="/" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            继续探索信件广场
          </Link>
        </div>
      </div>
    </div>
  );
}
