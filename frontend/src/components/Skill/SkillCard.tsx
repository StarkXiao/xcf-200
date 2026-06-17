import React, { useState } from 'react';
import type { Skill, UserSkillProgress, SkillRarity, SkillBranchOption } from '@/types';

interface SkillCardProps {
  skill: Skill;
  progress: UserSkillProgress | null;
  userLevel: number;
  availablePoints: number;
  onUpgrade: () => void;
  onSelectBranch: (branch: 'path_a' | 'path_b') => void;
  isLocked?: boolean;
  prereqMet?: boolean;
}

const rarityStyles: Record<SkillRarity, string> = {
  common: 'from-slate-500/80 to-slate-600/80 border-slate-400/50',
  rare: 'from-sky-500/80 to-blue-600/80 border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
  epic: 'from-fuchsia-500/80 to-purple-600/80 border-fuchsia-400/50 shadow-[0_0_20px_rgba(217,70,239,0.4)]',
  legendary: 'from-amber-500/80 to-orange-600/80 border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.5)]',
};

const rarityLabel: Record<SkillRarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const rarityTextColor: Record<SkillRarity, string> = {
  common: 'text-slate-200',
  rare: 'text-sky-300',
  epic: 'text-fuchsia-300',
  legendary: 'text-amber-300',
};

function computeUpgradeCost(skill: Skill, currentLevel: number): number {
  const base = 1;
  const rarityMultiplier = skill.rarity === 'legendary' ? 4 : skill.rarity === 'epic' ? 3 : skill.rarity === 'rare' ? 2 : 1;
  return base * rarityMultiplier * (currentLevel + 1);
}

function computeEffectiveValue(eff: { value: number; scalePerLevel: number }, level: number, branch?: SkillBranchOption | null) {
  let v = eff.value + eff.scalePerLevel * Math.max(0, level - 1);
  if (branch?.effectModifier?.value) v += (branch.effectModifier as any).value;
  if (branch?.effectModifier?.scalePerLevel) v += (branch.effectModifier as any).scalePerLevel * Math.max(0, level - 1);
  return v;
}

function computeEffectiveAuraCost(skill: Skill, progress: UserSkillProgress | null): number {
  let base = skill.baseAuraCost;
  if (progress?.selectedBranch && skill.branches) {
    const branch = skill.branches.find((b) => b.id === progress.selectedBranch);
    if (branch?.auraCostModifier) base += branch.auraCostModifier;
  }
  return Math.max(0, base);
}

function computeEffectiveCooldown(skill: Skill, progress: UserSkillProgress | null): number {
  let base = skill.baseCooldown;
  if (progress?.selectedBranch && skill.branches) {
    const branch = skill.branches.find((b) => b.id === progress.selectedBranch);
    if (branch?.cooldownModifier) base += branch.cooldownModifier;
  }
  return Math.max(0, base);
}

