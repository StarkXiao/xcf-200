import type { RecipientGroup } from '@/types';

interface GroupDistributionProps {
  distribution: { group: RecipientGroup; count: number }[];
}

export default function GroupDistribution({ distribution }: GroupDistributionProps) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          分组分布
        </h4>
        <p className="text-white/50 text-sm text-center py-4">暂无分组数据</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
        <span className="text-xl">📊</span>
        分组分布
      </h4>

      <div className="relative h-6 rounded-full bg-white/10 overflow-hidden mb-4 flex">
        {distribution.map((item, index) => {
          if (item.count === 0) return null;
          const width = (item.count / total) * 100;
          return (
            <div
              key={item.group.id}
              className="h-full transition-all duration-500"
              style={{
                width: `${width}%`,
                backgroundColor: item.group.color,
                opacity: 0.8 - index * 0.05,
              }}
              title={`${item.group.name}: ${item.count}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {distribution.map((item) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
          return (
            <div
              key={item.group.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.group.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate flex items-center gap-1">
                  <span>{item.group.icon}</span>
                  {item.group.name}
                </div>
                <div className="text-xs text-white/50">
                  {item.count} 人 · {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
