import { useEffect, useState, useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Rocket } from 'lucide-react';
import type { DeliveryStage } from '@/types';
import { getCountdownTo, formatCountdown } from '@/utils/helpers';

interface CountdownTimerProps {
  estimatedArrival: string;
  currentStage: DeliveryStage;
  isDelayed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CountdownTimer({
  estimatedArrival,
  currentStage,
  isDelayed = false,
  size = 'md',
}: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (currentStage === 'delivered') {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, displayText: '已送达', isPast: true };
    }
    const diff = new Date(estimatedArrival).getTime() - now;
    return formatCountdown(diff);
  }, [estimatedArrival, currentStage, now]);

  const isDelivered = currentStage === 'delivered';
  const isException = currentStage === 'exception';

  const sizeConfig = {
    sm: {
      container: 'px-3 py-2',
      icon: 'w-4 h-4',
      numText: 'text-base',
      labelText: 'text-[10px]',
      mainText: 'text-sm',
    },
    md: {
      container: 'px-4 py-3',
      icon: 'w-5 h-5',
      numText: 'text-2xl',
      labelText: 'text-xs',
      mainText: 'text-base',
    },
    lg: {
      container: 'px-6 py-5',
      icon: 'w-7 h-7',
      numText: 'text-4xl',
      labelText: 'text-sm',
      mainText: 'text-lg',
    },
  };

  const conf = sizeConfig[size];

  const statusConfig = () => {
    if (isDelivered) {
      return {
        bg: 'bg-nebula-mint/15',
        border: 'border-nebula-mint/30',
        text: 'text-nebula-mint',
        icon: CheckCircle2,
        label: '送达成功',
      };
    }
    if (isException) {
      return {
        bg: 'bg-nebula-orange/15',
        border: 'border-nebula-orange/30',
        text: 'text-nebula-orange',
        icon: AlertTriangle,
        label: '传送异常',
      };
    }
    if (isDelayed || countdown.isPast) {
      return {
        bg: 'bg-nebula-pink/15',
        border: 'border-nebula-pink/30',
        text: 'text-nebula-pink',
        icon: AlertTriangle,
        label: '已延迟',
      };
    }
    return {
      bg: 'bg-aurora/15',
      border: 'border-aurora/30',
      text: 'text-aurora',
      icon: Clock,
      label: '预计还需',
    };
  };

  const status = statusConfig();
  const StatusIcon = status.icon;

  return (
    <div className={`${conf.container} rounded-2xl ${status.bg} border ${status.border} backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon className={`${conf.icon} ${status.text} ${!isDelivered && !isException ? 'animate-pulse' : ''}`} />
        <span className={`${status.text} font-medium ${conf.mainText}`}>
          {isDelivered ? status.label : isException ? status.label : isDelayed || countdown.isPast ? `${status.label} · 正在加急处理` : status.label}
        </span>
      </div>

      {isDelivered ? (
        <div className="flex items-center gap-2">
          <Rocket className={`${conf.icon} text-starlight`} />
          <span className={`${conf.mainText} font-bold text-white`}>
            信件已安全送达 ✨
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          <div>
            <div className={`${conf.numText} font-bold font-serif-sc text-white tabular-nums`}>
              {String(countdown.days).padStart(2, '0')}
            </div>
            <div className={`${conf.labelText} text-white/50 mt-0.5`}>天</div>
          </div>
          <div>
            <div className={`${conf.numText} font-bold font-serif-sc text-white tabular-nums`}>
              {String(countdown.hours).padStart(2, '0')}
            </div>
            <div className={`${conf.labelText} text-white/50 mt-0.5`}>小时</div>
          </div>
          <div>
            <div className={`${conf.numText} font-bold font-serif-sc text-white tabular-nums`}>
              {String(countdown.minutes).padStart(2, '0')}
            </div>
            <div className={`${conf.labelText} text-white/50 mt-0.5`}>分钟</div>
          </div>
          <div>
            <div className={`${conf.numText} font-bold font-serif-sc text-white tabular-nums animate-pulse`}>
              {String(countdown.seconds).padStart(2, '0')}
            </div>
            <div className={`${conf.labelText} text-white/50 mt-0.5`}>秒</div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>预计送达时间</span>
          <span className="font-medium text-white/70">
            {new Date(estimatedArrival).toLocaleString('zh-CN', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
