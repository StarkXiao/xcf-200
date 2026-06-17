import React, { useEffect, useState } from 'react';
import type { UserAuraState } from '@/types';

interface AuraBarProps {
  aura: UserAuraState | null;
  compact?: boolean;
  auraFreeRemaining?: number;
}

const AuraBar: React.FC<AuraBarProps> = ({ aura, compact = false, auraFreeRemaining = 0 }) => {
  const [displayCurrent, setDisplayCurrent] = useState(aura?.current || 0);

  useEffect(() => {
    if (aura) setDisplayCurrent(aura.current);
  }, [aura?.current]);

  useEffect(() => {
    if (!aura) return;
    const interval = setInterval(() => {
      setDisplayCurrent((prev) => Math.min(aura.max, prev + aura.regenRate));
    }, 1000);
    return () => clearInterval(interval);
  }, [aura]);

  if (!aura) return null;

  const percent = Math.min(100, (displayCurrent / aura.max) * 100);
  const isFree = auraFreeRemaining > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xl">🔮</span>
        <div className="w-24 h-2 bg-indigo-950/60 rounded-full overflow-hidden border border-indigo-500/30">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-emerald-300 tabular-nums">
          {Math.floor(displayCurrent)}/{aura.max}
        </span>
        {isFree && (
          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 rounded-full font-bold animate-pulse">
            免费 {auraFreeRemaining}s
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-indigo-950/40 backdrop-blur rounded-2xl border border-emerald-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">🔮</span>
          <div>
            <h3 className="text-lg font-serif-sc font-bold text-emerald-300">星灵气</h3>
            <p className="text-xs text-emerald-400/70">
              恢复速率: +{aura.regenRate.toFixed(1)}/秒
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white tabular-nums">
            {Math.floor(displayCurrent)}
            <span className="text-sm text-white/50"> / {aura.max}</span>
          </div>
          {isFree && (
            <div className="mt-1 text-sm font-bold text-amber-400 animate-pulse">
              ✨ 灵气免费剩余 {auraFreeRemaining}s
            </div>
          )}
        </div>
      </div>
      <div className="relative h-4 bg-indigo-950/80 rounded-full overflow-hidden border border-emerald-500/30 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 relative overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg tabular-nums">
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuraBar;
