import { cn } from '@/utils/helpers';

interface EmotionTagProps {
  name: string;
  icon?: string;
  color?: string;
  count?: number;
  selected?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showCount?: boolean;
}

const defaultColors: Record<string, string> = {
  思念: '#9B59B6',
  希望: '#F1C40F',
  勇气: '#E74C3C',
  爱情: '#FF6B9D',
  遗憾: '#7F8C8D',
  亲情: '#E67E22',
  治愈: '#2ECC71',
  好奇: '#3498DB',
  孤独: '#34495E',
  温暖: '#FF9A8B',
  怀念: '#A1887F',
  幸福: '#F06292',
  神秘: '#5E35B1',
  梦想: '#64B5F6',
  告别: '#546E7A',
};

const defaultIcons: Record<string, string> = {
  思念: '💭',
  希望: '✨',
  勇气: '🔥',
  爱情: '💕',
  遗憾: '🍂',
  亲情: '🏠',
  治愈: '🌿',
  好奇: '🔭',
  孤独: '🌙',
  温暖: '☀️',
  怀念: '📷',
  幸福: '🎀',
  神秘: '🌌',
  梦想: '☁️',
  告别: '🕊️',
};

export default function EmotionTag({
  name,
  icon,
  color,
  count,
  selected = false,
  size = 'md',
  onClick,
  showCount = false,
}: EmotionTagProps) {
  const actualColor = color || defaultColors[name] || '#999';
  const actualIcon = icon || defaultIcons[name] || '💫';

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3.5 py-1.5 gap-1.5',
    lg: 'text-base px-5 py-2.5 gap-2',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-300 transform',
        sizeClasses[size],
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
        selected
          ? 'shadow-lg'
          : 'hover:shadow-md'
      )}
      style={{
        backgroundColor: selected ? actualColor : `${actualColor}18`,
        color: selected ? '#fff' : actualColor,
        border: selected ? 'none' : `1px solid ${actualColor}30`,
        boxShadow: selected ? `0 4px 20px ${actualColor}50` : undefined,
      }}
    >
      <span className={size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}>
        {actualIcon}
      </span>
      <span>{name}</span>
      {showCount && count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5',
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          )}
          style={{
            backgroundColor: selected ? 'rgba(255,255,255,0.25)' : `${actualColor}25`,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
