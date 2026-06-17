import React, { useEffect, useState } from 'react';
import useSkillStore from '@/store/useSkillStore';
import useAuthStore from '@/store/useAuthStore';
import useUIStore from '@/store/useUIStore';
import type { CombatTrigger } from '@/types';
import type { CombatButtonDataAPI } from '@/api/skills';
import AuraBar from './AuraBar';

interface CombatSkillBarProps {
  trigger: CombatTrigger;
  triggerLabel: string;
  targetId?: string;
  compact?: boolean;
}

const triggerIcons: Record<CombatTrigger, string> = {
  write_letter: '✒️',
  reply: '💬',
  favorite: '💖',
  browse: '👀',
};

const CombatSkillBar: React.FC<CombatSkillBarProps> = ({
  trigger,
  triggerLabel,
  targetId,
  compact = false,
}) => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const { combatData, aura, fetchCombatButtons, useSkill, isLoading } = useSkillStore();
  const [cooldownTimers, setCooldownTimers] = useState<Record<string, number>>({});
  const [localAura, setLocalAura] = useState(aura?.current || 0);

  const data = combatData[trigger];
  const buttons = data?.combatButtons || [];

  useEffect(() => {
    if (user?.id) fetchCombatButtons(user.id, trigger);
  }, [user?.id, trigger]);

  useEffect(() => {
    if (aura) setLocalAura(aura.current);
  }, [aura?.current]);

  useEffect(() => {
    if (!aura) return;
    const interval = setInterval(() => {
      setLocalAura((prev) => Math.min(aura.max, prev + aura.regenRate));
    }, 1000);
    return () => clearInterval(interval);
  }, [aura]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownTimers((prev) => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v > 1) next[k] = v - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers: Record<string, number> = {};
    for (const btn of buttons) {
      if (btn.isOnCooldown && btn.cooldownRemaining > 0) {
        timers[btn.skillId] = btn.cooldownRemaining;
      }
    }
    setCooldownTimers(timers);
  }, [buttons.map((b) => `${b.skillId}-${b.cooldownRemaining}`).join(',')]);

  const handleUseSkill = async (btn: CombatButtonDataAPI) => {
    if (!user?.id) return;
    if (!btn.canUse) {
      if (btn.isOnCooldown) {
        showToast({ type: 'warning', message: `技能冷却中，还需 ${cooldownTimers[btn.skillId] || btn.cooldownRemaining} 秒` });
      } else if (!btn.hasEnoughAura) {
        showToast({ type: 'error', message: `灵气不足，需要 ${btn.finalAuraCost} 点` });
      } else if (!btn.isUnlocked) {
        showToast({ type: 'warning', message: '技能未解锁，请前往技能树学习' });
      }
      return;
    }

    const result = await useSkill(user.id, btn.skillId, trigger, targetId);
    if (result) {
      showToast({ type: 'success', message: result.message, duration: 3000 });
    } else {
      const err = useSkillStore.getState().error;
      if (err) showToast({ type: 'error', message: err });
    }
  };

  if (!user) return null;

  if (compact) {
    const unlocked = buttons.filter((b) => b.isUnlocked);
    if (unlocked.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {unlocked.map((btn) => {
          const cdRemain = cooldownTimers[btn.skillId] || btn.cooldownRemaining;
          const cdPercent = btn.effectiveCooldown > 0 ? (cdRemain / btn.effectiveCooldown) * 100 : 0;
          const canUse = btn.isUnlocked && cdRemain <= 0 && localAura >= btn.finalAuraCost;

          return (
            <button
              key={btn.skillId}
              onClick={() => handleUseSkill(btn)}
              disabled={!canUse || isLoading}
              title={`${btn.skillName} - ${btn.description}\n灵气: ${btn.finalAuraCost} | 冷却: ${btn.effectiveCooldown}s`}
              className={`relative w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all overflow-hidden group ${
                canUse
                  ? 'border-white/30 bg-indigo-900/60 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95'
                  : 'border-white/10 bg-indigo-950/40 opacity-60 cursor-not-allowed'
              }`}
              style={{ borderColor: canUse ? `${btn.color}80` : undefined }}
            >
              <span className={cdRemain > 0 ? 'opacity-40' : ''}>{btn.icon}</span>
              {cdRemain > 0 && (
                <>
                  <div
                    className="absolute inset-x-0 bottom-0 bg-black/60 transition-all"
                    style={{ height: `${cdPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                    {cdRemain}
                  </span>
                </>
              )}
              {btn.finalAuraCost > 0 && cdRemain <= 0 && (
                <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-emerald-500 text-white px-1 rounded">
                  {btn.finalAuraCost}
                </span>
              )}
              {btn.level > 0 && (
                <span className="absolute -top-1 -left-1 text-[9px] font-bold bg-amber-500 text-amber-950 px-1 rounded-full">
                  L{btn.level}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-indigo-950/50 backdrop-blur rounded-2xl border border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{triggerIcons[trigger]}</span>
          <h3 className="font-serif-sc font-bold text-white">{triggerLabel} - 星能技</h3>
        </div>
        <AuraBar aura={aura} compact auraFreeRemaining={data?.auraFreeRemaining || 0} />
      </div>

      {buttons.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <span className="text-4xl block mb-2">🌙</span>
          暂无可用技能，前往技能树解锁
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {buttons.map((btn) => {
            const cdRemain = cooldownTimers[btn.skillId] || btn.cooldownRemaining;
            const cdPercent = btn.effectiveCooldown > 0 ? (cdRemain / btn.effectiveCooldown) * 100 : 0;
            const canUse = btn.isUnlocked && cdRemain <= 0 && localAura >= btn.finalAuraCost;

            return (
              <button
                key={btn.skillId}
                onClick={() => handleUseSkill(btn)}
                disabled={!canUse || isLoading}
                className={`relative p-3 rounded-2xl border-2 transition-all overflow-hidden group text-left ${
                  !btn.isUnlocked
                    ? 'border-white/10 bg-indigo-950/30 opacity-50 grayscale'
                    : canUse
                    ? 'border-white/20 bg-indigo-900/50 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-xl active:scale-95'
                    : 'border-white/10 bg-indigo-950/40 opacity-70'
                }`}
                style={{
                  borderColor: canUse ? `${btn.color}60` : undefined,
                  boxShadow: canUse ? `0 0 20px ${btn.color}20` : undefined,
                }}
              >
                {!btn.isUnlocked && (
                  <div className="absolute top-2 right-2 text-lg">🔒</div>
                )}

                <div className="relative h-16 flex items-center justify-center mb-2">
                  <span className={`text-4xl transition-transform ${cdRemain > 0 ? 'opacity-30 scale-90' : 'group-hover:scale-110'}`}>
                    {btn.icon}
                  </span>
                  {cdRemain > 0 && (
                    <>
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={btn.color}
                          strokeWidth="6"
                          strokeDasharray={`${(1 - cdPercent / 100) * 283} 283`}
                          className="transition-all"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white drop-shadow-lg">
                        {cdRemain}
                      </span>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-bold text-white truncate">{btn.skillName}</h4>
                  {btn.level > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-bold">
                        Lv.{btn.level}
                      </span>
                      {btn.selectedBranch && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold">
                          分支
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                  {btn.finalAuraCost > 0 && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/60">🔮 灵气</span>
                      <span className={`font-bold tabular-nums ${localAura >= btn.finalAuraCost ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {data?.auraFreeActive ? '免费' : btn.finalAuraCost}
                      </span>
                    </div>
                  )}
                  {btn.effectiveCooldown > 0 && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/60">⏱️ 冷却</span>
                      <span className="font-bold text-sky-300 tabular-nums">{btn.effectiveCooldown}s</span>
                    </div>
                  )}
                </div>

                {btn.level === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                    <span className="text-xs font-bold text-white/80">未解锁</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CombatSkillBar;
