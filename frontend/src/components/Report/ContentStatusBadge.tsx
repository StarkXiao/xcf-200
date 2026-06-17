import { AlertTriangle, Shield, Eye, XCircle, CheckCircle } from 'lucide-react';

interface ContentStatusBadgeProps {
  status?: 'normal' | 'pending_review' | 'warned' | 'hidden' | 'removed' | 'resolved' | 'rejected';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig = {
  normal: {
    label: '正常',
    color: 'text-nebula-mint',
    bgColor: 'bg-nebula-mint/10 border-nebula-mint/30',
    icon: Shield,
  },
  pending_review: {
    label: '审核中',
    color: 'text-nebula-orange',
    bgColor: 'bg-nebula-orange/10 border-nebula-orange/30',
    icon: AlertTriangle,
  },
  warned: {
    label: '已警告',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10 border-yellow-400/30',
    icon: AlertTriangle,
  },
  hidden: {
    label: '已隐藏',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10 border-gray-400/30',
    icon: Eye,
  },
  removed: {
    label: '已删除',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10 border-red-400/30',
    icon: XCircle,
  },
  resolved: {
    label: '已处理',
    color: 'text-nebula-mint',
    bgColor: 'bg-nebula-mint/10 border-nebula-mint/30',
    icon: CheckCircle,
  },
  rejected: {
    label: '未违规',
    color: 'text-aurora',
    bgColor: 'bg-aurora/10 border-aurora/30',
    icon: CheckCircle,
  },
};

export default function ContentStatusBadge({
  status = 'normal',
  size = 'md',
  showIcon = true,
}: ContentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.normal;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium ${config.color} ${config.bgColor} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSize} />}
      {config.label}
    </span>
  );
}
