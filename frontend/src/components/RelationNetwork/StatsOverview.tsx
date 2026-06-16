import { Users, FolderKanban, PenLine, Heart } from 'lucide-react';
import type { RelationNetworkStats } from '@/types';

interface StatsOverviewProps {
  stats: RelationNetworkStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const totalLetters = stats.writingFrequency.reduce((sum, item) => sum + item.count, 0);

  const statItems = [
    {
      label: '收信人总数',
      value: stats.totalRecipients,
      icon: Users,
      color: 'text-aurora',
      bg: 'bg-aurora/15',
    },
    {
      label: '关系分组',
      value: stats.totalGroups,
      icon: FolderKanban,
      color: 'text-nebula-purple',
      bg: 'bg-nebula-purple/15',
    },
    {
      label: '累计写信',
      value: totalLetters,
      icon: PenLine,
      color: 'text-starlight',
      bg: 'bg-starlight/15',
    },
    {
      label: '情绪种类',
      value: new Set(stats.emotionPreferences.map((e) => e.emotion)).size,
      icon: Heart,
      color: 'text-nebula-pink',
      bg: 'bg-nebula-pink/15',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="glass-card p-4 sm:p-5 text-center">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl ${item.bg} flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{item.value}</div>
            <div className="text-xs sm:text-sm text-white/60">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}
