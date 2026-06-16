import { useState } from 'react';
import { Star, ThumbsUp, Send, X } from 'lucide-react';
import { strangerReplyApi } from '@/api/strangerReply';
import type { ReplyReviewTags, StrangerReply } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

interface ReplyReviewPanelProps {
  reply: StrangerReply;
  onReviewed?: () => void;
  compact?: boolean;
}

export default function ReplyReviewPanel({ reply, onReviewed, compact = false }: ReplyReviewPanelProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [reviewTags, setReviewTags] = useState<ReplyReviewTags | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadReviewTags = async () => {
    if (loaded) return;
    try {
      const res = await strangerReplyApi.getReviewTags();
      if (res.success) {
        setReviewTags(res.data);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoaded(true);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!rating) {
      showToast({ type: 'warning', message: '请选择评分' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await strangerReplyApi.submitReview({
        replyId: reply.id,
        rating,
        tags: selectedTags,
        comment: comment.trim() || undefined,
        reviewerId: user?.id,
      });
      if (res.success) {
        showToast({ type: 'success', message: '评价已提交，感谢你的反馈 🌟' });
        setShowReviewForm(false);
        onReviewed?.();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err?.response?.data?.message || '提交失败' });
    } finally {
      setSubmitting(false);
    }
  };

  if (reply.review) {
    return (
      <div className={`p-4 rounded-xl bg-starlight/5 border border-starlight/10 ${compact ? 'mt-3' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/50">你的评价</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < reply.review!.rating
                    ? 'text-starlight fill-starlight'
                    : 'text-white/20'
                }`}
              />
            ))}
          </div>
        </div>
        {reply.review.tags && reply.review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {reply.review.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-aurora/10 text-aurora/80"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {reply.review.comment && (
          <p className="text-xs text-white/60 italic">"{reply.review.comment}"</p>
        )}
      </div>
    );
  }

  if (!showReviewForm) {
    return (
      <button
        onClick={() => {
          if (!isAuthenticated) {
            showToast({ type: 'warning', message: '请先登录' });
            return;
          }
          loadReviewTags();
          setShowReviewForm(true);
        }}
        className={`flex items-center gap-1.5 text-xs text-starlight hover:text-starlight/80 transition-colors ${compact ? 'mt-2' : ''}`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        评价这封回信
      </button>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-starlight/5 border border-starlight/10 animate-fade-in ${compact ? 'mt-3' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-white">评价这封回信</h4>
        <button
          onClick={() => setShowReviewForm(false)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs text-white/50 mb-2">整体评分</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            const isFilled = starValue <= (hoverRating || rating);
            return (
              <button
                key={i}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(starValue)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    isFilled
                      ? 'text-starlight fill-starlight'
                      : 'text-white/20'
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-2 text-sm text-white/60">
            {rating > 0 ? `${rating} 星` : '请评分'}
          </span>
        </div>
      </div>

      {reviewTags && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-2">标签评价（可多选）</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-aurora/70 mb-1.5">👍 正面标签</p>
              <div className="flex flex-wrap gap-1.5">
                {reviewTags.positive.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-aurora/20 text-aurora border border-aurora/30'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-nebula-pink/70 mb-1.5">💬 需改进</p>
              <div className="flex flex-wrap gap-1.5">
                {reviewTags.negative.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/30'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-white/50 mb-2">补充评价（选填）</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="说说你的感受..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-starlight/50 resize-none"
          maxLength={200}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowReviewForm(false)}
          className="px-4 py-2 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !rating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-starlight to-aurora hover:shadow-lg hover:shadow-starlight/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          提交评价
        </button>
      </div>
    </div>
  );
}
