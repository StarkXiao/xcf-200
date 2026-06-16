import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  DeliveryStage,
  DeliveryStageInfo,
  ExceptionType,
  CompensationType,
  CompensationOption,
} from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DELIVERY_STAGES: DeliveryStageInfo[] = [
  {
    stage: 'created',
    label: '信件诞生',
    description: '你的信件刚刚完成，等待送往星际邮局',
    icon: '📝',
    estimatedDuration: 0,
    color: 'from-starlight to-nebula-pink',
  },
  {
    stage: 'star_port',
    label: '抵达星际邮局',
    description: '信件已到达星港，正在办理时空穿梭手续',
    icon: '🏛️',
    estimatedDuration: 60000,
    color: 'from-nebula-purple to-cosmic-400',
  },
  {
    stage: 'time_tunnel',
    label: '穿越时间隧道',
    description: '信件正在穿越时光长河，沿途有许多奇妙风景',
    icon: '🌀',
    estimatedDuration: 120000,
    color: 'from-cosmic-400 to-aurora',
  },
  {
    stage: 'parallel_gateway',
    label: '平行世界关口',
    description: '信件正在寻找正确的平行宇宙入口',
    icon: '🌌',
    estimatedDuration: 90000,
    color: 'from-aurora to-nebula-mint',
  },
  {
    stage: 'delivering',
    label: '最后一公里投递',
    description: '时空信使正在将信件送往收件人手中',
    icon: '🚀',
    estimatedDuration: 60000,
    color: 'from-nebula-mint to-starlight',
  },
  {
    stage: 'delivered',
    label: '已送达',
    description: '信件已安全送达，收件人正在阅读你的心意',
    icon: '✨',
    estimatedDuration: 0,
    color: 'from-starlight to-nebula-orange',
  },
];

export const EXCEPTION_INFO: Record<ExceptionType, { label: string; icon: string; description: string }> = {
  time_anomaly: {
    label: '时间异常',
    icon: '⏰',
    description: '时空流出现波动，信件可能延误',
  },
  cosmic_storm: {
    label: '宇宙风暴',
    icon: '🌪️',
    description: '遭遇宇宙风暴，需要调整航线',
  },
  recipient_lost: {
    label: '收件人失联',
    icon: '🔍',
    description: '无法定位收件人的时空坐标',
  },
  unknown: {
    label: '未知异常',
    icon: '❓',
    description: '遇到了未知的时空异常，正在排查',
  },
};

export const COMPENSATION_OPTIONS: Record<CompensationType, CompensationOption> = {
  accelerate: {
    type: 'accelerate',
    label: '加速传送',
    description: '使用星尘能量加速信件传送，缩短50%时间',
    icon: '⚡',
    cost: 0,
  },
  reroute: {
    type: 'reroute',
    label: '改道航行',
    description: '选择备用时空航线，绕过异常区域',
    icon: '🗺️',
    cost: 0,
  },
  resend: {
    type: 'resend',
    label: '重新发送',
    description: '创建信件副本，从起点重新开始传送',
    icon: '🔄',
    cost: 0,
  },
  compensate_letter: {
    type: 'compensate_letter',
    label: '补偿信件',
    description: '获得一封来自星光信使的安慰信',
    icon: '💌',
    cost: 0,
  },
};

export function getStageInfo(stage: DeliveryStage): DeliveryStageInfo | undefined {
  return DELIVERY_STAGES.find((s) => s.stage === stage);
}

export function calculateStageProgress(
  currentStage: DeliveryStage,
  createdAt: string
): number {
  const stageIndex = DELIVERY_STAGES.findIndex((s) => s.stage === currentStage);
  if (stageIndex === -1) return 0;
  if (stageIndex === DELIVERY_STAGES.length - 1) return 100;

  const baseProgress = (stageIndex / (DELIVERY_STAGES.length - 1)) * 100;
  const currentStageInfo = DELIVERY_STAGES[stageIndex];
  if (!currentStageInfo || currentStageInfo.estimatedDuration === 0) {
    return Math.min(baseProgress + (100 / (DELIVERY_STAGES.length - 1)) * 0.5, 99);
  }

  const elapsed = Date.now() - new Date(createdAt).getTime();
  const stageFraction = Math.min(elapsed / currentStageInfo.estimatedDuration, 1);
  const stageProgress = (100 / (DELIVERY_STAGES.length - 1)) * stageFraction * 0.8;

  return Math.min(baseProgress + stageProgress, 99);
}

