import { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { activitiesApi } from '@/api/activities';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
  onSuccess?: () => void;
}

export default function RegisterModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  onSuccess
}: RegisterModalProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [applyReason, setApplyReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async () => {
    if (!applyReason.trim()) {
      showToast({ type: 'warning', message: '请填写申请理由' });
      return;
    }

    setLoading(true);
    try {
      await activitiesApi.registerActivity(activityId, {
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        applyReason: applyReason.trim()
      });

      showToast({ type: 'success', message: '报名申请已提交，等待审核 ✨' });
      setApplyReason('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.response?.data?.message || '报名失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-cosmic-900/95 to-nebula-purple/30 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-aurora" />
              <h3 className="text-xl font-bold text-white">活动报名</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-white/80 text-sm">
              你正在报名参加：
            </p>
            <p className="text-white font-medium mt-1">
              {activityTitle}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">
              申请理由 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              placeholder="简单说明你为什么想参加这个活动..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all resize-none"
            />
            <p className="text-xs text-white/40 mt-2">
              已输入 {applyReason.length} 字
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !applyReason.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cosmic-500 to-aurora text-white font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>提交中...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交申请
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
