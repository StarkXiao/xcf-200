import { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, Send } from 'lucide-react';
import { reportsApi } from '@/api/reports';
import useUIStore from '@/store/useUIStore';
import useAuthStore from '@/store/useAuthStore';
import type { ReportType, ReportTargetType, ReportTypeInfo } from '@/types';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetType: ReportTargetType;
  targetTitle?: string;
  onSuccess?: () => void;
}

export default function ReportModal({
  open,
  onClose,
  targetId,
  targetType,
  targetTitle,
  onSuccess,
}: ReportModalProps) {
  const [reportTypes, setReportTypes] = useState<ReportTypeInfo[]>([]);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useUIStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (open) {
      fetchReportTypes();
      setSelectedType(null);
      setReason('');
    }
  }, [open]);

  const fetchReportTypes = async () => {
    try {
      const res = await reportsApi.getReportTypes();
      if (res.success && res.data) {
        setReportTypes(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch report types', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      showToast({ type: 'warning', message: '请选择举报类型' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportsApi.submitReport({
        targetId,
        targetType,
        reportType: selectedType,
        reason: reason.trim(),
        reporterId: user?.id,
        reporterName: user?.username || '匿名用户',
      });

      if (res.success) {
        showToast({ type: 'success', message: res.message || '举报已提交' });
        onSuccess?.();
        onClose();
      } else {
        showToast({ type: 'error', message: res.message || '提交失败' });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.response?.data?.message || '提交失败，请重试',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-nebula-pink" />
            举报内容
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetTitle && (
          <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 mb-1">
              {targetType === 'letter' ? '举报信件' : '举报回复'}
            </p>
            <p className="text-sm text-white/80 truncate">{targetTitle}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-nebula-orange" />
              请选择举报类型
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reportTypes.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setSelectedType(type.key)}
                  className={`w-full p-3 rounded-xl text-left transition-all border ${
                    selectedType === type.key
                      ? 'bg-nebula-pink/15 border-nebula-pink/40 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-white/50 mt-0.5">{type.description}</p>
                    </div>
                    {selectedType === type.key && (
                      <div className="w-5 h-5 rounded-full bg-nebula-pink flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2 flex justify-between">
              <span>补充说明（选填）</span>
              <span className="text-xs text-white/40">{reason.length}/200</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="请详细描述举报原因，帮助我们更好地核实..."
              className="input-field resize-none text-sm"
            />
          </div>

          <div className="p-3 rounded-xl bg-aurora/5 border border-aurora/20">
            <p className="text-xs text-aurora/80 leading-relaxed">
              💡 我们会认真对待每一条举报，核实后将按照社区规范进行处理。请确保举报内容真实有效，恶意举报可能会被限制功能。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedType}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              提交举报
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
