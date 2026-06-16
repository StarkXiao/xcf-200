import { Users, Sparkles, Target, Orbit } from 'lucide-react';
import type { ParallelMatchRule } from '@/types';

interface MatchRulesCardProps {
  rules: ParallelMatchRule[];
}

export default function MatchRulesCard({ rules }: MatchRulesCardProps) {
  if (rules.length === 0) return null;

  const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);

  return (
    <section className="mb-8">
      <div className="glass-card p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-nebula-purple/10 flex items-center justify-center">
            <Orbit className="w-5 h-5 text-nebula-purple" />
          </div>
          <div>
            <h3 className="font-serif-sc text-base font-semibold text-white">平行宇宙匹配规则</h3>
            <p className="text-xs text-white/50">系统根据 {rules.length} 个维度为你寻找平行世界的同频灵魂</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {rules.map(rule => (
            <div key={rule.key} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70">{rule.label}</span>
                <span className="text-sm font-bold text-nebula-purple">{rule.weight}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-nebula-purple to-aurora rounded-full transition-all duration-500"
                  style={{ width: `${(rule.weight / totalWeight) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Users className="w-4 h-4" />
            <span>基于情绪标签匹配</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Sparkles className="w-4 h-4" />
            <span>信件主题关联</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Target className="w-4 h-4" />
            <span>行为模式共振</span>
          </div>
        </div>
      </div>
    </section>
  );
}
