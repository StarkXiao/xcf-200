import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Send, Eye, EyeOff, Sparkles, Feather, Target, Zap,
  Clock, Gauge, Calendar as CalendarIcon, AlertTriangle, Heart, Shield,
  Save, History, X, Check, FileText, AlertCircle, RotateCcw, CheckCircle
} from 'lucide-react';
import EmotionTag from '@/components/Emotion/EmotionTag';
import { lettersApi } from '@/api/letters';
import { draftsApi } from '@/api/drafts';
import { guardianStationApi } from '@/api/guardianStation';
import { emotionsApi } from '@/api/emotions';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import DraftVersionHistory from '@/components/Drafts/DraftVersionHistory';
import type { Emotion, ContentAnalysisResult, Draft, DraftContentSnapshot, DraftValidationResult } from '@/types';
import { getSpeedInfo, cn } from '@/utils/helpers';

const recipientTypes = [
  { value: 'future', label: '未来的人', icon: '🔮', desc: '给未来的自己或某人' },
  { value: 'past', label: '过去的人', icon: '🕰️', desc: '给曾经的Ta或过去的自己' },
  { value: 'parallel', label: '平行世界', icon: '🌌', desc: '给另一个宇宙的人' },
  { value: 'unknown', label: '未知宇宙', icon: '✨', desc: '随机漂流到未知目的地' },
];

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function WriteLetter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const templateState = location.state as {
    emotion?: string;
    templateContent?: string;
    templateTitle?: string;
    prefillRecipient?: string;
  } | null;

  const draftIdFromUrl = searchParams.get('draftId');

  const [recipient, setRecipient] = useState(templateState?.prefillRecipient || '');
  const [recipientType, setRecipientType] = useState('future');
  const [title, setTitle] = useState(templateState?.templateTitle || '');
  const [content, setContent] = useState(templateState?.templateContent || '');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(
    templateState?.emotion ? [templateState.emotion] : []
  );
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express' | 'instant'>('standard');
  const [scheduledDelivery, setScheduledDelivery] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitValidationOpen, setSubmitValidationOpen] = useState(false);
  const [submitValidation, setSubmitValidation] = useState<DraftValidationResult & { riskAnalysis?: any } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<ContentAnalysisResult | null>(null);
  const [riskAnalyzing, setRiskAnalyzing] = useState(false);
  const riskAnalysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [unsentDraftHint, setUnsentDraftHint] = useState<Draft | null>(null);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forcedSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef({ recipient, recipientType, title, content, selectedEmotions, isPublic, isAnonymous, deliverySpeed, scheduledDelivery, scheduledDate, scheduledTime });

  const deliverySpeedOptions = [
    { value: 'standard' as const, ...getSpeedInfo('standard'), recommend: true },
    { value: 'express' as const, ...getSpeedInfo('express'), recommend: false },
    { value: 'instant' as const, ...getSpeedInfo('instant'), recommend: false },
  ];

  useEffect(() => {
    contentRef.current = {
      recipient, recipientType, title, content,
      selectedEmotions, isPublic, isAnonymous, deliverySpeed,
      scheduledDelivery, scheduledDate, scheduledTime
    };
  }, [recipient, recipientType, title, content, selectedEmotions, isPublic, isAnonymous, deliverySpeed, scheduledDelivery, scheduledDate, scheduledTime]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchEmotions();
    if (draftIdFromUrl) {
      loadDraft(draftIdFromUrl);
    } else {
      checkForRecentDrafts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    forcedSaveTimer.current = setInterval(() => {
      if (hasMeaningfulContent() && draftId) {
        triggerAutoSave(true);
      }
    }, 60000);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMeaningfulContent()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (forcedSaveTimer.current) clearInterval(forcedSaveTimer.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (riskAnalysisTimer.current) clearTimeout(riskAnalysisTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMeaningfulContent()) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      triggerAutoSave(false);
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, recipient, recipientType, selectedEmotions, scheduledDelivery, scheduledDate, scheduledTime, deliverySpeed, isPublic, isAnonymous]);

  useEffect(() => {
    const combinedContent = title + '\n' + content;
    if (combinedContent.trim().length < 20) {
      setRiskAnalysis(null);
      return;
    }

    if (riskAnalysisTimer.current) clearTimeout(riskAnalysisTimer.current);

    riskAnalysisTimer.current = setTimeout(async () => {
      try {
        setRiskAnalyzing(true);
        const res = await guardianStationApi.analyzeContent({
          content: combinedContent,
          contentType: 'letter',
        });
        if (res.success) setRiskAnalysis(res.data);
      } catch (err) {
        // ignore
      } finally {
        setRiskAnalyzing(false);
      }
    }, 800);

    return () => {
      if (riskAnalysisTimer.current) clearTimeout(riskAnalysisTimer.current);
    };
  }, [title, content]);

  const hasMeaningfulContent = useCallback(() => {
    const c = contentRef.current;
    return c.title.trim().length > 0 || c.content.trim().length > 10 || c.recipient.trim().length > 0;
  }, []);

  const checkForRecentDrafts = async () => {
    if (!user) return;
    try {
      const res = await draftsApi.getDrafts(user.id, { limit: 3, sort: 'updated' });
      if (res.success && res.data && res.data.length > 0) {
        const latest = res.data[0];
        const hoursSince = (Date.now() - new Date(latest.updatedAt).getTime()) / 3600000;
        if (hoursSince < 24 && latest.wordCount > 50) {
          setUnsentDraftHint(latest);
        }
      }
    } catch { /* ignore */ }
  };

  const loadDraft = async (id: string) => {
    try {
      setLoadingDraft(true);
      const res = await draftsApi.getDraft(id);
      if (res.success && res.data) {
        const d = res.data;
        setDraftId(d.id);
        setRecipient(d.recipient);
        setRecipientType(d.recipientType);
        setTitle(d.title);
        setContent(d.content);
        setSelectedEmotions(d.emotions || []);
        setIsPublic(d.isPublic);
        setIsAnonymous(d.isAnonymous);
        setDeliverySpeed(d.deliverySpeed as any);
        setScheduledDelivery(d.scheduledDelivery);
        setScheduledDate(d.scheduledDate);
        setScheduledTime(d.scheduledTime);
        setLastSavedAt(d.autoSavedAt || d.updatedAt);
        showToast({ type: 'info', message: `已加载草稿「${d.title || '未命名'}」` });
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载草稿失败' });
    } finally {
      setLoadingDraft(false);
    }
  };

  const triggerAutoSave = useCallback(async (isForced: boolean) => {
    if (!user) return;
    if (!hasMeaningfulContent()) return;

    setAutoSaveStatus('saving');
    const c = contentRef.current;

    try {
      if (!draftId) {
        const res = await draftsApi.createDraft({
          senderId: user.id,
          recipient: c.recipient,
          recipientType: c.recipientType,
          title: c.title,
          content: c.content,
          emotions: c.selectedEmotions,
          isPublic: c.isPublic,
          isAnonymous: c.isAnonymous,
          deliverySpeed: c.deliverySpeed,
          scheduledDelivery: c.scheduledDelivery,
          scheduledDate: c.scheduledDate,
          scheduledTime: c.scheduledTime,
        });
        if (res.success && res.data) {
          setDraftId(res.data.id);
        }
      } else {
        await draftsApi.updateDraft(draftId, {
          recipient: c.recipient,
          recipientType: c.recipientType,
          title: c.title,
          content: c.content,
          emotions: c.selectedEmotions,
          isPublic: c.isPublic,
          isAnonymous: c.isAnonymous,
          deliverySpeed: c.deliverySpeed,
          scheduledDelivery: c.scheduledDelivery,
          scheduledDate: c.scheduledDate,
          scheduledTime: c.scheduledTime,
          autoSave: true,
        });
      }
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date().toISOString());
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (err) {
      setAutoSaveStatus('error');
      if (!isForced) {
        showToast({ type: 'warning', message: '自动保存失败，将稍后重试' });
      }
    }
  }, [draftId, hasMeaningfulContent, showToast, user]);

  const handleManualSave = async () => {
    if (!user) return;
    if (!hasMeaningfulContent()) {
      showToast({ type: 'warning', message: '内容不足以保存为草稿' });
      return;
    }

    setAutoSaveStatus('saving');
    try {
      const c = contentRef.current;
      if (!draftId) {
        const res = await draftsApi.createDraft({
          senderId: user.id,
          recipient: c.recipient, recipientType: c.recipientType, title: c.title, content: c.content,
          emotions: c.selectedEmotions, isPublic: c.isPublic, isAnonymous: c.isAnonymous,
          deliverySpeed: c.deliverySpeed, scheduledDelivery: c.scheduledDelivery,
          scheduledDate: c.scheduledDate, scheduledTime: c.scheduledTime,
        });
        if (res.success && res.data) setDraftId(res.data.id);
      } else {
        await draftsApi.updateDraft(draftId, {
          recipient: c.recipient, recipientType: c.recipientType, title: c.title, content: c.content,
          emotions: c.selectedEmotions, isPublic: c.isPublic, isAnonymous: c.isAnonymous,
          deliverySpeed: c.deliverySpeed, scheduledDelivery: c.scheduledDelivery,
          scheduledDate: c.scheduledDate, scheduledTime: c.scheduledTime,
          note: '手动保存',
        });
      }
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date().toISOString());
      showToast({ type: 'success', message: '草稿已保存 ✨' });
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch (err: any) {
      setAutoSaveStatus('error');
      showToast({ type: 'error', message: err.response?.data?.message || '保存失败' });
    }
  };

  const handleRestoreSnapshot = (snapshot: DraftContentSnapshot) => {
    setRecipient(snapshot.recipient);
    setRecipientType(snapshot.recipientType);
    setTitle(snapshot.title);
    setContent(snapshot.content);
    setSelectedEmotions(snapshot.emotions);
    setIsPublic(snapshot.isPublic);
    setIsAnonymous(snapshot.isAnonymous);
    setDeliverySpeed(snapshot.deliverySpeed);
    setScheduledDelivery(snapshot.scheduledDelivery);
    setScheduledDate(snapshot.scheduledDate);
    setScheduledTime(snapshot.scheduledTime);
  };

  const handleVersionRestored = () => {
    setLastSavedAt(new Date().toISOString());
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 2500);
  };

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
        : prev.length < 5 ? [...prev, name] : prev
    );
  };

  const validateLocal = () => {
    const newErrors: Record<string, string> = {};
    if (!recipient.trim()) newErrors.recipient = '请填写收件人';
    if (!title.trim()) newErrors.title = '请填写信件标题';
    if (!content.trim()) newErrors.content = '信件内容不能为空';
    else if (content.trim().length < 20) newErrors.content = '信件内容至少20个字';
    if (selectedEmotions.length === 0) newErrors.emotions = '请至少选择一个情绪标签';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ensureDraftSaved = async (): Promise<string | null> => {
    if (!user || !hasMeaningfulContent()) return null;
    const c = contentRef.current;
    try {
      if (!draftId) {
        const res = await draftsApi.createDraft({
          senderId: user.id,
          recipient: c.recipient,
          recipientType: c.recipientType,
          title: c.title,
          content: c.content,
          emotions: c.selectedEmotions,
          isPublic: c.isPublic,
          isAnonymous: c.isAnonymous,
          deliverySpeed: c.deliverySpeed,
          scheduledDelivery: c.scheduledDelivery,
          scheduledDate: c.scheduledDate,
          scheduledTime: c.scheduledTime,
        });
        if (res.success && res.data) {
          setDraftId(res.data.id);
          return res.data.id;
        }
        return null;
      }
      await draftsApi.updateDraft(draftId, {
        recipient: c.recipient,
        recipientType: c.recipientType,
        title: c.title,
        content: c.content,
        emotions: c.selectedEmotions,
        isPublic: c.isPublic,
        isAnonymous: c.isAnonymous,
        deliverySpeed: c.deliverySpeed,
        scheduledDelivery: c.scheduledDelivery,
        scheduledDate: c.scheduledDate,
        scheduledTime: c.scheduledTime,
      });
      return draftId;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validateLocal() || !user) return;

    if (scheduledDelivery && scheduledDate && scheduledTime) {
      const scheduledTs = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      if (scheduledTs < Date.now()) {
        setErrors(prev => ({ ...prev, scheduled: '定时送达时间必须晚于当前时间' }));
        return;
      }
    }

    try {
      setLoading(true);
      const currentDraftId = await ensureDraftSaved();
      if (!currentDraftId) {
        showToast({ type: 'error', message: '保存草稿失败，无法发送' });
        return;
      }

      const res = await draftsApi.validateSubmit(currentDraftId);
      if (res.success && res.data) {
        setSubmitValidation(res.data);
        setSubmitValidationOpen(true);
      } else {
        showToast({ type: 'error', message: res.message || '校验请求失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '校验请求失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirm = async () => {
    if (!user || !draftId) return;
    try {
      setSubmitting(true);
      let scheduledDeliveryAt: string | undefined;
      if (scheduledDelivery && scheduledDate && scheduledTime) {
        scheduledDeliveryAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }
      const res = await draftsApi.submitDraft(draftId, { senderName: user.username, scheduledDeliveryAt });
      if (res.success && res.data) {
        showToast({ type: 'success', message: res.message || '信件已成功寄出！' });
        setSubmitValidationOpen(false);
        setTimeout(() => navigate(`/letter/${res.data.letter.id}`), 800);
      } else {
        showToast({ type: 'error', message: res.message || '寄信失败' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || '寄信失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSavedAt) return '尚未保存';
    const d = new Date(lastSavedAt);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return d.toLocaleDateString('zh-CN');
  };

  const autoSaveIcon = autoSaveStatus === 'saving' ? (
    <span className="w-3.5 h-3.5 border-2 border-aurora/30 border-t-aurora rounded-full animate-spin" />
  ) : autoSaveStatus === 'saved' ? (
    <Check className="w-3.5 h-3.5 text-nebula-mint" />
  ) : autoSaveStatus === 'error' ? (
    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
  ) : (
    <Save className="w-3.5 h-3.5" />
  );

  const autoSaveLabel = autoSaveStatus === 'saving' ? '保存中...'
    : autoSaveStatus === 'saved' ? '已保存'
    : autoSaveStatus === 'error' ? '保存失败'
    : '草稿';

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

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
              autoSaveStatus === 'saved' ? 'bg-nebula-mint/10 text-nebula-mint border-nebula-mint/30' :
              autoSaveStatus === 'saving' ? 'bg-aurora/10 text-aurora border-aurora/30' :
              autoSaveStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
              'bg-white/5 text-white/60 border-white/10'
            )}>
              {autoSaveIcon}
              <span>{autoSaveLabel}</span>
              <span className="opacity-60">· {formatLastSaved()}</span>
            </div>
            {draftId && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
              >
                <History className="w-3.5 h-3.5" />
                版本历史
              </button>
            )}
            <button
              onClick={handleManualSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-starlight/10 text-starlight border border-starlight/30 hover:bg-starlight/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              手动保存
            </button>
          </div>

          <div className="flex items-center gap-2">
            <LinkLike onClick={() => navigate('/drafts')} className="text-xs text-white/60 hover:text-aurora transition-colors inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              草稿箱
            </LinkLike>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? '返回编辑' : '预览效果'}
            </button>
          </div>
        </div>

        {loadingDraft && (
          <div className="glass-card p-8 mb-6 text-center animate-pulse">
            <div className="w-10 h-10 mx-auto mb-3 border-3 border-aurora/30 border-t-aurora rounded-full animate-spin" />
            <p className="text-white/60">正在加载草稿...</p>
          </div>
        )}

        {unsentDraftHint && (
          <div className="glass-card p-4 mb-6 border border-aurora/30 bg-aurora/5 animate-fade-in flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-aurora/15 flex items-center justify-center shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4 text-aurora" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white mb-0.5">发现未完成的草稿</p>
                <p className="text-xs text-white/60 truncate">
                  《{unsentDraftHint.title || '未命名'}》· {unsentDraftHint.wordCount}字 · 上次更新 {formatLastSaved.call({ lastSavedAt: unsentDraftHint.updatedAt }) || new Date(unsentDraftHint.updatedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setUnsentDraftHint(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  navigate(`/write?draftId=${unsentDraftHint.id}`, { replace: true });
                }}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                继续写作
              </button>
            </div>
          </div>
        )}

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
              <div className="mb-6 text-center pb-4 border-b border-dashed border-cosmic-900/20 text-sm text-cosmic-700/70">
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
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-300 text-left',
                      recipientType === type.value
                        ? 'border-aurora/60 bg-aurora/10 shadow-glow'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-white text-sm mb-1">{type.label}</div>
                    <div className="text-xs text-white/50 leading-relaxed">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-5">
                <Gauge className="w-5 h-5 text-starlight" />
                <h3 className="font-serif-sc text-lg font-semibold text-white">时空投递设置</h3>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-starlight" />
                  选择投递速度
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {deliverySpeedOptions.map((option) => {
                    const isSelected = deliverySpeed === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDeliverySpeed(option.value)}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all duration-300 relative',
                          isSelected
                            ? 'border-starlight/60 bg-starlight/10 shadow-glow-sm'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                        )}
                      >
                        {option.recommend && (
                          <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-starlight/20 text-starlight border border-starlight/40">
                            推荐
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{option.icon}</span>
                          <span className={cn('font-semibold text-sm', isSelected ? 'text-starlight' : 'text-white')}>
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mb-2 leading-relaxed">{option.description}</p>
                        <div className={cn('text-xs font-medium flex items-center gap-1', isSelected ? 'text-starlight' : 'text-white/60')}>
                          <Clock className="w-3 h-3" />
                          {option.timeText}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-5 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={scheduledDelivery}
                    onChange={(e) => setScheduledDelivery(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-cosmic-300 text-aurora focus:ring-aurora bg-white/20"
                  />
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-aurora" />
                      定时送达
                      <span className="text-xs text-white/40 font-normal">(可选)</span>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">
                      选择一个特定的时间让信件送达收件人手中
                    </p>
                  </div>
                </label>

                {scheduledDelivery && (
                  <div className="ml-8 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/60 mb-1.5">送达日期</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-aurora focus:ring-2 focus:ring-aurora/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/60 mb-1.5">送达时间</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-aurora focus:ring-2 focus:ring-aurora/20 transition-all"
                        />
                      </div>
                    </div>
                    {errors.scheduled && (
                      <p className="text-xs text-red-400">{errors.scheduled}</p>
                    )}
                    {scheduledDate && scheduledTime && !errors.scheduled && (
                      <div className="p-3 rounded-xl bg-aurora/10 border border-aurora/20">
                        <p className="text-xs text-aurora flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>
                            信件将于 <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('zh-CN')}</strong> 准时送达。
                            在此之前，信件会在时光邮局中静静等待。
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all',
                      errors.recipient ? 'border-red-400' : 'border-cosmic-200'
                    )}
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
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all font-serif-sc text-lg',
                      errors.title ? 'border-red-400' : 'border-cosmic-200'
                    )}
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-800 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      信件内容 <span className="text-red-500">*</span>
                    </span>
                    <span className={cn('text-xs', content.length >= 500 ? 'text-nebula-orange' : 'text-cosmic-700/50')}>
                      {content.length} / 5000
                    </span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                    placeholder={`亲爱的${recipient || '(收件人)'}：\n\n在这里写下你的心里话...\n\n也许未来的某一天，有人会收到这封信。`}
                    rows={10}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border bg-white/60 text-cosmic-900 placeholder-cosmic-700/40 focus:outline-none focus:border-cosmic-400 focus:ring-2 focus:ring-cosmic-400/20 transition-all font-serif-sc leading-loose resize-none',
                      errors.content ? 'border-red-400' : 'border-cosmic-200'
                    )}
                  />
                  {errors.content && <p className="mt-1.5 text-xs text-red-500">{errors.content}</p>}

                  {riskAnalyzing && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 animate-pulse">
                      <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-blue-700">正在分析内容安全...</p>
                    </div>
                  )}

                  {!riskAnalyzing && riskAnalysis && riskAnalysis.level !== 'safe' && (
                    <div className={cn(
                      'mt-3 p-4 rounded-xl border flex flex-col gap-3',
                      riskAnalysis.level === 'severe' ? 'bg-red-50 border-red-300'
                        : riskAnalysis.level === 'moderate' ? 'bg-orange-50 border-orange-300'
                        : 'bg-yellow-50 border-yellow-300'
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          riskAnalysis.level === 'severe' ? 'bg-red-100'
                            : riskAnalysis.level === 'moderate' ? 'bg-orange-100'
                            : 'bg-yellow-100'
                        )}>
                          {riskAnalysis.level === 'severe' || riskAnalysis.level === 'moderate' ? (
                            <AlertTriangle className={cn(
                              'w-5 h-5',
                              riskAnalysis.level === 'severe' ? 'text-red-500' : 'text-orange-500'
                            )} />
                          ) : (
                            <Heart className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              'font-semibold',
                              riskAnalysis.level === 'severe' ? 'text-red-800'
                                : riskAnalysis.level === 'moderate' ? 'text-orange-800'
                                : 'text-yellow-800'
                            )}>
                              {riskAnalysis.levelInfo.label}
                            </p>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              riskAnalysis.level === 'severe' ? 'bg-red-200 text-red-800'
                                : riskAnalysis.level === 'moderate' ? 'bg-orange-200 text-orange-800'
                                : 'bg-yellow-200 text-yellow-800'
                            )}>
                              {riskAnalysis.score} 分
                            </span>
                          </div>
                          <p className={cn(
                            'text-sm leading-relaxed',
                            riskAnalysis.level === 'severe' ? 'text-red-700'
                              : riskAnalysis.level === 'moderate' ? 'text-orange-700'
                              : 'text-yellow-700'
                          )}>
                            {riskAnalysis.level === 'severe' &&
                              '我们检测到内容中可能涉及严重的自伤或伤害风险。如果你或身边的人正处于困境，请一定记得，生命是最宝贵的。请拨打全国心理援助热线：400-161-9995（24小时）。'}
                            {riskAnalysis.level === 'moderate' &&
                              '我们感受到文字中承载的沉重情绪。请记得，困难只是暂时的，你并不孤单。如果需要倾诉，这里有很多人愿意倾听你。'}
                            {riskAnalysis.level === 'mild' &&
                              '我们注意到内容中可能有些负面情绪。希望你一切安好，如果需要帮助，随时可以寻求专业支持。'}
                          </p>
                        </div>
                      </div>
                      {riskAnalysis.details.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {riskAnalysis.details.map((detail, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                'px-2 py-1 rounded-lg text-xs',
                                riskAnalysis.level === 'severe' ? 'bg-red-100 text-red-700'
                                  : riskAnalysis.level === 'moderate' ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              )}
                            >
                              检测到：{detail.keywords.join('、')}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="pt-2 mt-2 border-t border-dashed border-current/20">
                        <p className={cn(
                          'text-xs flex items-center gap-1',
                          riskAnalysis.level === 'severe' ? 'text-red-600'
                            : riskAnalysis.level === 'moderate' ? 'text-orange-600'
                            : 'text-yellow-600'
                        )}>
                          <Shield className="w-3 h-3" />
                          匿名守护站将关注此内容，守护员会提供关怀支持
                        </p>
                      </div>
                    </div>
                  )}

                  {!riskAnalyzing && riskAnalysis && riskAnalysis.level === 'safe' && (
                    <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-700">
                        ✨ 内容安全检测通过，愿你的心意温暖传递
                      </p>
                    </div>
                  )}
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
                onClick={() => {
                  if (hasMeaningfulContent() && !confirm('离开会丢失未保存内容，确定吗？')) return;
                  navigate(-1);
                }}
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

      <DraftVersionHistory
        draftId={draftId || ''}
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(snapshot) => handleRestoreSnapshot(snapshot)}
        onRestored={handleVersionRestored}
      />

      {submitValidationOpen && submitValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-serif-sc text-xl font-semibold text-white flex items-center gap-2">
                {!submitValidation.valid ? (
                  <><AlertTriangle className="w-5 h-5 text-red-400" />发送校验失败</>
                ) : submitValidation.warnings?.length > 0 ? (
                  <><AlertTriangle className="w-5 h-5 text-nebula-orange" />发送前提醒</>
                ) : (
                  <><CheckCircle className="w-5 h-5 text-nebula-mint" />确认发送</>
                )}
              </h3>
              <button onClick={() => setSubmitValidationOpen(false)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="paper-card p-4 rounded-xl">
                <p className="text-xs text-cosmic-700/60 mb-1">信件标题</p>
                <p className="font-serif-sc text-lg font-semibold text-cosmic-900 truncate">
                  {title || '(无标题)'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cosmic-300/40 text-cosmic-800">
                    致{recipient || '(收件人)'}
                  </span>
                  <span className="text-xs text-cosmic-700/60">{content.length} 字</span>
                </div>
              </div>

              {submitValidation.scheduledCheck?.isPast && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      定时时间已过期。
                      {submitValidation.scheduledCheck.suggestedDate && (
                        <>建议时间：{submitValidation.scheduledCheck.suggestedDate} {submitValidation.scheduledCheck.suggestedTime}</>
                      )}
                    </span>
                  </p>
                </div>
              )}

              {!submitValidation.valid && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    以下问题需要解决：
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(submitValidation.errors).map(([key, msg]) => (
                      <div key={key} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                        <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-red-300">{msg as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitValidation.warnings?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-nebula-orange flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    温馨提示：
                  </p>
                  <div className="space-y-1.5">
                    {submitValidation.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-nebula-orange/8 border border-nebula-orange/20">
                        <AlertTriangle className="w-4 h-4 text-nebula-orange mt-0.5 shrink-0" />
                        <span className="text-sm text-nebula-orange/90">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submitValidation.valid && submitValidation.warnings?.length === 0 && (
                <div className="p-4 rounded-xl bg-nebula-mint/10 border border-nebula-mint/30">
                  <p className="text-sm text-nebula-mint flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>信件内容完整，可以立即发送。{scheduledDelivery && scheduledDate ? `将于 ${scheduledDate} ${scheduledTime} 定时送达。` : '将通过星尘航道立即送达。'}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
              <button onClick={() => setSubmitValidationOpen(false)} className="btn-secondary px-5 py-2.5 text-sm">
                取消
              </button>
              <button
                onClick={handleSubmitConfirm}
                disabled={!submitValidation.valid || submitting}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中...</>
                ) : (
                  <><Send className="w-4 h-4" />{submitValidation.warnings?.length > 0 ? '仍然发送' : '确认发送'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkLike({ onClick, className, children }: { onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
