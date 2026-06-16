import { cn } from '@/utils/helpers';
import { Check, Lock, Star, Gift } from 'lucide-react';
import type { AchievementTask } from '@/types';

const categoryConfig = {
  writing: { label: '写信', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
  replying: { label: '回信', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  sharing: { label: '分享', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  emotion: { label: '情绪', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
};

interface TaskCardProps {
  task: AchievementTask;
  onClaim?: (taskId: string) => void;
  claiming?: boolean;
}

export default function TaskCard({ task, onClaim, claiming }: TaskCardProps) {
  const config = categoryConfig[task.category];
  const progress = Math.min(task.currentValue / task.targetValue, 1);
  const isCompleted = task.status === 'completed';
  const isLocked = task.status === 'locked';
  const canClaim = isCompleted;

  return (
    <div
      className={cn(
        'relative p-4 rounded-2xl border transition-all duration-300',
        config.bgColor,
        config.borderColor,
        isLocked && 'opacity-40 grayscale',
        isCompleted && 'border-green-500/30 bg-green-500/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
            `bg-gradient-to-br ${config.color.replace('text-', 'from-').replace('-400', '-500')} to-${config.color.replace('text-', '').replace('-400', '-400')}`,
            isLocked && 'bg-gray-700/50'
          )}
        >
          {isLocked ? <Lock className="w-4 h-4 text-white/30" /> : task.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{task.title}</h4>
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                config.bgColor,
                config.color
              )}
            >
              {config.label}
            </span>
          </div>

          <p className="text-xs text-white/50 mb-2">{task.description}</p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted
                    ? 'bg-gradient-to-r from-green-400 to-emerald-400'
                    : `bg-gradient-to-r ${config.color.replace('text-', 'from-').replace('-400', '-500')} to-${config.color.replace('text-', '').replace('-400', '-400')}`
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/50 tabular-nums whitespace-nowrap">
              {Math.min(task.currentValue, task.targetValue)}/{task.targetValue}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="w-3 h-3" />
              <span>{task.rewardStars}</span>
            </div>
            {isCompleted && task.rewardBadgeId && (
              <span className="text-[10px] text-white/40">+ 徽章</span>
            )}
          </div>
        </div>

        {canClaim && (
          <button
            onClick={() => onClaim?.(task.id)}
            disabled={claiming}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              claiming
                ? 'bg-white/5 text-white/30 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-glow hover:shadow-amber-500/30 transform hover:-translate-y-0.5'
            )}
          >
            {claiming ? (
              '领取中...'
            ) : (
              <>
                <Gift className="w-3 h-3" />
                领取
              </>
            )}
          </button>
        )}

        {isCompleted && !canClaim && (
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <Check className="w-4 h-4" />
            已领取
          </div>
        )}

        {isLocked && (
          <div className="flex items-center gap-1 text-white/20 text-xs">
            <Lock className="w-3 h-3" />
            未解锁
          </div>
        )}
      </div>
    </div>
  );
}
