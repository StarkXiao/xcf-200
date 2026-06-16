import type { RiskLevel } from '@/types';

interface RiskLevelBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const riskConfig = {
  safe: {
    label: '安全',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    icon: '✓',
  },
  mild: {
    label: '轻度关注',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    icon: '⚡',
  },
  moderate: {
    label: '中度警示',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    icon: '⚠',
  },
  severe: {
    label: '重度风险',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    icon: '🚨',
  },
};

export default function RiskLevelBadge({
  level,
  size = 'md',
  showLabel = true,
}: RiskLevelBadgeProps) {
  const config = riskConfig[level];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