export function formatCountdown(milliseconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  displayText: string;
  isPast: boolean;
} {
  const isPast = milliseconds <= 0;
  const absMs = Math.abs(milliseconds);

  const totalSeconds = Math.floor(absMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  let displayText = '';
  if (days > 0) {
    displayText = `${days}天 ${hours}小时 ${minutes}分`;
  } else if (hours > 0) {
    displayText = `${hours}小时 ${minutes}分 ${seconds}秒`;
  } else if (minutes > 0) {
    displayText = `${minutes}分 ${seconds}秒`;
  } else {
    displayText = `${seconds}秒`;
  }

  return { days, hours, minutes, seconds, displayText, isPast };
}

export function getCountdownTo(estimatedArrival: string, currentStage: DeliveryStage) {
  if (currentStage === 'delivered') {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, displayText: '已送达', isPast: true };
  }
  const diff = new Date(estimatedArrival).getTime() - Date.now();
  return formatCountdown(diff);
}

export function getStageOrder(stage: DeliveryStage): number {
  const idx = DELIVERY_STAGES.findIndex((s) => s.stage === stage);
  return idx === -1 ? 0 : idx;
}

export function isStageCompleted(current: DeliveryStage, target: DeliveryStage): boolean {
  return getStageOrder(current) > getStageOrder(target);
}

export function isCurrentStage(current: DeliveryStage, target: DeliveryStage): boolean {
  return current === target;
}

export function generateStageTimestamps(createdAt: string, deliverySpeed: 'standard' | 'express' | 'instant' = 'standard'): Record<DeliveryStage, string> {
  const created = new Date(createdAt).getTime();
  const speedMultiplier = deliverySpeed === 'standard' ? 1 : deliverySpeed === 'express' ? 0.5 : 0.1;

  let cumulative = 0;
  const timestamps: Partial<Record<DeliveryStage, string>> = {};

  timestamps.created = new Date(created).toISOString();

  DELIVERY_STAGES.slice(1).forEach((stage) => {
    cumulative += stage.estimatedDuration * speedMultiplier;
    timestamps[stage.stage] = new Date(created + cumulative).toISOString();
  });

  return timestamps as Record<DeliveryStage, string>;
}

export function simulateCurrentStage(createdAt: string, deliverySpeed: 'standard' | 'express' | 'instant' = 'standard'): DeliveryStage {
  const timestamps = generateStageTimestamps(createdAt, deliverySpeed);
  const now = Date.now();

  for (let i = DELIVERY_STAGES.length - 1; i >= 0; i--) {
    const stage = DELIVERY_STAGES[i].stage;
    if (now >= new Date(timestamps[stage]).getTime()) {
      if (Math.random() < 0.05 && stage !== 'delivered' && stage !== 'created') {
        return 'exception';
      }
      return stage;
    }
  }

  return 'created';
}

export function getSpeedInfo(speed: 'standard' | 'express' | 'instant') {
  const options = {
    standard: { label: '标准投递', icon: '🐢', description: '按时空正常流速传送', timeText: '约5.5分钟' },
    express: { label: '加急投递', icon: '🐇', description: '注入半份星尘能量，加速50%', timeText: '约2.75分钟' },
    instant: { label: '瞬时投递', icon: '⚡', description: '全功率星尘驱动，几乎瞬间到达', timeText: '约33秒' },
  };
  return options[speed];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes} 分钟前`;
    }
    return `${hours} 小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days} 天前`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} 周前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRecipientTypeLabel(type: string): { label: string; icon: string; color: string } {
  const types: Record<string, { label: string; icon: string; color: string }> = {
    future: { label: '未来', icon: '🔮', color: 'bg-aurora/20 text-aurora' },
    past: { label: '过去', icon: '🕰️', color: 'bg-nebula-orange/20 text-nebula-orange' },
    parallel: { label: '平行世界', icon: '🌌', color: 'bg-nebula-purple/20 text-nebula-purple' },
    unknown: { label: '未知', icon: '✨', color: 'bg-starlight/20 text-starlight' },
  };
  return types[type] || types.unknown;
}

export function generateStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    });
  }
  return stars;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateToastId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff > 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (isFuture) {
    if (minutes < 1) return '即将到来';
    if (minutes < 60) return `${minutes} 分钟后`;
    if (hours < 24) return `${hours} 小时后`;
    if (days < 7) return `${days} 天后`;
    if (weeks < 5) return `${weeks} 周后`;
    return `${months} 个月后`;
  } else {
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    if (weeks < 5) return `${weeks} 周前`;
    return `${months} 个月前`;
  }
}
