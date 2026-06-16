import { Check, X, AlertTriangle, Clock } from 'lucide-react';
import RiskLevelBadge from './RiskLevelBadge';
import type { ReplyReviewTask } from '@/types';

interface ReviewTaskCardProps {
  task: ReplyReviewTask;
  onApprove: (task: ReplyReviewTask) => void;
  onReject: (task: ReplyReviewTask) => void;
  onEscalate: (task: ReplyReviewTask) => void;
}

export default function ReviewTaskCard({
  task,
  onApprove,
  onReject,
  onEscalate,
}: ReviewTaskCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 hover:shadow-lg hover:shadow-aurora/5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium mb-1 truncate">
            {task.letterTitle}
          </h4>
          <p className="text-xs text-white/40">
            {new Date(task.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <RiskLevelBadge level={task.riskLevel} size="sm" />
      </div>

      <div className="bg-black/20 rounded-xl p-4 mb-4 max-h-32 overflow-y-auto">
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
          {task.replyContent}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-white/50">情感标签：</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-starlight/10 text-starlight/80">
          {task.replyEmotion}
        </span>
      </div>

      {task.status === 'pending' ? (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(task)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            通过
          </button>
          <button
            onClick={() => onReject(task)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" />
            驳回
          </button>
          <button
            onClick={() => onEscalate(task)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            升级
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-white/40" />
          <span className="text-white/60">
            {task.status === 'approved' && '已通过'}
            {task.status === 'rejected' && '已驳回'}
            {task.status === 'escalated' && '已升级'}
          </span>
          {task.reviewReason && (
            <span className="text-white/40">- {task.reviewReason}</span>
          )}
        </div>
      )}
    </div>
  );
}
