import { useState } from 'react';
import { X, Send, Sparkles, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { activitiesApi } from '@/api/activities';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
  onSuccess?: () => void;
}

export default function SubmitWorkModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  onSuccess
}: SubmitWorkModalProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    emotions: [] as string[],
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);

  const availableEmotions = ['希望', '温暖', '思念', '浪漫', '思考', '神秘', '感动', '勇气'];

  if (!isOpen || !user) return null;

  const toggleEmotion = (emotion: string) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast({ type: 'warning', message: '请填写作品标题' });
      return;
    }
    if (!formData.content.trim()) {
      showToast({ type: 'warning', message: '请填写作品内容' });
      return;
    }
    if (formData.emotions.length === 0) {
      showToast({ type: 'warning', message: '请至少选择一个情绪标签' });
      return;
    }

    setLoading(true);
    try {
      await activitiesApi.submitWork(activityId, {
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        title: formData.title.trim(),
        content: formData.content.trim(),
        emotions: formData.emotions,
        isAnonymous: formData.isAnonymous
      });

      showToast({ type: 'success', message: '作品提交成功！✨' });
      setFormData({ title: '', content: '', emotions: [], isAnonymous: false });
      onClose();
      onSuccess?.();
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.response?.data?.message || '提交失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.replace(/\s/g, '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-cosmic-900/95 to-nebula-purple/30 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-aurora" />
              <h3 className="text-xl font-bold text-white">提交作品</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/50 text-sm mt-1">
            活动：{activityTitle}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-white/70 text-sm mb-2">
                作品标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="给你的作品起一个好听的标题..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                作品内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="在这里写下你的故事，让星光照亮每一个字..."
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all resize-none font-serif-sc leading-relaxed"
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-white/40">
                  已输入 {wordCount} 字
                </span>
                <span className="text-white/30">
                  建议字数：500-5000
                </span>
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-3">
                情绪标签 <span className="text-red-400">*</span>
                <span className="text-white/40 font-normal ml-2">（可多选）</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableEmotions.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.emotions.includes(emotion)
                        ? 'bg-aurora/20 text-aurora border border-aurora/30'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
              <button
                onClick={() => setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  formData.isAnonymous
                    ? 'bg-nebula-purple/20 text-nebula-pink border-nebula-purple/30'
                    : 'bg-white/5 text-white/60 border-white/10'
                }`}
              >
                {formData.isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {formData.isAnonymous ? '匿名发布' : '公开身份'}
              </button>
              <span className="text-xs text-white/40">
                {formData.isAnonymous
                  ? '其他用户将看不到你的身份信息'
                  : '其他用户可以看到你的昵称和头像'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.content.trim() || formData.emotions.length === 0}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cosmic-500 to-aurora text-white font-medium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>提交中...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交作品
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
