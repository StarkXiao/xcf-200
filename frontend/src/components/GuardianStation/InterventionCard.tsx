import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import RiskLevelBadge from './RiskLevelBadge';
import type { Intervention, InterventionPriority } from '@/types';

interface InterventionCardProps {
  intervention: Intervention;
  onClick?: (intervention: Intervention) => void;
}

const priorityConfig: Record<InterventionPriority, { label: string; color: string; icon: string }> = {
  high: { label: '高优先级', color: 'text-red-400 bg-red-500/20', icon: '🔴' },
  medium: { label: '中优先级', color: 'text-yellow-400 bg-yellow-500/20', icon: '🟡' },
  low: { label: '低优先级', color: 'text-green-400 bg-green-500/20', icon: '🟢' },
};

const statusConfig = {
  pending: { label: '待处理', icon: Clock, color: 'text-yellow-400' },
  in_progress: { label: '处理中', icon: AlertCircle, color: 'text-blue-400' },
  resolved: { label: '已解决', icon: CheckCircle, color: 'text-green-400' },
  closed: { label: '已关闭', icon: XCircle, color: 'text-gray-400' },
};

const typeLabels: Record<string, { label: string; icon: string }> = {
  system_tip: { label: '系统提示', icon: '🤖' },
  peer_care: { label: '同伴关怀', icon: '💝' },
  resource_push: { label: '资源推送', icon: '📚' },
  human_intervention: { label: '人工介入', icon: '👤' },
  emergency: { label: '紧急响应', icon: '🚨' },
};

export default function InterventionCard({
  intervention,
  onClick,
}: InterventionCardProps) {
  const StatusIcon = statusConfig[intervention.status].icon;
  const priority = priorityConfig[intervention.priority];
  const typeInfo = typeLabels[intervention.type] || { label: intervention.type, icon: '📋' };

  return (
    <div
      onClick={() => onClick?.(intervention)}
      className="glass-card rounded-2xl p-5 hover:shadow-lg hover:shadow-aurora/5 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h4 className="text-white font-medium">{typeInfo.label}</h4>
            <p className="text-xs text-white/40">
              {new Date(intervention.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        <RiskLevelBadge level={intervention.riskLevel} size="sm" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${priority.color}`}>
          {priority.icon} {priority.label}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs ${statusConfig[intervention.status].color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig[intervention.status].label}
        </span>
      </div>

      <div className="bg-black/20 rounded-xl p-3 mb-3">
        <p className="text-sm text-white/70 line-clamp-2">
          {intervention.records[intervention.records.length - 1]?.content || '暂无记录'}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">
          记录数：{intervention.records.length}
        </span>
        <span className="text-aurora group-hover:translate-x-1 transition-transform">
          查看详情 →
        </span>
      </div>
    </div>
  );
}
