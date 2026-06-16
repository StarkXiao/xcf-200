import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Sparkles, Feather, BookOpen, GitBranch } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import { healingApi } from '@/api/healing';
import { emotionsApi } from '@/api/emotions';
import EmotionAnalysis from '@/components/Healing/EmotionAnalysis';
import RecommendedLetters from '@/components/Healing/RecommendedLetters';
import WritingTemplate from '@/components/Healing/WritingTemplate';
import EmotionTimeline from '@/components/Healing/EmotionTimeline';
import EmotionTag from '@/components/Emotion/EmotionTag';
import type { Emotion } from '@/types';

type TabKey = 'analysis' | 'letters' | 'writing' | 'timeline';

const TABS: { key: TabKey; label: string; icon: typeof HeartPulse }[] = [
  { key: 'analysis', label: '情绪星图', icon: HeartPulse },
  { key: 'letters', label: '疗愈信笺', icon: BookOpen },
  { key: 'writing', label: '书写引导', icon: Feather },
  { key: 'timeline', label: '情绪轨迹', icon: GitBranch },
];

export default function HealingRoom() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabKey>('analysis');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [recordingEmotion, setRecordingEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchEmotions();
  }, []);

  const fetchEmotions = async () => {
    try {
      const res = await emotionsApi.getAll();
      if (res.success) setEmotions(res.data);
    } catch {}
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    setActiveTab('letters');
  };

  const handleRecordEmotion = async () => {
    if (!isAuthenticated || !user) {
      showToast({ type: 'info', message: '请先登录后记录情绪 ✨' });
      navigate('/login');
      return;
    }
    if (!recordingEmotion) return;

    try {
      await healingApi.createEmotionRecord({
        userId: user.id,
        emotion: recordingEmotion,
        intensity,
        note,
      });
      showToast({ type: 'success', message: '已记录你此刻的情绪 💫' });
      setRecordingEmotion(null);
      setIntensity(5);
      setNote('');
      setShowEmotionPicker(false);
    } catch {
      showToast({ type: 'error', message: '记录失败，请重试' });
    }
  };

  const userId = user?.id || 'guest';

  return (
    <div className="relative z-10 py-8 sm:py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-10 sm:mb-14 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <HeartPulse className="w-7 h-7 text-nebula-pink animate-float" />
          </div>
          <h1 className="font-serif-sc text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-nebula-pink via-aurora to-nebula-mint bg-clip-text text-transparent">
              情绪疗愈室
            </span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-base sm:text-lg">
            在这里倾听内心的声音，找到属于你的治愈星光
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-glow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowEmotionPicker(!showEmotionPicker)}
            className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-starlight" />
            记录此刻情绪
          </button>
        </div>

        {showEmotionPicker && (
          <div className="glass-card p-5 sm:p-6 mb-8 animate-scale-in">
            <h4 className="text-sm font-medium text-white/70 mb-4">你现在的情绪是什么？</h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {emotions.map((emo) => (
                <EmotionTag
                  key={emo.id}
                  name={emo.name}
                  icon={emo.icon}
                  color={emo.color}
                  selected={recordingEmotion === emo.name}
                  onClick={() => setRecordingEmotion(emo.name)}
                />
              ))}
            </div>

            {recordingEmotion && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white/60">情绪强度</label>
                    <span className="text-sm font-medium text-white">{intensity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-aurora [&::-webkit-slider-thumb]:shadow-glow-sm [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-white/20 mt-1">
                    <span>轻微</span>
                    <span>强烈</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">备注（可选）</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="简单描述一下你此刻的感受..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-aurora/50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setRecordingEmotion(null);
                      setShowEmotionPicker(false);
                    }}
                    className="px-4 py-2 rounded-full text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRecordEmotion}
                    className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    保存记录
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedEmotion && (
          <div className="mb-6 flex items-center gap-2 animate-fade-in">
            <span className="text-sm text-white/50">当前筛选：</span>
            <EmotionTag
              name={selectedEmotion}
              selected
              onClick={() => setSelectedEmotion(null)}
            />
            <button
              onClick={() => setSelectedEmotion(null)}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              清除
            </button>
          </div>
        )}

        <div className="space-y-8">
          {activeTab === 'analysis' && (
            <EmotionAnalysis userId={userId} onEmotionSelect={handleEmotionSelect} />
          )}
          {activeTab === 'letters' && (
            <RecommendedLetters emotion={selectedEmotion} />
          )}
          {activeTab === 'writing' && (
            <WritingTemplate emotion={selectedEmotion} />
          )}
          {activeTab === 'timeline' && (
            <EmotionTimeline userId={userId} onEmotionSelect={handleEmotionSelect} />
          )}
        </div>

        <div className="mt-16 text-center">
          <div className="glass-card p-8 sm:p-10">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="font-serif-sc text-xl font-semibold text-white mb-3">
              每一种情绪都值得被温柔对待
            </h3>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              在情绪疗愈室，你可以记录情绪、阅读疗愈信笺、使用书写引导表达内心，
              也可以回顾自己的情绪变化轨迹。记住，你并不孤单。
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    showToast({ type: 'info', message: '请先登录 ✨' });
                    navigate('/login');
                    return;
                  }
                  setShowEmotionPicker(true);
                }}
                className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                记录此刻情绪
              </button>
              <button
                onClick={() => setActiveTab('writing')}
                className="btn-secondary px-6 py-3 text-sm flex items-center gap-2"
              >
                <Feather className="w-4 h-4" />
                开始书写
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
