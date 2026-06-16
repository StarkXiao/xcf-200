import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Shield, RefreshCw, AlertTriangle, Heart } from 'lucide-react';
import { strangerReplyApi } from '@/api/strangerReply';
import { guardianStationApi } from '@/api/guardianStation';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { ReplyTask, AnonymousIdentity, ContentAnalysisResult } from '@/types';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ReplyTask;
  onSuccess: () => void;
}

const emotionOptions = ['温暖', '治愈', '鼓励', '思念', '希望', '勇气', '陪伴', '理解'];

export default function ReplyModal({ isOpen, onClose, task, onSuccess }: ReplyModalProps) {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('温暖');
  const [anonymousName, setAnonymousName] = useState('');
  const [identityOptions, setIdentityOptions] = useState<string[]>([]);
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState<ContentAnalysisResult | null>(null);
  const [riskAnalyzing, setRiskAnalyzing] = useState(false);
  const riskAnalysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchIdentities();
      generateNewIdentity();
      setContent('');
      setSelectedEmotion('温暖');
      setUseCustomName(false);
      setCustomName('');
      setRiskAnalysis(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (content.trim().length < 20) {
      setRiskAnalysis(null);
      return;
    }

    if (riskAnalysisTimer.current) {
      clearTimeout(riskAnalysisTimer.current);
    }

    riskAnalysisTimer.current = setTimeout(async () => {
      try {
        setRiskAnalyzing(true);
        const res = await guardianStationApi.analyzeContent({
          content,
          contentType: 'reply',
        });
        if (res.success) {
          setRiskAnalysis(res.data);
        }
      } catch (err) {
        // ignore
      } finally {
        setRiskAnalyzing(false);
      }
    }, 800);

    return () => {
      if (riskAnalysisTimer.current) {
        clearTimeout(riskAnalysisTimer.current);
      }
    };
  }, [content]);

  const fetchIdentities = async () => {
    try {
      const res = await strangerReplyApi.getAnonymousIdentities();
      if (res.success) {
        setIdentityOptions(res.data);
      }
    } catch (err) {
      // ignore
    }
  };

  const generateNewIdentity = async () => {
    try {
      const res = await strangerReplyApi.generateIdentity();
      if (res.success) {
        setIdentity(res.data);
        setAnonymousName(res.data.anonymousName);
        setUseCustomName(false);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleSelectIdentity = (name: string) => {
    setAnonymousName(name);
    setUseCustomName(false);
    setIdentity(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast({ type: 'warning', message: '请填写回信内容' });
      return;
    }
    if (content.length < 20) {
      showToast({ type: 'warning', message: '回信内容至少20个字哦' });
      return;
    }

    const finalName = useCustomName ? customName.trim() : anonymousName;
    if (!finalName) {
      showToast({ type: 'warning', message: '请选择或输入匿名身份' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await strangerReplyApi.submitReply({
        letterId: task.letterId,
        content: content.trim(),
        emotion: selectedEmotion,
        anonymousName: finalName,
        replierId: user?.id,
      });
      if (res.success) {
        showToast({ type: 'success', message: '回信已成功寄出 ✨' });
        onSuccess();
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err?.response?.data?.message || '寄出失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className="paper-card rounded-2xl overflow-hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-cosmic-900/10 bg-paper/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aurora to-nebula-pink flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-serif-sc text-lg font-semibold text-cosmic-900">写一封回信</h3>
                <p className="text-xs text-cosmic-700/60">回复：{task.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cosmic-900/5 transition-colors"
            >
              <X className="w-5 h-5 text-cosmic-700/50" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="mb-5 p-4 rounded-xl bg-starlight/5 border border-starlight/10">
              <p className="text-xs text-cosmic-700/60 mb-2">原信摘要</p>
              <p className="text-sm text-cosmic-800/80 leading-relaxed line-clamp-3">
                {task.content}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-nebula-purple" />
                <label className="text-sm font-medium text-cosmic-900">选择匿名身份</label>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {identityOptions.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectIdentity(name)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      !useCustomName && anonymousName === name
                        ? 'bg-nebula-purple/20 text-nebula-purple border border-nebula-purple/30'
                        : 'bg-cosmic-900/5 text-cosmic-700/70 border border-cosmic-900/10 hover:bg-cosmic-900/10'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generateNewIdentity}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-aurora bg-aurora/10 hover:bg-aurora/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  换一个
                </button>
                <button
                  onClick={() => setUseCustomName(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    useCustomName
                      ? 'bg-starlight/20 text-starlight border border-starlight/30'
                      : 'bg-cosmic-900/5 text-cosmic-700/70 hover:bg-cosmic-900/10'
                  }`}
                >
                  ✏️ 自定义
                </button>
              </div>

              {useCustomName && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="给自己起一个温暖的名字..."
                    maxLength={20}
                    className="w-full px-4 py-2.5 rounded-xl border border-cosmic-900/10 bg-white/50 text-sm text-cosmic-900 placeholder:text-cosmic-700/40 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all"
                  />
                </div>
              )}

              <p className="mt-2 text-xs text-cosmic-700/50">
                💡 你的真实身份将被完全隐藏，对方只能看到你选择的匿名身份
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-starlight" />
                <label className="text-sm font-medium text-cosmic-900">选择回信情感</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map((emo) => (
                  <EmotionTag
                    key={emo}
                    name={emo}
                    size="sm"
                    selected={selectedEmotion === emo}
                    onClick={() => setSelectedEmotion(emo)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-cosmic-900 mb-3">
                回信内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你想说的话，给陌生人一份温暖..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-cosmic-900/10 bg-white/50 text-sm text-cosmic-900 placeholder:text-cosmic-700/40 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/20 transition-all resize-none font-serif-sc leading-relaxed"
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-cosmic-700/50">
                  温馨提示：真诚的文字最能打动人心 💝
                </p>
                <p className={`text-xs ${content.length < 20 ? 'text-nebula-pink' : 'text-cosmic-700/50'}`}>
                  {content.length} 字 / 至少 20 字
                </p>
              </div>

              {riskAnalyzing && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 animate-pulse">
                  <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-blue-700">正在分析内容安全...</p>
                </div>
              )}

              {!riskAnalyzing && riskAnalysis && riskAnalysis.level !== 'safe' && (
                <div
                  className={`mt-3 p-4 rounded-xl border flex flex-col gap-3 ${
                    riskAnalysis.level === 'severe'
                      ? 'bg-red-50 border-red-300'
                      : riskAnalysis.level === 'moderate'
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        riskAnalysis.level === 'severe'
                          ? 'bg-red-100'
                          : riskAnalysis.level === 'moderate'
                          ? 'bg-orange-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {riskAnalysis.level === 'severe' || riskAnalysis.level === 'moderate' ? (
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            riskAnalysis.level === 'severe'
                              ? 'text-red-500'
                              : 'text-orange-500'
                          }`}
                        />
                      ) : (
                        <Heart className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`font-semibold ${
                            riskAnalysis.level === 'severe'
                              ? 'text-red-800'
                              : riskAnalysis.level === 'moderate'
                              ? 'text-orange-800'
                              : 'text-yellow-800'
                          }`}
                        >
                          {riskAnalysis.levelInfo.label}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            riskAnalysis.level === 'severe'
                              ? 'bg-red-200 text-red-800'
                              : riskAnalysis.level === 'moderate'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {riskAnalysis.score} 分
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          riskAnalysis.level === 'severe'
                            ? 'text-red-700'
                            : riskAnalysis.level === 'moderate'
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {riskAnalysis.level === 'severe' &&
                          '回信中检测到可能涉及严重风险的内容。请用温暖的方式表达关心，避免使用可能加剧情绪的言辞。'}
                        {riskAnalysis.level === 'moderate' &&
                          '回信中包含一些需要注意的表述。请以关怀和支持的态度回应，让对方感受到温暖。'}
                        {riskAnalysis.level === 'mild' &&
                          '回信中略有一些需要注意的表达倾向。请保持积极温暖的语气，传递善意。'}
                      </p>
                    </div>
                  </div>
                  {riskAnalysis.details.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {riskAnalysis.details.map((detail, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded-lg text-xs ${
                            riskAnalysis.level === 'severe'
                              ? 'bg-red-100 text-red-700'
                              : riskAnalysis.level === 'moderate'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          注意：{detail.keywords.join('、')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!riskAnalyzing && riskAnalysis && riskAnalysis.level === 'safe' && (
                <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700">
                    ✨ 内容安全检测通过，你的回信会温暖Ta的心
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 p-5 border-t border-cosmic-900/10 bg-paper/95 backdrop-blur">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-cosmic-700/70 bg-cosmic-900/5 hover:bg-cosmic-900/10 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || content.length < 20}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-aurora to-nebula-pink hover:shadow-lg hover:shadow-aurora/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  寄出中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  寄出回信
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
