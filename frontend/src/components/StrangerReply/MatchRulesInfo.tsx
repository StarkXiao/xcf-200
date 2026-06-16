import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Target } from 'lucide-react';
import type { MatchRule } from '@/types';

interface MatchRulesInfoProps {
  rules: MatchRule[];
}

export default function MatchRulesInfo({ rules }: MatchRulesInfoProps) {
  const [expanded, setExpanded] = useState(false);

  if (rules.length === 0) return null;

  const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);

  return (
    <section className="mb-8">
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-starlight/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-starlight" />
            </div>
            <div className="text-left">
              <h3 className="font-serif-sc text-base font-semibold text-white">智能匹配规则</h3>
              <p className="text-xs text-white/50">系统根据 {rules.length} 项规则为你推荐最合适的回信任务</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/40" />
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/60" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {rules.map((rule) => (
                <div key={rule.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/70">{rule.label}</span>
                    <span className="text-sm font-bold text-starlight">{rule.weight}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-starlight to-aurora rounded-full transition-all duration-500"
                      style={{ width: `${(rule.weight / totalWeight) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/40 text-center">
              💡 设置你的回信偏好可以获得更精准的匹配推荐
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
