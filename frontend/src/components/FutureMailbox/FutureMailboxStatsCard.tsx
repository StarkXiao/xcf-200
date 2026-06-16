import { Mail, Clock, CheckCircle, XCircle, RotateCcw, History, Sparkles } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { FutureMailboxStats } from '@/types';

interface FutureMailboxStatsCardProps {
  stats: FutureMailboxStats;
  className?: string;
}

export default function FutureMailboxStatsCard({
  stats,
  className,
}: FutureMailboxStatsCardProps) {
  const statItems = [
    {
      key: 'total',
      label: '预约总数',
      value: stats.total,
      icon: Mail,
      color: 'text-aurora',
      bg: 'bg-aurora/15',
    },
    {
      key: 'pending',
      label: '待送达',
      value: stats.pending,
      icon: Clock,
      color: 'text-starlight',
      bg: 'bg-starlight/15',
    },
    {
      key: 'delivered',
      label: '已送达',
      value: stats.delivered,
      icon: CheckCircle,
      color: 'text-nebula-mint',
      bg: 'bg-nebula-mint/15',
    },
    {
      key: 'cancelled',
      label: '已撤回',
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-nebula-pink',
      bg: 'bg-nebula-pink/15',
    },
    {
      key: 'resent',
      label: '二次寄送',
      value: stats.resent,
      icon: RotateCcw,
      color: 'text-nebula-orange',
      bg: 'bg-nebula-orange/15',
    },
    {
      key: 'versions',
      label: '历史版本',
      value: stats.totalVersions,
      icon: History,
      color: 'text-cosmic-400',
      bg: 'bg-cosmic-400/15',
    },
  ];

  return (
    <div className={cn('glass-card p-5 sm:p-6', className)}>
      <h3 className="font-serif-sc text-lg font-semibold text-white mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-aurora" />
        未来信箱统计
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all"
            >
              <div className={cn('w-10 h-10 mx-auto mb-2 rounded-xl', item.bg, 'flex items-center justify-center')}>
                <Icon className={cn('w-5 h-5', item.color)} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-xs text-white/60">{item.label}</div>
            </div>
          );
        })}
      </div>

      {stats.upcoming && stats.upcoming.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-starlight" />
            即将送达
          </h4>
          <div className="space-y-2">
            {stats.upcoming.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-aurora/5 border border-aurora/20 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    致 {item.recipient}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-aurora">
                    {item.timeRemaining?.days || 0}天
                  </div>
                  <div className="text-xs text-white/50">后送达</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
