import { Check, Circle, AlertTriangle } from 'lucide-react';
import type { DeliveryStage, DeliveryLog } from '@/types';
import { DELIVERY_STAGES, getStageOrder, formatFullDate, cn } from '@/utils/helpers';

interface StageTimelineProps {
  currentStage: DeliveryStage;
  logs: DeliveryLog[];
  className?: string;
}

export default function StageTimeline({ currentStage, logs, className = '' }: StageTimelineProps) {
  const currentOrder = currentStage === 'exception' ? getStageOrder('delivering') : getStageOrder(currentStage);

  const getLogForStage = (stage: DeliveryStage) => {
    const stageLogs = logs.filter((l) => l.stage === stage && !l.isException);
    return stageLogs[stageLogs.length - 1];
  };

  const getExceptionLog = () => {
    return logs.find((l) => l.isException);
  };

  const exceptionLog = getExceptionLog();

  return (
    <div className={cn('space-y-1', className)}>
      {DELIVERY_STAGES.map((stage, index) => {
        const stageOrder = getStageOrder(stage.stage);
        const isCompleted = stageOrder < currentOrder;
        const isCurrent = stageOrder === currentOrder && currentStage !== 'exception';
        const isExceptionHere = currentStage === 'exception' && stageOrder === currentOrder;
        const log = getLogForStage(stage.stage);

        return (
          <div key={stage.stage} className="relative">
            <div className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10',
                    isCompleted && 'bg-nebula-mint/20 border-nebula-mint/60 shadow-glow-sm',
                    isCurrent && 'bg-aurora/20 border-aurora shadow-glow animate-pulse',
                    isExceptionHere && 'bg-nebula-orange/20 border-nebula-orange shadow-glow animate-pulse',
                    !isCompleted && !isCurrent && !isExceptionHere && 'bg-white/5 border-white/15'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-nebula-mint" />
                  ) : isExceptionHere ? (
                    <AlertTriangle className="w-5 h-5 text-nebula-orange" />
                  ) : isCurrent ? (
                    <span className="text-xl animate-bounce">{stage.icon}</span>
                  ) : (
                    <Circle className="w-4 h-4 text-white/30" />
                  )}
                </div>

                {index < DELIVERY_STAGES.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-10 w-0.5 h-full -mt-1 transition-all duration-500',
                      stageOrder < currentOrder
                        ? 'bg-gradient-to-b from-nebula-mint/60 to-aurora/60'
                        : 'bg-white/10'
                    )}
                    style={{ minHeight: '56px' }}
                  />
                )}
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={cn(
                        'font-serif-sc font-semibold text-base transition-colors',
                        isCompleted && 'text-white',
                        isCurrent && 'text-white',
                        isExceptionHere && 'text-nebula-orange',
                        !isCompleted && !isCurrent && !isExceptionHere && 'text-white/40'
                      )}
                    >
                      {stage.label}
                      {isCurrent && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-aurora/20 text-aurora font-normal">
                          进行中
                        </span>
                      )}
                      {isExceptionHere && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-nebula-orange/20 text-nebula-orange font-normal">
                          异常中
                        </span>
                      )}
                    </h4>
                    <p
                      className={cn(
                        'text-sm mt-1 leading-relaxed',
                        isCompleted || isCurrent || isExceptionHere ? 'text-white/60' : 'text-white/30'
                      )}
                    >
                      {(isCompleted || isCurrent) && log ? log.message : stage.description}
                    </p>
                  </div>
                  {(isCompleted || log) && (
                    <div className="text-xs text-white/40 whitespace-nowrap mt-1">
                      {log ? formatFullDate(log.timestamp).split(' ')[1] : ''}
                    </div>
                  )}
                </div>

                {(isCompleted || isCurrent) && log?.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span>📍 {log.location}</span>
                  </div>
                )}

                {isExceptionHere && exceptionLog && (
                  <div className="mt-3 p-3 rounded-xl bg-nebula-orange/10 border border-nebula-orange/20">
                    <div className="flex items-center gap-2 text-nebula-orange text-sm font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      检测到异常
                    </div>
                    <p className="text-sm text-white/70">{exceptionLog.message}</p>
                    {exceptionLog.location && (
                      <p className="text-xs text-white/40 mt-1">📍 {exceptionLog.location}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
