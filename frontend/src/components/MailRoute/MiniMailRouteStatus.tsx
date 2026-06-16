import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { DeliveryStage } from '@/types';
import { getStageInfo, calculateStageProgress, getCountdownTo, cn } from '@/utils/helpers';

interface MiniMailRouteStatusProps {
  letterId: string;
  createdAt: string;
  estimatedArrival?: string;
  showCountdown?: boolean;
  className?: string;
}

const STAGE_BADGE: Record<DeliveryStage, { bg: string; text: string; border: string }> = {
  created: { bg: 'bg-white/10', text: 'text-white/70', border: 'border-white/15' },
  star_port: { bg: 'bg-nebula-purple/15', text: 'text-nebula-purple', border: 'border-nebula-purple/30' },
  time_tunnel: { bg: 'bg-cosmic-400/15', text: 'text-cosmic-300', border: 'border-cosmic-400/30' },
  parallel_gateway: { bg: 'bg-nebula-purple/15', text: 'text-nebula-purple', border: 'border-nebula-purple/30' },
  delivering: { bg: 'bg-aurora/15', text: 'text-aurora', border: 'border-aurora/30' },
  delivered: { bg: 'bg-nebula-mint/15', text: 'text-nebula-mint', border: 'border-nebula-mint/30' },
  exception: { bg: 'bg-nebula-orange/15', text: 'text-nebula-orange', border: 'border-nebula-orange/30' },
};

export default function MiniMailRouteStatus({
  letterId,
  createdAt,
  estimatedArrival,
  showCountdown = false,
  className = '',
}: MiniMailRouteStatusProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const simulatedStage = (() => {
    const elapsed = now - new Date(createdAt).getTime();
    const stages: { stage: DeliveryStage; time: number }[] = [
      { stage: 'created', time: 0 },
      { stage: 'star_port', time: 60000 },
      { stage: 'time_tunnel', time: 180000 },
      { stage: 'parallel_gateway', time: 270000 },
      { stage: 'delivering', time: 330000 },
      { stage: 'delivered', time: 390000 },
    ];

    let current: DeliveryStage = 'created';
    for (const s of stages) {
      if (elapsed >= s.time) current = s.stage;
    }

    if (Math.random() < 0.03 && current !== 'delivered' && current !== 'created') {
      return 'exception' as DeliveryStage;
    }
    return current;
  })();

  const stageInfo = getStageInfo(simulatedStage === 'exception' ? 'delivering' : simulatedStage);
  const progress = calculateStageProgress(simulatedStage, createdAt);
  const badge = STAGE_BADGE[simulatedStage];

  const arrival = estimatedArrival || new Date(new Date(createdAt).getTime() + 390000).toISOString();

  const StatusIcon =
    simulatedStage === 'delivered'
      ? CheckCircle2
      : simulatedStage === 'exception'
      ? AlertTriangle
      : Clock;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
            badge.bg,
            badge.text,
            badge.border
          )}
        >
          {simulatedStage === 'exception' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <span className="text-[11px]">{stageInfo?.icon}</span>
          )}
          <span>
            {simulatedStage === 'exception' ? '异常中' : stageInfo?.label}
          </span>
        </span>
        {showCountdown && simulatedStage !== 'delivered' && (
          <span className="text-[11px] text-white/50 tabular-nums">
            {getCountdownTo(arrival, simulatedStage).displayText}
          </span>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            simulatedStage === 'exception'
              ? 'bg-gradient-to-r from-nebula-orange to-nebula-pink'
              : simulatedStage === 'delivered'
              ? 'bg-gradient-to-r from-nebula-mint to-starlight'
              : 'bg-gradient-to-r from-nebula-purple via-aurora to-nebula-mint'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
