import type { CollaborationStats } from '@/types';
import { Users, MessageCircle, Trophy, Link2, Sparkles } from 'lucide-react';

interface CollaborationStatsProps {
  stats: CollaborationStats;
}

export default function CollaborationStatsPanel({ stats }: CollaborationStatsProps) {
  if (!stats) return null;

  const statItems = [
    {
      label: '总回信',
      value: stats.totalReplies,
      icon: MessageCircle,
      color: 'text-aurora',
      bg: 'bg-aurora/10',
      border: 'border-aurora/20',
    },
    {
      label: '接力回复',
      value: stats.totalRelayReplies,
      icon: Link2,
      color: 'text-nebula-purple',
      bg: 'bg-nebula-purple/10',
      border: 'border-nebula-purple/20',
    },
    {
      label: '精选回复',
      value: stats.featuredReplies,
      icon: Trophy,
      color: 'text-starlight',
      bg: 'bg-starlight/10',
      border: 'border-starlight/20',
    },
    {
      label: '参与人数',
      value: stats.uniqueParticipants,
      icon: Users,
      color: 'text-nebula-mint',
      bg: 'bg-nebula-mint/10',
      border: 'border-nebula-mint/20',
    },
  ];

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-5 h-5 text-starlight" />
        <h4 className="font-serif-sc text-lg font-semibold text-white">协作数据</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border ${item.border} ${item.bg} p-3 sm:p-4 text-center transition-transform hover:scale-105`}
          >
            <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${item.color}`} />
            <div className={`text-xl sm:text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-xs sm:text-sm text-white/60 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">最长情绪接龙</span>
          <span className="text-starlight font-medium">
            {stats.longestEmotionChain} 棒 🏆
          </span>
        </div>

        {stats.emotionDistribution && Object.keys(stats.emotionDistribution).length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-white/60 mb-3">情绪分布</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.emotionDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([emotion, count]) => {
                  const total = Object.values(stats.emotionDistribution).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div
                      key={emotion}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                    >
                      <span className="text-sm">{emotion}</span>
                      <span className="text-xs text-white/50">{percentage}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
