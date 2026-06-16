import { useState, useEffect } from 'react';
import { Clock, Calendar, RotateCcw, Send, History, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn, formatDate, formatFullDate, getRecipientTypeLabel } from '@/utils/helpers';
import type { ScheduledLetter, TimeRemaining } from '@/types';

interface ScheduledLetterCardProps {
  letter: ScheduledLetter;
  onView?: (letter: ScheduledLetter) => void;
  onCancel?: (letter: ScheduledLetter) => void;
  onReschedule?: (letter: ScheduledLetter) => void;
  onResent?: (letter: ScheduledLetter) => void;
  onViewVersions?: (letter: ScheduledLetter) => void;
  index?: number;
  className?: string;
}

export default function ScheduledLetterCard({
  letter,
  onView,
  onCancel,
  onReschedule,
  onResent,
  onViewVersions,
  index,
  className,
}: ScheduledLetterCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    letter.timeRemaining || null
  );

  useEffect(() => {
    if (letter.currentStatus !== 'pending') return;

    const calculateTime = () => {
      const now = Date.now();
      const target = new Date(letter.scheduledDeliverAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: diff });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [letter.scheduledDeliverAt, letter.currentStatus]);

  const recipientInfo = getRecipientTypeLabel(letter.recipientType);

  const getStatusConfig = () => {
    switch (letter.currentStatus) {
      case 'pending':
        return {
          label: '等待送达',
          icon: Clock,
          color: 'text-aurora',
          bg: 'bg-aurora/15',
          border: 'border-aurora/30',
        };
      case 'delivered':
        return {
          label: '已送达',
          icon: CheckCircle,
          color: 'text-nebula-mint',
          bg: 'bg-nebula-mint/15',
          border: 'border-nebula-mint/30',
        };
      case 'cancelled':
        return {
          label: '已撤回',
          icon: X,
          color: 'text-nebula-pink',
          bg: 'bg-nebula-pink/15',
          border: 'border-nebula-pink/30',
        };
      case 'resent':
        return {
          label: '已二次寄送',
          icon: Send,
          color: 'text-starlight',
          bg: 'bg-starlight/15',
          border: 'border-starlight/30',
        };
      default:
        return {
          label: '未知',
          icon: AlertTriangle,
          color: 'text-white/60',
          bg: 'bg-white/10',
          border: 'border-white/20',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatTimeNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div
      className={cn(
        'glass-card p-5 sm:p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group',
        className
      )}
      onClick={() => onView?.(letter)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                recipientInfo.color
              )}
            >
              <span>{recipientInfo.icon}</span>
              致{recipientInfo.label}的{letter.recipient}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                statusConfig.bg,
                statusConfig.color,
                statusConfig.border,
                'border'
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
          <h4 className="font-serif-sc font-semibold text-white truncate group-hover:text-aurora transition-colors">
            {letter.title}
          </h4>
        </div>
      </div>

      {letter.currentStatus === 'pending' && timeRemaining && timeRemaining.total > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-aurora/10 border border-aurora/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-aurora" />
            <span className="text-xs text-white/70">
              送达时间：{formatFullDate(letter.scheduledDeliverAt)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                {timeRemaining.days}
              </div>
              <div className="text-xs text-white/50">天</div>
            </div>
            <span className="text-xl text-aurora/50">:</span>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                {formatTimeNumber(timeRemaining.hours)}
              </div>
              <div className="text-xs text-white/50">时</div>
            </div>
            <span className="text-xl text-aurora/50">:</span>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                {formatTimeNumber(timeRemaining.minutes)}
              </div>
              <div className="text-xs text-white/50">分</div>
            </div>
            <span className="text-xl text-aurora/50">:</span>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-aurora font-mono">
                {formatTimeNumber(timeRemaining.seconds)}
              </div>
              <div className="text-xs text-white/50">秒</div>
            </div>
          </div>
        </div>
      )}

      {letter.currentStatus !== 'pending' && (
        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">
              预约送达：{formatFullDate(letter.scheduledDeliverAt)}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>v{letter.versionCount} 版本</span>
          <span>·</span>
          <span>{formatDate(letter.createdAt)}</span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onViewVersions && (
            <button
              onClick={() => onViewVersions(letter)}
              className="p-2 rounded-lg text-white/50 hover:text-starlight hover:bg-starlight/10 transition-all"
              title="版本历史"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {letter.currentStatus === 'pending' && onReschedule && (
            <button
              onClick={() => onReschedule(letter)}
              className="p-2 rounded-lg text-white/50 hover:text-aurora hover:bg-aurora/10 transition-all"
              title="修改送达时间"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          {letter.currentStatus === 'delivered' && onResent && (
            <button
              onClick={() => onResent(letter)}
              className="p-2 rounded-lg text-white/50 hover:text-nebula-mint hover:bg-nebula-mint/10 transition-all"
              title="二次寄送"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {letter.currentStatus === 'pending' && onCancel && (
            <button
              onClick={() => onCancel(letter)}
              className="p-2 rounded-lg text-white/50 hover:text-nebula-pink hover:bg-nebula-pink/10 transition-all"
              title="撤回信件"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