const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  progress,
  userLevel,
  availablePoints,
  onUpgrade,
  onSelectBranch,
  isLocked = false,
  prereqMet = true,
}) => {
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [hoverBranch, setHoverBranch] = useState<'path_a' | 'path_b' | null>(null);

  const level = progress?.level || 0;
  const isMaxLevel = level >= skill.maxLevel;
  const upgradeCost = computeUpgradeCost(skill, level);
  const canUpgrade = !isMaxLevel && prereqMet && userLevel >= skill.unlockLevel && availablePoints >= upgradeCost;

  const branchUnlockLevel = skill.branchUnlockLevel || 3;
  const branchAvailable = !!skill.branches && level >= branchUnlockLevel;
  const selectedBranch = progress?.selectedBranch
    ? skill.branches?.find((b) => b.id === progress.selectedBranch) || null
    : null;

  const effectiveAuraCost = computeEffectiveAuraCost(skill, progress);
  const effectiveCooldown = computeEffectiveCooldown(skill, progress);

  const previewBranch = hoverBranch ? skill.branches?.find((b) => b.id === hoverBranch) || null : selectedBranch;

  return (
    <>
      <div
        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${
          isLocked || !prereqMet
            ? 'bg-indigo-950/30 border-slate-700/40 opacity-60 grayscale'
            : `bg-gradient-to-br ${rarityStyles[skill.rarity]} backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-1`
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg"
              style={{ backgroundColor: `${skill.color}30`, borderColor: `${skill.color}80` }}
            >
              {isLocked || !prereqMet ? '🔒' : skill.icon}
            </div>
            <div>
              <h3 className={`text-lg font-serif-sc font-bold ${rarityTextColor[skill.rarity]}`}>
                {skill.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${skill.color}30`, color: skill.color }}
                >
                  {rarityLabel[skill.rarity]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                  Lv.{skill.unlockLevel}+解锁
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold tabular-nums ${level > 0 ? 'text-white' : 'text-white/40'}`}>
              {level}
              <span className="text-sm font-normal text-white/50">/{skill.maxLevel}</span>
            </div>
            <div className="mt-1 flex gap-0.5 justify-end">
              {Array.from({ length: skill.maxLevel }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-4 rounded-sm ${
                    i < level ? 'bg-gradient-to-t from-amber-400 to-yellow-200 shadow-[0_0_4px_rgba(251,191,36,0.6)]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-white/80 mb-3 leading-relaxed">{skill.description}</p>

        {level > 0 && (
          <div className="mb-3 p-3 bg-black/25 rounded-xl space-y-2">
            {skill.effects.map((eff, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/70">{eff.description}:</span>
                <span className="font-bold text-emerald-300 tabular-nums">
                  {eff.target === 'letter_multiplier' || eff.target === 'aura_free_window'
                    ? `x${computeEffectiveValue(eff, level, previewBranch).toFixed(1)}`
                    : `+${Math.floor(computeEffectiveValue(eff, level, previewBranch))}`}
                  {level < skill.maxLevel && (
                    <span className="text-white/50 ml-1">
                      (下一级+{eff.scalePerLevel})
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
              <span className="text-white/70">灵气消耗:</span>
              <span className={`font-bold tabular-nums ${effectiveAuraCost < skill.baseAuraCost ? 'text-emerald-300' : effectiveAuraCost > skill.baseAuraCost ? 'text-rose-300' : 'text-amber-300'}`}>
                {effectiveAuraCost}
                {effectiveAuraCost !== skill.baseAuraCost && (
                  <span className="text-white/50 ml-1">(基础{skill.baseAuraCost})</span>
                )}
              </span>
            </div>
            {skill.baseCooldown > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">冷却时间:</span>
                <span className={`font-bold tabular-nums ${effectiveCooldown < skill.baseCooldown ? 'text-sky-300' : effectiveCooldown > skill.baseCooldown ? 'text-rose-300' : 'text-amber-300'}`}>
                  {effectiveCooldown}s
                  {effectiveCooldown !== skill.baseCooldown && (
                    <span className="text-white/50 ml-1">(基础{skill.baseCooldown}s)</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {branchAvailable && skill.branches && (
          <div className="mb-3 p-3 bg-black/25 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300">🌟 分支强化</span>
              {!selectedBranch && level >= branchUnlockLevel && (
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 font-bold hover:brightness-110 transition"
                >
                  选择分支
                </button>
              )}
            </div>
            {selectedBranch ? (
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: `${skill.color}20` }}>
                <span className="text-2xl">{selectedBranch.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{selectedBranch.name}</div>
                  <div className="text-xs text-white/70">{selectedBranch.description}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {skill.branches.map((b) => (
                  <div
                    key={b.id}
                    onMouseEnter={() => setHoverBranch(b.id as any)}
                    onMouseLeave={() => setHoverBranch(null)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-left cursor-default"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{b.icon}</span>
                      <span className="text-xs font-bold text-white/90">{b.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-white/60">
            {!prereqMet && <span className="text-rose-400">⚠️ 需要前置技能</span>}
            {prereqMet && userLevel < skill.unlockLevel && (
              <span className="text-rose-400">⚠️ 需要用户Lv.{skill.unlockLevel}</span>
            )}
          </div>
          <button
            onClick={onUpgrade}
            disabled={!canUpgrade}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              canUpgrade
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-emerald-950 hover:brightness-110 shadow-lg hover:shadow-emerald-500/30 active:scale-95'
                : isMaxLevel
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 opacity-80'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {isMaxLevel
              ? '✨ 已满级'
              : `⬆️ 升级 (${upgradeCost}点)`}
          </button>
        </div>
      </div>

      {showBranchModal && skill.branches && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowBranchModal(false)}
        >
          <div
            className="w-full max-w-lg bg-gradient-to-br from-indigo-950 to-purple-950 rounded-3xl p-6 border-2 shadow-2xl"
            style={{ borderColor: `${skill.color}60` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{ backgroundColor: `${skill.color}20` }}>
                <span className="text-2xl">{skill.icon}</span>
                <span className="font-serif-sc font-bold text-white">{skill.name}</span>
              </div>
              <h2 className="text-2xl font-serif-sc font-bold text-amber-300">选择修炼之道</h2>
              <p className="text-sm text-white/60 mt-1">选择后不可更改，请谨慎决定</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {skill.branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    onSelectBranch(branch.id as any);
                    setShowBranchModal(false);
                  }}
                  className="p-5 rounded-2xl bg-white/5 border-2 border-white/10 hover:border-amber-400/60 hover:bg-amber-400/10 transition-all group text-left"
                >
                  <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">
                    {branch.icon}
                  </div>
                  <h3 className="text-lg font-bold text-center text-white mb-2">{branch.name}</h3>
                  <p className="text-sm text-white/70 text-center mb-3">{branch.description}</p>
                  <div className="space-y-1 pt-3 border-t border-white/10 text-xs">
                    {branch.effectModifier && (branch.effectModifier as any).value && (
                      <div className="flex justify-between">
                        <span className="text-white/60">效果强化:</span>
                        <span className="text-emerald-300 font-bold">+{(branch.effectModifier as any).value}</span>
                      </div>
                    )}
                    {branch.auraCostModifier !== undefined && branch.auraCostModifier !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">灵气消耗:</span>
                        <span className={`font-bold ${branch.auraCostModifier > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {branch.auraCostModifier > 0 ? '+' : ''}{branch.auraCostModifier}
                        </span>
                      </div>
                    )}
                    {branch.cooldownModifier !== undefined && branch.cooldownModifier !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">冷却时间:</span>
                        <span className={`font-bold ${branch.cooldownModifier > 0 ? 'text-rose-300' : 'text-sky-300'}`}>
                          {branch.cooldownModifier > 0 ? '+' : ''}{branch.cooldownModifier}s
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBranchModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SkillCard;
