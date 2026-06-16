import { cn } from '@/utils/helpers';
import type { AchievementBadge } from '@/types';

const rarityConfig = {
  common: { label: '普通', borderColor: 'border-white/20', glowColor: '', bgColor: 'bg-white/5' },
  rare: { label: '稀有', borderColor: 'border-blue-400/40', glowColor: 'shadow-blue-400/20 shadow-lg', bgColor: 'bg-blue-500/10' },
  epic: { label: '史诗', borderColor: 'border-purple-400/40', glowColor: 'shadow-purple-400/20 shadow-lg', bgColor: 'bg-purple-500/10' },
  legendary: { label: '传说', borderColor: 'border-amber-400/40', glowColor: 'shadow-amber-400/30 shadow-xl', bgColor: 'bg-amber-500/10' },
};

interface BadgeCardProps {
  badge: AchievementBadge;
  onClick?: () => void;
}

export default function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const rarity = rarityConfig[badge.rarity];
  const isEarned = badge.isEarned;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300',
        rarity.borderColor,
        rarity.bgColor,
        rarity.glowColor,
        isEarned
          ? 'cursor-pointer hover:scale-105'
          : 'opacity-40 grayscale cursor-default',
        onClick && isEarned && 'hover:border-white/30'
      )}
    >
      {badge.rarity !== 'common' && (
        <span
          className={cn(
            'absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            badge.rarity === 'rare' && 'bg-blue-500/20 text-blue-300',
            badge.rarity === 'epic' && 'bg-purple-500/20 text-purple-300',
            badge.rarity === 'legendary' && 'bg-amber-500/20 text-amber-300'
          )}
        >
          {rarity.label}
        </span>
      )}

      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-2',
          `bg-gradient-to-br ${badge.color}`,
          !isEarned && 'bg-gray-700/50'
        )}
      >
        {isEarned ? badge.icon : '🔒'}
      </div>

      <h4 className="text-sm font-medium text-white text-center leading-tight mb-1">
        {badge.name}
      </h4>
      <p className="text-[11px] text-white/40 text-center leading-tight">
        {isEarned ? badge.description : '未解锁'}
      </p>
    </div>
  );
}
