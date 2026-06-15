import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Eye, EyeOff, Sparkles, Feather, Target } from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { lettersApi } from '@/api/letters';
import { emotionsApi } from '@/api/emotions';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { Emotion } from '@/types';

const recipientTypes = [
  { value: 'future', label: '未来的人', icon: '🔮', desc: '给未来的自己或某人' },
  { value: 'past', label: '过去的人', icon: '🕰️', desc: '给曾经的Ta或过去的自己' },
  { value: 'parallel', label: '平行世界', icon: '🌌', desc: '给另一个宇宙的人' },
  { value: 'unknown', label: '未知宇宙', icon: '✨', desc: '随机漂流到未知目的地' },
];

export default function WriteLetter() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [recipient, setRecipient] = useState('');
  const [recipientType, setRecipientType] = useState('future');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchEmotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchEmotions = async () => {
    try {
      const res = await emotionsApi.getAll();
      if (res.success) setEmotions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEmotion = (name: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(name)
        ? prev.filter((e) => e !== name)
        : prev.length < 5
          ? [...prev, name]
          : prev
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!recipient.trim()) newErrors.recipient = '请填写收件人';
    if (!title.trim()) newErrors.title = '请填写信件标题';
    if (!content.trim()) newErrors.content = '信件内容不能为空';
    else if (content.trim().length < 20) newErrors.content = '信件内容至少20个字';
    if (selectedEmotions.length === 0) newErrors.emotions = '请至少选择一个情绪标签';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    try {
      setLoading(true);
      const res = await lettersApi.createLetter(user.id, user.username, {
        recipient: recipient.trim(),
        recipientType,
        title: title.trim(),
        content: content.trim(),
        emotions: selectedEmotions,
        isPublic,
        isAnonymous,
      });
      if (res.success && res.data) {
        showToast({ type: 'success', message: res.message || '信件已成功寄出！' });
        setTimeout(() => navigate(`/letter/${res.data.id}`), 800);
      } else {
        showToast({ type: 'error', message: res.message || '寄信失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '寄信失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Feather className="w-8 h-8 text-starlight animate-float" />
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            写下你的<span className="bg-gradient-to-r from-starlight via-aurora to-nebula-pink bg-clip-text text-transparent"> 心之所向</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            让文字穿越时空，抵达未来或平行世界的那个人
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? '返回编辑' : '预览效果'}
          </button>
        </div>

        {showPreview ? (
          <div className="paper-card shadow-paper-lg p-6 sm:p-10 animate-scale-in">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-nebula-purple via-cosmic-400 to-aurora" />
            <div className="pt-6">
              <div className="mb-4 text-center">
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-starlight/15 text-starlight mb-3">
                  {recipientTypes.find((t) => t.value === recipientType)?.icon} 致{recipientTypes.find((t) => t.value === recipientType)?.label}的{recipient || '(收件人)'}
                </span>
                <h2 className="font-serif-sc text-2xl sm:text-3xl font-bold text-cosmic-900">
                  {title || '(信件标题)'}
                </h2>
              </div>
              <div className="text-sm text-cosmic-700/70 mb-6 text-center pb-4 border-b border-dashed border-cosmic-900/20">
                {isAnonymous ? '匿名星人' : user?.username} · {new Date().toLocaleDateString('zh-CN')}
              </div>
              <div className="font-serif-sc text-base sm:text-lg leading-loose text-cosmic-800 whitespace-pre-line min-h-[200px]">
                {content || '(在这里写下你的心里话...)'}
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-cosmic-900/20 flex flex-wrap gap-2">
                {selectedEmotions.length > 0 ? (
                  selectedEmotions.map((e) => <EmotionTag key={e} name={e} />)
                ) : (
                  <span className="text-sm text-cosmic-700/50">(选择情绪标签)</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <div className="glass-card p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-5 h-5 text-aurora" />
                <h3 className="font-serif-sc text-lg font-semibold text-white">选择收件人类型</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {recipientTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setRecipientType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      recipientType === type.value
                        ? 'border-aurora/60 bg-aurora/10 shadow-glow'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-white text-sm mb-1">{type.label}</div>
                    <div className="text-xs text-white/50 leading-relaxed">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="paper-card shadow-paper p-5 sm:p-8">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-nebula-purple via-cosmic-400 to-aurora" />
              <div className="pt-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-cosmic-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">📮</span>
                    收件人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="如：未来的自己、平行世界的Ta、童年的玩伴..."
                    maxLength={30}
                    className={`w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all ${
                      errors.recipient ? 'border-red-400' : 'border-cosmic-200'
                    }`}
                  />
                  {errors.recipient && <p className="mt-1.5 text-xs text-red-500">{errors.recipient}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">✒️</span>
                    信件标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="给这封信起个名字吧..."
                    maxLength={50}
                    className={`w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all font-serif-sc text-lg ${
                      errors.title ? 'border-red-400' : 'border-cosmic-200'
                    }`}
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-800 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      信件内容 <span className="text-red-500">*</span>
                    </span>
                    <span className={`text-xs ${content.length >= 500 ? 'text-nebula-orange' : 'text-cosmic-700/50'}`}>
                      {content.length} / 5000
                    </span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                    placeholder={`亲爱的${recipient || '(收件人)'}：\n\n在这里写下你的心里话...\n\n也许未来的某一天，有人会收到这封信。`}
                    rows={10}
                    className={`w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all font-serif-sc leading-loose resize-none ${
                      errors.content ? 'border-red-400' : 'border-cosmic-200'
                    }`}
                  />
                  {errors.content && <p className="mt-1.5 text-xs text-red-500">{errors.content}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    情绪标签 <span className="text-red-500">*</span>
                    <span className="text-xs text-cosmic-700/50 font-normal">
                      (最多选择5个，{selectedEmotions.length}/5)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map((emo) => (
                      <EmotionTag
                        key={emo.id}
                        name={emo.name}
                        icon={emo.icon}
                        color={emo.color}
                        selected={selectedEmotions.includes(emo.name)}
                        onClick={() => toggleEmotion(emo.name)}
                      />
                    ))}
                  </div>
                  {errors.emotions && <p className="mt-2 text-xs text-red-500">{errors.emotions}</p>}
                </div>

                <div className="pt-4 border-t border-cosmic-200 flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-5 h-5 rounded border-cosmic-300 text-cosmic-500 focus:ring-cosmic-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-cosmic-800">公开到信件广场</div>
                      <div className="text-xs text-cosmic-700/60">其他星人可以看到并回复这封信</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 rounded border-cosmic-300 text-cosmic-500 focus:ring-cosmic-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-cosmic-800">匿名发送</div>
                      <div className="text-xs text-cosmic-700/60">不显示你的昵称，做个神秘的星人</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary px-8 py-3.5"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex items-center justify-center gap-2 px-10 py-3.5 text-base"
              >
                <Send className="w-5 h-5" />
                <Sparkles className="w-4 h-4" />
                寄出信件
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
