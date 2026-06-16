import { cn } from '@/utils/helpers';
import { Star, Award, Target, PenLine, MessageSquareHeart, Globe, HeartPulse } from 'lucide-react';
import type { AchievementUserProgress } from '@/types';

interface AchievementOverviewProps {
  userProgress: AchievementUserProgress;
}

const categoryIcons = {
  writing: PenLine,
  replying: MessageSquareHeart,
  sharing: Globe,
  emotion: HeartPulse,
};

const categoryLabels = {
  writing: '写信',
  replying: '回信',
  sharing: '分享',
  emotion: '情绪',
};

const categoryColors = {
  writing: 'text-cyan-400',
  replying: 'text-purple-400',
  sharing: 'text-amber-400',
  emotion: 'text-pink-400',
};

export default function AchievementOverview({ userProgress }: AchievementOverviewProps) {
  const {
    totalStars,
    completedTasks,
    totalTasks,
    earnedBadges,
    totalBadges,
    categoryStats,
  } = userProgress;

  const stats = [
    {
      label: '星尘',
      value: totalStars,
      icon: Star,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '已完成任务',
      value: `${completedTasks}/${totalTasks}`,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: '徽章',
      value: `${earnedBadges}/${totalBadges}`,
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={cn('p-2.5 rounded-xl', stat.bgColor, stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(categoryStats) as Array<keyof typeof categoryStats>).map((cat) => {
          const catData = categoryStats[cat];
          const Icon = categoryIcons[cat];
          const color = categoryColors[cat];
          const progress = catData.total > 0 ? catData.completed / catData.total : 0;

          return (
            <div
              key={cat}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', color)} />
                <span className="text-sm font-medium text-white/70">
                  {categoryLabels[cat]}
                </span>
              </div>
              <div className="text-xs text-white/40 mb-2">
                {catData.completed}/{catData.total} 任务
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r',
                    color.replace('text-', 'from-').replace('-400', '-500'),
                    color.replace('text-', 'to-').replace('-400', '-400')
                  )}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400/70">
                <Star className="w-2.5 h-2.5" />
                {catData.stars}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
