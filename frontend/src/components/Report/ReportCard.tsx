import { Flag, Clock, User, AlertTriangle, Eye, EyeOff, XCircle, CheckCircle } from 'lucide-react';
import type { Report } from '@/types';
import { formatDate } from '@/utils/helpers';

interface ReportCardProps {
  report: Report;
  onHandle?: (report: Report, action: 'warning' | 'hide' | 'remove' | 'reject') => void;
  onView?: (report: Report) => void;
}

const statusColors = {
  pending: 'bg-nebula-orange/10 text-nebula-orange border-nebula-orange/30',
  processing: 'bg-aurora/10 text-aurora border-aurora/30',
  resolved: 'bg-nebula-mint/10 text-nebula-mint border-nebula-mint/30',
  rejected: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
};

const targetTypeLabels = {
  letter: '信件',
  reply: '回复',
};

export default function ReportCard({ report, onHandle, onView }: ReportCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nebula-pink/10 flex items-center justify-center">
            <Flag className="w-5 h-5 text-nebula-pink" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {report.reportTypeLabel || report.reportType}
              </span>
              <span className="text-xs text-white/40">
                {targetTypeLabels[report.targetType as keyof typeof targetTypeLabels] || report.targetType}
              </span>
            </div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatDate(report.createdAt)}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[report.status as keyof typeof statusColors]}`}
        >
          {report.statusLabel || report.status}
        </span>
      </div>

      {report.targetTitle && (
        <div className="mb-3">
          <p className="text-xs text-white/50 mb-1">标题</p>
          <p className="text-sm text-white/80 font-medium truncate">{report.targetTitle}</p>
        </div>
      )}

      {report.targetContent && (
        <div className="mb-3">
          <p className="text-xs text-white/50 mb-1">内容摘要</p>
          <p className="text-sm text-white/70 line-clamp-2">{report.targetContent}</p>
        </div>
      )}

      {report.reason && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-1">举报原因</p>
          <p className="text-sm text-white/70 line-clamp-2">{report.reason}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/50">{report.reporterName}</span>
        </div>

        {report.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView?.(report)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHandle?.(report, 'warning')}
              className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-all"
              title="发出警告"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHandle?.(report, 'hide')}
              className="p-1.5 rounded-lg text-aurora hover:bg-aurora/10 transition-all"
              title="隐藏内容"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHandle?.(report, 'remove')}
              className="p-1.5 rounded-lg text-nebula-pink hover:bg-nebula-pink/10 transition-all"
              title="删除内容"
            >
              <XCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHandle?.(report, 'reject')}
              className="p-1.5 rounded-lg text-nebula-mint hover:bg-nebula-mint/10 transition-all"
              title="驳回举报"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-white/40">
            {report.handlerName && `处理人：${report.handlerName}`}
          </div>
        )}
      </div>

      {report.result && report.status !== 'pending' && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/50 mb-1">处理结果</p>
          <p className="text-sm text-white/70">{report.result}</p>
        </div>
      )}
    </div>
  );
}
