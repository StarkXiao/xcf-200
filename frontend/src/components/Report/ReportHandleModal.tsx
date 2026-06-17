import { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, Eye, EyeOff, XCircle, CheckCircle, User, Clock, FileText } from 'lucide-react';
import type { Report } from '@/types';
import { formatDate } from '@/utils/helpers';

interface ReportHandleModalProps {
  open: boolean;
  onClose: () => void;
  report: Report | null;
  defaultAction?: 'warning' | 'hide' | 'remove' | 'reject' | null;
  onHandle: (action: 'warning' | 'hide' | 'remove' | 'reject', reason: string) => Promise<void>;
}

export default function ReportHandleModal({
  open,
  onClose,
  report,
  defaultAction = null,
  onHandle,
}: ReportHandleModalProps) {
  const [selectedAction, setSelectedAction] = useState<'warning' | 'hide' | 'remove' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedAction(defaultAction || null);
      setReason('');
      setSubmitting(false);
    }
  }, [open, defaultAction]);

  if (!open || !report) return null;

  const actionOptions = [
    {
      key: 'warning' as const,
      label: '发出警告',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10 border-yellow-400/30',
      description: '对内容发布者发出警告，内容保留',
    },
    {
      key: 'hide' as const,
      label: '隐藏内容',
      icon: EyeOff,
      color: 'text-aurora',
      bgColor: 'bg-aurora/10 border-aurora/30',
      description: '隐藏内容，普通用户不可见',
    },
    {
      key: 'remove' as const,
      label: '删除内容',
      icon: XCircle,
      color: 'text-nebula-pink',
      bgColor: 'bg-nebula-pink/10 border-nebula-pink/30',
      description: '永久删除该内容',
    },
    {
      key: 'reject' as const,
      label: '驳回举报',
      icon: CheckCircle,
      color: 'text-nebula-mint',
      bgColor: 'bg-nebula-mint/10 border-nebula-mint/30',
      description: '举报不成立，内容正常展示',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedAction) return;
    try {
      setSubmitting(true);
      await onHandle(selectedAction, reason);
      setSelectedAction(null);
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const targetTypeLabel = report.targetType === 'letter' ? '信件' : '回复';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-nebula-pink" />
            处理举报
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-aurora" />
              <span className="text-sm font-medium text-white">{targetTypeLabel}内容</span>
            </div>
            {report.targetTitle && (
              <p className="text-sm text-white/80 font-medium mb-2">{report.targetTitle}</p>
            )}
            {report.targetContent && (
              <p className="text-sm text-white/60 whitespace-pre-line line-clamp-4">
                {report.targetContent}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">举报类型</p>
              <p className="text-sm font-medium text-white">
                {report.reportTypeLabel || report.reportType}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">举报人</p>
              <p className="text-sm font-medium text-white">{report.reporterName}</p>
            </div>
          </div>

          {report.reason && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/50 mb-1">举报原因</p>
              <p className="text-sm text-white/80">{report.reason}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span>举报时间：{formatDate(report.createdAt)}</span>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-white/80 mb-3">选择处理方式</p>
          <div className="space-y-2">
            {actionOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedAction === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedAction(opt.key)}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    isSelected
                      ? `${opt.bgColor} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.bgColor}`}>
                      <Icon className={`w-5 h-5 ${opt.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">{opt.description}</p>
                    </div>
                    {isSelected && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${opt.bgColor}`}>
                        <svg
                          className={`w-3 h-3 ${opt.color}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
            <span>处理说明（选填）</span>
            <span className="text-xs text-white/40">{reason.length}/200</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="请输入处理说明，将通知给相关用户..."
            className="input-field resize-none text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedAction || submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            确认处理
          </button>
        </div>
      </div>
    </div>
  );
}
