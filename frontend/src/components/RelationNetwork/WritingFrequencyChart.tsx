interface WritingFrequencyChartProps {
  data: { period: string; count: number }[];
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  return `${year}年${parseInt(month)}月`;
}

export default function WritingFrequencyChart({ data }: WritingFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h4 className="font-serif-sc font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📈</span>
          写作频率
        </h4>
        <p className="text-white/50 text-sm text-center py-4">暂无写作数据</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="glass-card p-5 sm:p-6">
      <h4 className="font-serif-sc font-semibold text-white mb-5 flex items-center gap-2">
        <span className="text-xl">📈</span>
        近月写作频率
      </h4>

      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((item, index) => {
          const height = (item.count / maxCount) * 100;
          const colors = [
            'from-aurora to-cosmic-400',
            'from-starlight to-nebula-orange',
            'from-nebula-pink to-nebula-purple',
            'from-nebula-mint to-aurora',
            'from-cosmic-400 to-nebula-purple',
            'from-nebula-orange to-starlight',
          ];
          return (
            <div key={item.period} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-white/70 font-medium">{item.count}</div>
              <div className="w-full relative flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${colors[index % colors.length]} transition-all duration-1000 ease-out relative group`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute inset-0 rounded-t-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="text-[10px] text-white/50 text-center leading-tight whitespace-nowrap">
                {formatPeriod(item.period)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
