import { useState, useEffect } from 'react';
import {
  Bot,
  Clock,
  Sparkles,
  Star,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Timer,
  Send,
} from 'lucide-react';
import { lettersApi } from '@/api/letters';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { ReplyCandidate, ReplyCandidatePoolData } from '@/types';

interface ReplyCandidatePoolProps {
  letterId: string;
  onCandidateSelected?: () => void;
}

const poolStatusConfig = {
  waiting_human: {
    label: '等待人工回复',
    icon: Clock,
    color: 'text-aurora',
    bgColor: 'bg-aurora/10',
    borderColor: 'border-aurora/30',
  },
  human_replied: {
    label: '已有人工回复',
    icon: UserCheck,
    color: 'text-starlight',
    bgColor: 'bg-starlight/10',
    borderColor: 'border-starlight/30',
  },
  ai_selected: {
    label: '已选择AI回复',
    icon: Bot,
    color: 'text-nebula-purple',
    bgColor: 'bg-nebula-purple/10',
    borderColor: 'border-nebula-purple/30',
  },
  timeout_fallback: {
    label: 'AI超时补位',
    icon: Timer,
    color: 'text-nebula-orange',
    bgColor: 'bg-nebula-orange/10',
    borderColor: 'border-nebula-orange/30',
  },
  closed: {
    label: '已关闭',
    icon: CheckCircle2,
    color: 'text-white/60',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
  },
};

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '已超时';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function ReplyCandidatePool({
  letterId,
  onCandidateSelected,
}: ReplyCandidatePoolProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [poolData, setPoolData] = useState<ReplyCandidatePoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    loadPoolData();
  }, [letterId]);

  useEffect(() => {
    if (!poolData) return;

    setTimeRemaining(poolData.remainingTime);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          checkTimeout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [poolData]);

  const loadPoolData = async () => {
    try {
      setLoading(true);
      const res = await lettersApi.getReplyCandidates(letterId);
      if (res.success && res.data) {
        setPoolData(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidate pool:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkTimeout = async () => {
    try {
      const res = await lettersApi.checkTimeout(letterId);
      if (res.success && res.data?.poolData) {
        setPoolData(res.data.poolData);
        if (res.data.hasFallback) {
          onCandidateSelected?.();
        }
      }
    } catch (err) {
      console.error('Failed to check timeout:', err);
    }
  };

  const handleSelectCandidate = async (candidate: ReplyCandidate) => {
    if (selecting) return;
    if (poolData?.pool.status !== 'waiting_human') return;

    try {
      setSelecting(true);
      const res = await lettersApi.selectCandidate(letterId, {
        letterId,
        candidateId: candidate.id,
        userId: user?.id,
      });

      if (res.success) {
        showToast({
          type: 'success',
          message: '已选择AI回复并发送',
        });
        await loadPoolData();
        onCandidateSelected?.();
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: '选择失败，请重试',
      });
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-24 bg-white/10 rounded"></div>
          <div className="h-24 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return null;
  }

  const { pool, candidates, hasHumanReply } = poolData;
  const statusConfig = poolStatusConfig[pool.status];
  const StatusIcon = statusConfig.icon;
  const canSelect = pool.status === 'waiting_human' && !hasHumanReply;

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-nebula-purple" />
            <h3 className="text-lg font-semibold text-white">AI回信候选池</h3>
          </div>
          <p className="text-sm text-white/60">
            系统为你准备了 {candidates.length} 条AI候选回复，你可以选择一条发送，
            或等待陌生人的温暖回应
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
        >
          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {canSelect && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-aurora/10 to-nebula-purple/10 border border-aurora/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-aurora/20">
                <Clock className="w-5 h-5 text-aurora" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">倒计时</p>
                <p className="text-xs text-white/60">
                  {timeRemaining > 0
                    ? `如果 ${formatTimeRemaining(timeRemaining)} 内没有人工回复，系统将自动发送质量最高的AI回复`
                    : '正在检测超时状态...'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-aurora">
                {formatTimeRemaining(timeRemaining)}
              </p>
              <p className="text-xs text-white/50">
                剩余时间
              </p>
            </div>
          </div>
        </div>
      )}

      {hasHumanReply && (
        <div className="mb-6 p-4 rounded-xl bg-starlight/10 border border-starlight/20">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-starlight" />
            <div>
              <p className="text-sm font-medium text-white">已收到陌生人的温暖回应 ✨</p>
              <p className="text-xs text-white/60">
                候选池已关闭，你可以在下方查看陌生人的回复
              </p>
            </div>
          </div>
        </div>
      )}

      {pool.status === 'ai_selected' && !hasHumanReply && (
        <div className="mb-6 p-4 rounded-xl bg-nebula-purple/10 border border-nebula-purple/20">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-nebula-purple" />
            <div>
              <p className="text-sm font-medium text-white">你已手动选择了AI回复并发送 ✨</p>
              <p className="text-xs text-white/60">
                候选池已关闭，你可以在下方查看已发送的AI回复
              </p>
            </div>
          </div>
        </div>
      )}

      {pool.status === 'timeout_fallback' && (
        <div className="mb-6 p-4 rounded-xl bg-nebula-orange/10 border border-nebula-orange/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-nebula-orange" />
            <div>
              <p className="text-sm font-medium text-white">已触发超时补位</p>
              <p className="text-xs text-white/60">
                由于在等待时间内没有收到人工回复，系统已自动发送质量最高的AI回复
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
          候选回复（按质量分排序）
        </p>
        {candidates
          .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
          .map((candidate, index) => (
            <div
              key={candidate.id}
              className={`relative p-4 rounded-xl border transition-all ${
                candidate.status === 'selected'
                  ? 'bg-aurora/10 border-aurora/40'
                  : candidate.status === 'rejected'
                    ? 'bg-white/3 border-white/10 opacity-50'
                    : canSelect && selectedCandidateId === candidate.id
                      ? 'bg-nebula-purple/10 border-nebula-purple/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {candidate.status === 'selected' && (
                <div className="absolute -top-2 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-aurora/20 border border-aurora/40">
                  <CheckCircle2 className="w-3 h-3 text-aurora" />
                  <span className="text-[10px] font-medium text-aurora">已发送</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-nebula-purple/20 shrink-0">
                  <Bot className="w-5 h-5 text-nebula-purple" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">
                      {candidate.senderName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
                      #{candidate.candidateIndex + 1} 候选
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-starlight/15 text-starlight border border-starlight/20">
                      <Star className="w-3 h-3 fill-starlight" />
                      <span>{candidate.qualityScore} 分</span>
                    </div>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                    {candidate.content}
                  </p>

                  {canSelect && candidate.status === 'pending' && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() => handleSelectCandidate(candidate)}
                        disabled={selecting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-aurora to-nebula-purple text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{selecting && selectedCandidateId === candidate.id ? '发送中...' : '选择并发送'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            小贴士：你可以选择一条AI回复立即发送，也可以等待陌生人的真实回应。
            5分钟内没有人工回复时，系统将自动发送质量最高的候选回复。
          </span>
        </div>
      </div>
    </div>
  );
}
