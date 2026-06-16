import type { MatchDimension } from '@/types';

interface MatchDimensionChartProps {
  dimensions: MatchDimension[];
}

export default function MatchDimensionChart({ dimensions }: MatchDimensionChartProps) {
  if (dimensions.length === 0) return null;

  return (
    <div className="space-y-3">
      {dimensions.map(dim => (
        <div key={dim.key} className="flex items-center gap-3">
          <span className="text-base w-6 text-center">{dim.icon}</span>
          <span className="text-sm text-white/70 w-20 shrink-0">{dim.label}</span>
          <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{
                width: `${dim.score}%`,
                backgroundColor: dim.color,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${dim.color}40, ${dim.color})`,
                }}
              />
            </div>
          </div>
          <span className="text-sm font-medium w-10 text-right" style={{ color: dim.color }}>
            {dim.score}%
          </span>
        </div>
      ))}
    </div>
  );
}
