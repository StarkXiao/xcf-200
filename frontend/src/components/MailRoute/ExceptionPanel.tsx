import { useState } from 'react';
import { AlertTriangle, Sparkles, Zap, Map, RefreshCw, MailOpen, X, CheckCircle } from 'lucide-react';
import type { DeliveryException, CompensationType, ExceptionType } from '@/types';
import { EXCEPTION_INFO, COMPENSATION_OPTIONS } from '@/utils/helpers';
import { lettersApi } from '@/api/letters';
import useUIStore from '@/store/useUIStore';

interface ExceptionPanelProps {
  exceptions: DeliveryException[];
  letterId: string;
  userId: string;
  onResolved?: (tracking?: any, newLetterId?: string) => void;
}

export default function ExceptionPanel({
  exceptions,
  letterId,
  userId,
  onResolved,
}: ExceptionPanelProps) {
  const { showToast, setLoading } = useUIStore();
  const [processingType, setProcessingType] = useState<CompensationType | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const activeExceptions = exceptions.filter((e) => !e.resolved && !resolvedIds.has(e.id));

  if (activeExceptions.length === 0) {
    const resolvedExceptions = exceptions.filter((e) => e.resolved || resolvedIds.has(e.id));
    if (resolvedExceptions.length === 0) return null;

    return (
      <div className="glass-card p-5 sm:p-6 border border-nebula-mint/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-nebula-mint/15 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-nebula-mint" />
          </div>
          <div>
            <h4 className="font-serif-sc font-semibold text-white">异常已处理</h4>
            <p className="text-sm text-white/50">所有传送异常均已解决</p>
          </div>
        </div>
        <div className="space-y-3">
          {resolvedExceptions.map((e) => (
            <div key={e.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">{EXCEPTION_INFO[e.type as ExceptionType]?.icon}</span>
                <span className="font-medium text-white/80">
                  {EXCEPTION_INFO[e.type as ExceptionType]?.label || '未知异常'}
                </span>
                <CheckCircle className="w-4 h-4 text-nebula-mint ml-auto" />
              </div>
              {e.resolution && (
                <p className="mt-2 text-xs text-nebula-mint/80 pl-7">✅ {e.resolution}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleCompensate = async (exceptionId: string, compensationType: CompensationType) => {
    try {
      setProcessingType(compensationType);
      setLoading(true);
      const res = await lettersApi.compensateException(letterId, compensationType, userId);
      if (res.success) {
        setResolvedIds((prev) => new Set(prev).add(exceptionId));
        showToast({ type: 'success', message: res.message || '异常处理成功！' });
        onResolved?.(res.data?.tracking, res.data?.letterId);
      } else {
        showToast({ type: 'error', message: res.message || '处理失败' });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.response?.data?.message || '处理异常时出错，请重试',
      });
    } finally {
      setProcessingType(null);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {activeExceptions.map((exception) => {
        const info = EXCEPTION_INFO[exception.type as ExceptionType] || EXCEPTION_INFO.unknown;
        return (
          <div
            key={exception.id}
            className="glass-card p-5 sm:p-6 border-2 border-nebula-orange/30 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nebula-orange via-nebula-pink to-nebula-orange animate-pulse" />

            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-nebula-orange/15 flex items-center justify-center shrink-0 shadow-glow-sm">
                <span className="text-2xl">{info.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-serif-sc font-bold text-lg text-white">{info.label}</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-nebula-orange/20 text-nebula-orange font-medium">
                    需要处理
                  </span>
                </div>
                <p className="text-sm text-white/60 mt-1.5">{exception.message}</p>
                <p className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  检测时间：{new Date(exception.detectedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5">
              <h5 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-starlight" />
                选择补偿方式
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exception.availableCompensations.map((type) => {
                  const option = COMPENSATION_OPTIONS[type];
                  if (!option) return null;
                  const Icon =
                    type === 'accelerate'
                      ? Zap
                      : type === 'reroute'
                      ? Map
                      : type === 'resend'
                      ? RefreshCw
                      : MailOpen;

                  const isProcessing = processingType === type;

                  return (
                    <button
                      key={type}
                      onClick={() => handleCompensate(exception.id, type)}
                      disabled={isProcessing || processingType !== null}
                      className={`group p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        isProcessing
                          ? 'border-aurora bg-aurora/20'
                          : 'border-white/10 bg-white/5 hover:border-aurora/50 hover:bg-aurora/10 hover:shadow-glow-sm'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isProcessing
                              ? 'bg-aurora/30 text-aurora'
                              : 'bg-white/10 text-white/70 group-hover:bg-aurora/20 group-hover:text-aurora'
                          }`}
                        >
                          {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-aurora/30 border-t-aurora rounded-full animate-spin" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{option.icon}</span>
                            <h6 className="font-semibold text-white text-sm">{option.label}</h6>
                          </div>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
