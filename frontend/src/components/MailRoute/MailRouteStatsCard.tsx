import { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  Send,
  AlertCircle,
} from 'lucide-react';
import { lettersApi } from '@/api/letters';
import useUIStore from '@/store/useUIStore';
import type { MailRouteStats, DeliveryStage } from '@/types';
import { DELIVERY_STAGES, cn, formatCountdown } from '@/utils/helpers';

interface MailRouteStatsCardProps {
  userId: string;
}

const STAGE_ICONS: Record<string, string> = {
  created: '📝',
  star_port: '🏛️',
  time_tunnel: '🌀',
  parallel_gateway: '🌌',
  delivering: '🚀',
  delivered: '✨',
  exception: '⚠️',
};

const STAGE_LABELS: Record<string, string> = {
  created: '待寄出',
  star_port: '星港中转',
  time_tunnel: '时光隧道',
  parallel_gateway: '平行关口',
  delivering: '投递中',
  delivered: '已送达',
  exception: '异常',
};

export default function MailRouteStatsCard({ userId }: MailRouteStatsCardProps) {
  const { showToast } = useUIStore();
  const [stats, setStats] = useState<MailRouteStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await lettersApi.getMailRouteStats(userId);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      showToast({ type: 'error', message: '加载邮路统计失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const statItems = [
    {
      key: 'totalInTransit',
      label: '传送中',
      icon: Send,
      color: 'text-aurora',
      bg: 'bg-aurora/15',
      border: 'border-aurora/25',
    },
    {
      key: 'totalDelivered',
      label: '已送达',
      icon: CheckCircle2,
      color: 'text-nebula-mint',
      bg: 'bg-nebula-mint/15',
      border: 'border-nebula-mint/25',
    },
    {
      key: 'totalExceptions',
      label: '异常件',
      icon: AlertTriangle,
      color: 'text-nebula-orange',
      bg: 'bg-nebula-orange/15',
      border: 'border-nebula-orange/25',
    },
    {
      key: 'totalDelayed',
      label: '已延迟',
      icon: Clock,
      color: 'text-nebula-pink',
      bg: 'bg-nebula-pink/15',
      border: 'border-nebula-pink/25',
    },
  ];

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="h-40 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalLetters = (stats as any).totalLetters || 0;
  const deliveryRate =
    totalLetters > 0 ? Math.round((stats.totalDelivered / totalLetters) * 100) : 0;
  const avgTimeText = stats.averageDeliveryTime > 0
    ? formatCountdown(stats.averageDeliveryTime).displayText
    : '—';

  const distEntries = Object.entries(stats.stageDistribution).filter(
    ([, count]) => count > 0
  );
  const maxCount = Math.max(...distEntries.map(([, count]) => count), 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aurora/25 to-nebula-purple/25 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-aurora" />
            </div>
            <div>
              <h4 className="font-serif-sc font-bold text-lg text-white">时空邮路统计</h4>
              <p className="text-xs text-white/50">你的信件传送总览</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-serif-sc text-2xl font-bold text-white tabular-nums">
              {totalLetters}
            </div>
            <div className="text-xs text-white/50">信件总数</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map((item) => {
            const Icon = item.icon;
            const value = (stats as any)[item.key] || 0;
            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border ${item.bg} ${item.border} backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className={`text-xl font-bold font-serif-sc tabular-nums ${item.color}`}>
                    {value}
                  </span>
                </div>
                <div className="text-xs text-white/60">{item.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-nebula-mint" />
                送达率
              </span>
              <span className="font-serif-sc text-xl font-bold text-nebula-mint tabular-nums">
                {deliveryRate}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-nebula-mint to-starlight transition-all duration-1000"
                style={{ width: `${deliveryRate}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-aurora" />
                平均送达时间
              </span>
              <span className="font-serif-sc text-lg font-bold text-aurora">
                {avgTimeText}
              </span>
            </div>
            <div className="text-xs text-white/40">
              根据已送达信件计算的平均传送耗时
            </div>
          </div>
        </div>
      </div>

      {distEntries.length > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h4 className="font-medium text-white mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-starlight" />
            阶段分布
          </h4>
          <div className="space-y-3">
            {distEntries.map(([stage, count]) => {
              const percent = Math.round((count / maxCount) * 100);
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70 flex items-center gap-2">
                      <span>{STAGE_ICONS[stage] || '📦'}</span>
                      <span>{STAGE_LABELS[stage] || stage}</span>
                    </span>
                    <span className="text-sm font-medium text-white/80 tabular-nums">
                      {count} 件
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        stage === 'delivered'
                          ? 'bg-gradient-to-r from-nebula-mint to-starlight'
                          : stage === 'exception'
                          ? 'bg-gradient-to-r from-nebula-orange to-nebula-pink'
                          : stage === 'delivering'
                          ? 'bg-gradient-to-r from-aurora to-nebula-mint'
                          : 'bg-gradient-to-r from-nebula-purple to-aurora'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.totalExceptions > 0 && (
        <div className="glass-card p-5 border border-nebula-orange/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-nebula-orange/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-nebula-orange" />
            </div>
            <div>
              <h5 className="font-semibold text-white mb-1">有 {stats.totalExceptions} 封信件传送异常</h5>
              <p className="text-sm text-white/60">
                请前往"我的信件"查看详情，选择合适的补偿方式处理。你的每一封信都很珍贵 ✨
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
