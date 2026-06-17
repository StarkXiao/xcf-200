import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, X, Send, MessageSquare } from 'lucide-react';
import { lettersApi } from '@/api/letters';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { Reply, ReplyQualityFeedback } from '@/types';

const FEEDBACK_TAGS = [
  '温暖治愈',
  '真诚走心',
  '文笔优美',
  '感同身受',
  '鼓励人心',
  '幽默风趣',
  '敷衍了事',
  '内容空洞',
  '语气生硬',
  '答非所问',
];

interface ReplyFeedbackProps {
  reply: Reply;
  onFeedbackSubmitted?: (feedback: ReplyQualityFeedback) => void;
  onClose?: () => void;
}

export default function ReplyFeedback({
  reply,
  onFeedbackSubmitted,
  onClose,
}: ReplyFeedbackProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0 || helpful === null) {
      showToast({
        type: 'warning',
        message: '请选择评分和是否有帮助',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await lettersApi.submitReplyFeedback({
        replyId: reply.id,
        rating,
        helpful,
        tags: selectedTags,
        comment,
        userId: user?.id,
      });

      if (res.success && res.data) {
        showToast({
          type: 'success',
          message: res.message || '反馈提交成功，感谢你的支持 🌟',
        });
        onFeedbackSubmitted?.(res.data.feedback);
        onClose?.();
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: '提交失败，请重试',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isAiReply = reply.source === 'ai_generated' || reply.source === 'ai_fallback';

  return (
    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/80">
            {isAiReply ? 'AI回复质量反馈' : '回复质量反馈'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/60 mb-2">评分</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
                disabled={submitting}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-starlight text-starlight'
                      : 'text-white/30'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-white/60">
              {rating > 0 ? `${rating} 星` : '请选择'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-2">是否有帮助</label>
          <div className="flex gap-2">
            <button
              onClick={() => setHelpful(true)}
              disabled={submitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                helpful === true
                  ? 'bg-aurora/20 text-aurora border border-aurora/40'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>有帮助</span>
            </button>
            <button
              onClick={() => setHelpful(false)}
              disabled={submitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                helpful === false
                  ? 'bg-nebula-pink/20 text-nebula-pink border border-nebula-pink/40'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>没帮助</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-2">标签（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                disabled={submitting}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/40'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-2">补充意见（选填）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="有什么想告诉我们的？"
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm placeholder:text-white/30 focus:outline-none focus:border-aurora/50 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || helpful === null}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-aurora to-nebula-purple text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? '提交中...' : '提交反馈'}</span>
        </button>
      </div>
    </div>
  );
}
