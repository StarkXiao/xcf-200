import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, ChevronRight, Lightbulb, Feather, X } from 'lucide-react';
import { healingApi } from '@/api/healing';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { WritingTemplate as WritingTemplateType } from '@/types';

interface WritingTemplateProps {
  emotion?: string | null;
}

export default function WritingTemplate({ emotion }: WritingTemplateProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const [templates, setTemplates] = useState<WritingTemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplateType | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [writingText, setWritingText] = useState('');
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [emotion]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await healingApi.getTemplates(emotion || undefined);
      if (res.success && res.data) setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (tpl: WritingTemplateType) => {
    setSelectedTemplate(tpl);
    setCurrentPromptIndex(0);
    setWritingText('');
    setShowTips(false);
  };

  const handleCloseTemplate = () => {
    setSelectedTemplate(null);
    setWritingText('');
    setShowTips(false);
  };

  const handleNextPrompt = () => {
    if (!selectedTemplate) return;
    if (currentPromptIndex < selectedTemplate.prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    }
  };

  const handleStartWriting = () => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: '请先登录后再写信 ✨' });
      navigate('/login');
      return;
    }

    if (!selectedTemplate) return;

    const fullContent = `${selectedTemplate.opening}\n\n${writingText}\n\n${selectedTemplate.closing}`;
    navigate('/write', {
      state: {
        emotion: selectedTemplate.emotion,
        templateContent: fullContent,
        templateTitle: selectedTemplate.title,
      },
    });
  };

  const handleRecordEmotion = async () => {
    if (!isAuthenticated || !user || !emotion) {
      showToast({ type: 'info', message: '请先登录后记录情绪 ✨' });
      return;
    }
    try {
      await healingApi.createEmotionRecord({
        userId: user.id,
        emotion,
        intensity: 5,
        note: '',
      });
      showToast({ type: 'success', message: '已记录你此刻的情绪 💫' });
    } catch {
      showToast({ type: 'error', message: '记录失败，请重试' });
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 sm:p-8">
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (selectedTemplate) {
    const tpl = selectedTemplate;
    const currentPrompt = tpl.prompts[currentPromptIndex];

    return (
      <div className="glass-card p-6 sm:p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tpl.icon}</span>
            <div>
              <h3 className="font-serif-sc text-lg font-semibold text-white">{tpl.title}</h3>
              <p className="text-xs text-white/40">{tpl.description}</p>
            </div>
          </div>
          <button
            onClick={handleCloseTemplate}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="relative rounded-xl p-5 mb-5"
          style={{
            background: `linear-gradient(135deg, ${tpl.color}15 0%, ${tpl.color}05 100%)`,
            border: `1px solid ${tpl.color}25`,
          }}
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" style={{ color: tpl.color }} />
            <div>
              <p className="text-sm text-white/80 mb-1">引导提示</p>
              <p className="text-white font-serif-sc text-base leading-relaxed">{currentPrompt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {tpl.prompts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPromptIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentPromptIndex ? 'w-6' : 'bg-white/20 hover:bg-white/40'
                }`}
                style={idx === currentPromptIndex ? { backgroundColor: tpl.color } : undefined}
              />
            ))}
            {currentPromptIndex < tpl.prompts.length - 1 && (
              <button
                onClick={handleNextPrompt}
                className="ml-auto text-xs flex items-center gap-1 hover:gap-2 transition-all"
                style={{ color: tpl.color }}
              >
                下一个提示 <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/60">写下你的心里话</label>
            <span className="text-xs text-white/30">{writingText.length} / 5000</span>
          </div>
          <textarea
            value={writingText}
            onChange={(e) => setWritingText(e.target.value.slice(0, 5000))}
            placeholder={`${tpl.opening}\n\n在这里自由书写...`}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/20 focus:outline-none focus:border-aurora/50 focus:ring-2 focus:ring-aurora/10 transition-all font-serif-sc leading-loose resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showTips ? '收起小贴士' : '查看小贴士'}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRecordEmotion}
              className="btn-secondary px-4 py-2 text-xs"
            >
              💫 记录情绪
            </button>
            <button
              onClick={handleStartWriting}
              className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <Feather className="w-4 h-4" />
              完成并写信
            </button>
          </div>
        </div>

        {showTips && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
            <p className="text-xs text-white/50 mb-2 font-medium">✍️ 书写小贴士</p>
            <ul className="space-y-1.5">
              {tpl.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-white/40 flex items-start gap-2">
                  <span className="text-white/20 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <PenLine className="w-6 h-6 text-starlight" />
        <h3 className="font-serif-sc text-xl sm:text-2xl font-semibold text-white">书写引导</h3>
        {emotion && (
          <span className="text-sm text-white/50 ml-2">— {emotion}主题</span>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-white/50 text-sm">暂无对应模板，选择其他情绪试试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-stagger">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className="group text-left rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, ${tpl.color}12 0%, ${tpl.color}05 100%)`,
                border: `1px solid ${tpl.color}20`,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif-sc text-base font-semibold text-white group-hover:text-aurora transition-colors mb-1">
                    {tpl.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${tpl.color}20`,
                        color: tpl.color,
                      }}
                    >
                      {tpl.emotion}
                    </span>
                    <span className="text-[10px] text-white/20">{tpl.prompts.length} 个引导</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
