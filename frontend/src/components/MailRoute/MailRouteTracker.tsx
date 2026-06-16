import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route,
  RefreshCw,
  FastForward,
  BarChart3,
  Package,
  Sparkles,
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import StageTimeline from './StageTimeline';
import ExceptionPanel from './ExceptionPanel';
import { lettersApi } from '@/api/letters';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { DeliveryTracking } from '@/types';
import { getStageInfo, getSpeedInfo, formatFullDate } from '@/utils/helpers';

interface MailRouteTrackerProps {
  letterId: string;
  compact?: boolean;
  showTitle?: boolean;
}

export default function MailRouteTracker({
  letterId,
  compact = false,
  showTitle = true,
}: MailRouteTrackerProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast, setLoading } = useUIStore();

  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoadingLocal] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const fetchTracking = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoadingLocal(true);
      const res = await lettersApi.getTracking(letterId);
      if (res.success && res.data) {
        setTracking(res.data);
      }
    } catch (err) {
      if (showLoadingState) {
        showToast({ type: 'error', message: '加载邮路信息失败' });
      }
    } finally {
      setLoadingLocal(false);
    }
  }, [letterId, showToast]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  useEffect(() => {
    if (!tracking || tracking.currentStage === 'delivered') return;

    const interval = setInterval(() => {
      fetchTracking(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [tracking, fetchTracking]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTracking(false);
    setRefreshing(false);
    showToast({ type: 'success', message: '邮路信息已更新 ✨' });
  };

  const handleAdvance = async () => {
    if (!user) return;
    try {
      setAdvancing(true);
      setLoading(true);
      const res = await lettersApi.advanceStage(letterId);
      if (res.success && res.data) {
        setTracking(res.data);
        showToast({ type: 'success', message: res.message || '已推进到下一阶段！' });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.response?.data?.message || '推进失败，请重试',
      });
    } finally {
      setAdvancing(false);
      setLoading(false);
    }
  };

  const handleResolved = (newTracking?: DeliveryTracking, newLetterId?: string) => {
    if (newTracking) {
      setTracking(newTracking);
    }
    if (newLetterId && newLetterId !== letterId) {
      showToast({ type: 'info', message: '副本信件已创建，正在跳转...' });
      setTimeout(() => {
        navigate(`/letter/${newLetterId}`);
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-cosmic-400/30 border-t-aurora animate-spin mb-4" />
          <p className="text-white/60">正在连接时空邮路网络...</p>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const stageInfo = getStageInfo(
    tracking.currentStage === 'exception' ? 'delivering' : tracking.currentStage
  );
  const isDelivered = tracking.currentStage === 'delivered';
  const isOwner = user && tracking.letterId && true;

  return (
    <div className="space-y-5 animate-fade-in">
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-aurora/25 to-nebula-purple/25 flex items-center justify-center shadow-glow-sm">
              <Route className="w-5 h-5 text-aurora" />
            </div>
            <div>
              <h3 className="font-serif-sc text-xl font-bold text-white">时空邮路追踪</h3>
              <p className="text-sm text-white/50">
                实时追踪你的信件在时空中的旅程
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">刷新</span>
            </button>
            {!isDelivered && isOwner && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-aurora/10 border border-aurora/30 hover:bg-aurora/20 transition-all text-sm text-aurora disabled:opacity-50"
              >
                <FastForward className={`w-4 h-4 ${advancing ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">加速推进</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className={`grid gap-5 ${compact ? 'grid-cols-1' : 'lg:grid-cols-5'}`}>
        <div className={compact ? '' : 'lg:col-span-2 space-y-5'}>
          {!compact && (
            <CountdownTimer
              estimatedArrival={tracking.estimatedArrival}
              currentStage={tracking.currentStage}
              isDelayed={tracking.isDelayed}
              size="lg"
            />
          )}

          {compact && (
            <CountdownTimer
              estimatedArrival={tracking.estimatedArrival}
              currentStage={tracking.currentStage}
              isDelayed={tracking.isDelayed}
              size="sm"
            />
          )}

          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-starlight" />
                传送进度
              </h5>
              <span className="font-serif-sc text-xl font-bold text-aurora tabular-nums">
                {tracking.progress}%
              </span>
            </div>

            <div className="relative h-3 rounded-full bg-white/10 overflow-hidden mb-4">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                  tracking.currentStage === 'exception'
                    ? 'bg-gradient-to-r from-nebula-orange via-nebula-pink to-nebula-orange'
                    : isDelivered
                    ? 'bg-gradient-to-r from-nebula-mint via-starlight to-nebula-mint'
                    : 'bg-gradient-to-r from-nebula-purple via-aurora to-nebula-mint'
                }`}
                style={{ width: `${tracking.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                  <Package className="w-3.5 h-3.5" />
                  当前状态
                </div>
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  <span>{stageInfo?.icon}</span>
                  <span>
                    {tracking.currentStage === 'exception'
                      ? '传送异常'
                      : stageInfo?.label}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  投递模式
                </div>
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  <span>{getSpeedInfo('standard').icon}</span>
                  <span>{getSpeedInfo('standard').label}</span>
                </div>
              </div>
            </div>

            {tracking.isDelayed && !isDelivered && (
              <div className="mt-4 p-3 rounded-xl bg-nebula-pink/10 border border-nebula-pink/20">
                <p className="text-xs text-nebula-pink flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>信件传送有所延迟，时空工程师正在全力疏通航道，请耐心等待或选择补偿方式。</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={compact ? '' : 'lg:col-span-3 space-y-5'}>
          {tracking.hasActiveException && user && (
            <ExceptionPanel
              exceptions={tracking.exceptions}
              letterId={tracking.letterId}
              userId={user.id}
              onResolved={handleResolved}
            />
          )}

          <div className="glass-card p-5 sm:p-6">
            <h5 className="font-medium text-white mb-5 flex items-center gap-2">
              <Route className="w-4 h-4 text-aurora" />
              时空节点流转
            </h5>
            <StageTimeline
              currentStage={tracking.currentStage}
              logs={tracking.logs}
            />
          </div>

          {tracking.logs.length > 0 && (
            <div className="glass-card p-5 sm:p-6">
              <h5 className="font-medium text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-starlight" />
                邮路日志
              </h5>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {tracking.logs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        log.isException
                          ? 'bg-nebula-orange/10 border-nebula-orange/20'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-sm leading-relaxed ${
                            log.isException ? 'text-nebula-orange' : 'text-white/80'
                          }`}
                        >
                          {log.message}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
                        <span>{formatFullDate(log.timestamp)}</span>
                        {log.location && <span>📍 {log.location}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
