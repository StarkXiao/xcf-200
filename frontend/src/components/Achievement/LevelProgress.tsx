import { cn } from '@/utils/helpers';
import type { AchievementLevel, AchievementUserProgress } from '@/types';

interface LevelProgressProps {
  userProgress: AchievementUserProgress;
  levels: AchievementLevel[];
}

export default function LevelProgress({ userProgress, levels }: LevelProgressProps) {
  const { level, nextLevel, levelProgress, totalStars } = userProgress;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-4 mb-5">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl',
            `bg-gradient-to-br ${level.color}`,
            'shadow-lg'
          )}
        >
          {level.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/40 text-sm">Lv.{level.level}</span>
            <h3 className="text-xl font-bold text-white">{level.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-400 font-medium">{totalStars} 星尘</span>
            {nextLevel && (
              <>
                <span className="text-white/20">→</span>
                <span className="text-white/40">
                  下一级: Lv.{nextLevel.level} {nextLevel.title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>{level.title}</span>
          {nextLevel ? <span>{nextLevel.title}</span> : <span>MAX</span>}
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 bg-gradient-to-r',
              level.color
            )}
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>
        {nextLevel && (
          <p className="text-xs text-white/30 mt-1.5 text-right">
            还需 {nextLevel.minStars - totalStars} 星尘升级
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {levels.map((l) => {
          const isCurrent = l.level === level.level;
          const isReached = totalStars >= l.minStars;
          return (
            <div
              key={l.level}
              className={cn(
                'text-center py-1.5 px-1 rounded-lg text-xs transition-all',
                isCurrent
                  ? 'bg-white/10 text-white font-medium ring-1 ring-white/20'
                  : isReached
                    ? 'text-white/50'
                    : 'text-white/20'
              )}
            >
              <div className="text-base mb-0.5">{l.icon}</div>
              <div className="truncate">{l.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
