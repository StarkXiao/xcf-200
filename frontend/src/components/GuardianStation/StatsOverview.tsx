import { Shield, Eye, Heart, Users, AlertTriangle, Activity } from 'lucide-react';
import type { GuardianStationStats } from '@/types';

interface StatsOverviewProps {
  stats: GuardianStationStats | null;
  loading?: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const statCards = [
    {
      label: '内容分析',
      value: stats?.contentRatings.total || 0,
      icon: <Activity className="w-5 h-5" />,
      color: 'text-aurora',
      bgColor: 'bg-aurora/10',
      subText: `安全 ${stats?.contentRatings.byLevel.safe || 0}`,
    },
    {
      label: '待审核',
      value: stats?.reviews.pending || 0,
      icon: <Eye className="w-5 h-5" />,
      color: 'text-starlight',
      bgColor: 'bg-starlight/10',
      subText: `高风险 ${stats?.interventions.highPriority || 0}`,
    },
    {
      label: '干预中',
      value: stats?.interventions.pending + (stats?.interventions.in_progress || 0) || 0,
      icon: <Heart className="w-5 h-5" />,
      color: 'text-nebula-pink',
      bgColor: 'bg-nebula-pink/10',
      subText: `已解决 ${stats?.interventions.resolved || 0}`,
    },
    {
      label: '守护员',
      value: stats?.guardians.total || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-nebula-purple',
      bgColor: 'bg-nebula-purple/10',
      subText: `今日活跃 ${stats?.guardians.activeToday || 0}`,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 h-28 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.bgColor} ${card.color} mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {card.value.toLocaleString()}
            </p>
            <p className="text-sm text-white/60 mb-1">{card.label}</p>
            <p className="text-xs text-white/40">{card.subText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
