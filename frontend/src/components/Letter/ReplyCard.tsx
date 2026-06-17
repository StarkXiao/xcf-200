import { useState } from 'react';
import type { Reply, ReplyQualityFeedback } from '@/types';
import EmotionTag from '@/components/Emotion/EmotionTag';
import RelayReplyForm from './RelayReplyForm';
import ReplyFeedback from './ReplyFeedback';
import { formatDate } from '@/utils/helpers';
import {
  Globe2,
  Sparkles,
  Heart,
  Link2,
  Trophy,
  Crown,
  Bot,
  User,
  Users,
  MessageSquare,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { lettersApi } from '@/api/letters';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

const parallelColors = [
  { from: 'from-aurora', to: 'from-nebula-purple', border: 'border-aurora/40', bg: 'bg-aurora/10' },
  { from: 'from-starlight', to: 'from-nebula-orange', border: 'border-starlight/40', bg: 'bg-starlight/10' },
  { from: 'from-nebula-mint', to: 'from-aurora', border: 'border-nebula-mint/40', bg: 'bg-nebula-mint/10' },
  { from: 'from-nebula-pink', to: 'from-nebula-purple', border: 'border-nebula-pink/40', bg: 'bg-nebula-pink/10' },
  { from: 'from-cosmic-300', to: 'from-aurora', border: 'border-cosmic-300/40', bg: 'bg-cosmic-300/10' },
];

const sourceConfig = {
  human: {
    icon: User,
    label: '人工回复',
    color: 'text-aurora',
    bgColor: 'bg-aurora/15',
    borderColor: 'border-aurora/30',
  },
  ai_generated: {
    icon: Bot,
    label: 'AI回复',
    color: 'text-nebula-purple',
    bgColor: 'bg-nebula-purple/15',
    borderColor: 'border-nebula-purple/30',
  },
  ai_fallback: {
    icon: Bot,
    label: 'AI补位',
    color: 'text-nebula-orange',
    bgColor: 'bg-nebula-orange/15',
    borderColor: 'border-nebula-orange/30',
  },
  stranger: {
    icon: Users,
    label: '陌生人',
    color: 'text-starlight',
    bgColor: 'bg-starlight/15',
    borderColor: 'border-starlight/30',
  },
};

interface ReplyCardProps {
  reply: Reply;
  index?: number;
  letterId: string;
  onReplyUpdated?: (updatedReply: Reply) => void;
  onRelaySubmitted?: () => void;
  depth?: number;
}

export default function ReplyCard({
  reply,
  index = 0,
  letterId,
  onReplyUpdated,
  onRelaySubmitted,
  depth = 0,
}: ReplyCardProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const colorScheme = parallelColors[index % parallelColors.length];

  const [showRelayForm, setShowRelayForm] = useState(false);
  const [submittingRelay, setSubmittingRelay] = useState(false);
  const [likes, setLikes] = useState(reply.likes || 0);
  const [isFeatured, setIsFeatured] = useState(reply.isFeatured || false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<ReplyQualityFeedback | null>(reply.feedback || null);

  const handleLike = async () => {
    if (likeLoading) return;
    try {
      setLikeLoading(true);
      const res = await lettersApi.likeReply(letterId, reply.id, user?.id);
      if (res.success) {
        setLikes(res.likes);
        showToast({ type: 'success', message: res.message });
      }
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (featureLoading) return;
    try {
      setFeatureLoading(true);
      const res = await lettersApi.featureReply(letterId, reply.id, !isFeatured, user?.id);
      if (res.success && res.data) {
        setIsFeatured(res.data.isFeatured || false);
        if (onReplyUpdated) onReplyUpdated(res.data);
        showToast({ type: 'success', message: res.message || '操作成功' });
      }
    } catch (err) {
      showToast({ type: 'error', message: '操作失败' });
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleRelaySubmit = async (data: { content: string; emotion: string; senderName?: string }) => {
    try {
      setSubmittingRelay(true);
      const res = await lettersApi.relayReply(letterId, {
        parentReplyId: reply.id,
        ...data,
        replierId: user?.id,
      });
      if (res.success) {
        showToast({ type: 'success', message: res.message || '接力回复已送达' });
        setShowRelayForm(false);
        if (onRelaySubmitted) onRelaySubmitted();
      }
    } catch (err) {
      showToast({ type: 'error', message: '回复失败，请重试' });
    } finally {
      setSubmittingRelay(false);
    }
  };

  const handleFeedbackSubmitted = (newFeedback: ReplyQualityFeedback) => {
    setFeedback(newFeedback);
    if (onReplyUpdated) {
      onReplyUpdated({ ...reply, feedback: newFeedback });
    }
  };

  const sourceInfo = reply.source ? sourceConfig[reply.source] : null;
  const SourceIcon = sourceInfo?.icon || Globe2;
  const isAiReply = reply.source === 'ai_generated' || reply.source === 'ai_fallback';
  const marginLeft = depth > 0 ? 'ml-4 sm:ml-8' : '';

  return (
    <div className={marginLeft}>
      <div
        className={`relative p-5 sm:p-6 rounded-2xl border backdrop-blur-sm animate-fade-in-up ${
          isFeatured
            ? 'bg-gradient-to-br from-starlight/15 via-transparent to-aurora/10 border-starlight/40 ring-1 ring-starlight/20'
            : `${colorScheme.bg} ${colorScheme.border}`
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {isFeatured && (
          <div className="absolute -top-3 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-starlight/30 to-nebula-orange/30 border border-starlight/40 text-xs font-medium text-starlight">
            <Crown className="w-3 h-3" />
            <span>精选回复</span>
          </div>
        )}

        {sourceInfo && (
          <div
            className={`absolute -top-3 left-6 flex items-center gap-1.5 px-3 py-1 rounded-full border ${sourceInfo.bgColor} ${sourceInfo.borderColor}`}
          >
            <SourceIcon className={`w-3 h-3 ${sourceInfo.color}`} />
            <span className={`text-xs font-medium ${sourceInfo.color}`}>
              {sourceInfo.label}
            </span>
          </div>
        )}

        {depth === 0 && (
          <div className={`absolute -top-3 left-6 h-6 w-6 rounded-t-full border-x-2 border-t-2 ${colorScheme.border} ${colorScheme.bg}`} />
        )}

        {depth > 0 && (
          <div className="absolute -left-3 sm:-left-5 top-8 w-3 sm:w-5 h-px bg-gradient-to-r from-transparent to-white/20" />
        )}

        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br ${colorScheme.from}/20 ${colorScheme.to}/20 flex items-center justify-center shadow-inner ${depth > 0 ? 'w-8 h-8 sm:w-10 sm:h-10' : ''}`}>
            <SourceIcon className={`text-white/80 ${depth > 0 ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className={`font-serif-sc font-semibold text-white ${depth > 0 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                {reply.senderName}
              </h4>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10">
                <Sparkles className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{reply.fromParallel}</span>
              </div>
              {reply.chainOrder && reply.chainOrder > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-nebula-purple/15 text-nebula-purple border border-nebula-purple/20">
                  <Link2 className="w-3 h-3" />
                  <span>第 {reply.chainOrder + 1} 棒</span>
                </div>
              )}
              {reply.qualityScore && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-starlight/15 text-starlight border border-starlight/20">
                  <Star className="w-3 h-3 fill-starlight" />
                  <span>质量分 {reply.qualityScore}</span>
                </div>
              )}
            </div>

            <p className={`text-white/85 leading-relaxed whitespace-pre-line mb-4 ${depth > 0 ? 'text-sm' : 'text-sm sm:text-base'}`}>
              {reply.content}
            </p>

            {feedback && (
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-starlight" />
                  <span className="text-xs font-medium text-white/70">你的反馈</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= feedback.rating
                            ? 'fill-starlight text-starlight'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {feedback.helpful ? (
                      <ThumbsUp className="w-3.5 h-3.5 text-aurora" />
                    ) : (
                      <ThumbsUp className="w-3.5 h-3.5 text-nebula-pink rotate-180" />
                    )}
                    <span className="text-white/50">
                      {feedback.helpful ? '有帮助' : '没帮助'}
                    </span>
                  </div>
                  {feedback.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feedback.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-nebula-purple/10 text-nebula-purple border border-nebula-purple/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {reply.emotion && <EmotionTag name={reply.emotion} size="sm" />}
                <span className="text-xs text-white/50">{formatDate(reply.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-nebula-pink/10 text-white/60 hover:text-nebula-pink transition-all disabled:opacity-50"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>{likes}</span>
                </button>

                <button
                  onClick={() => setShowRelayForm(!showRelayForm)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    showRelayForm
                      ? 'bg-aurora/20 text-aurora border border-aurora/30'
                      : 'hover:bg-aurora/10 text-white/60 hover:text-aurora'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>接力</span>
                </button>

                {isAiReply && !feedback && (
                  <button
                    onClick={() => setShowFeedback(!showFeedback)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      showFeedback
                        ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/30'
                        : 'hover:bg-nebula-purple/10 text-white/60 hover:text-nebula-purple'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>反馈</span>
                  </button>
                )}

                {depth === 0 && (
                  <button
                    onClick={handleToggleFeatured}
                    disabled={featureLoading}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50 ${
                      isFeatured
                        ? 'bg-starlight/20 text-starlight border border-starlight/30'
                        : 'hover:bg-starlight/10 text-white/60 hover:text-starlight'
                    }`}
                    title={isFeatured ? '取消精选' : '设为精选'}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{isFeatured ? '精选' : '加精'}</span>
                  </button>
                )}
              </div>
            </div>

            {showFeedback && !feedback && (
              <ReplyFeedback
                reply={reply}
                onFeedbackSubmitted={handleFeedbackSubmitted}
                onClose={() => setShowFeedback(false)}
              />
            )}

            {showRelayForm && (
              <RelayReplyForm
                parentReplyId={reply.id}
                parentSenderName={reply.senderName}
                onSubmit={handleRelaySubmit}
                onCancel={() => setShowRelayForm(false)}
                submitting={submittingRelay}
              />
            )}

            {reply.subReplies && reply.subReplies.length > 0 && (
              <div className="mt-4 space-y-4">
                {reply.subReplies.map((subReply, subIndex) => (
                  <ReplyCard
                    key={subReply.id}
                    reply={subReply}
                    index={subIndex}
                    letterId={letterId}
                    onReplyUpdated={onReplyUpdated}
                    onRelaySubmitted={onRelaySubmitted}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
