import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';
import useSkillStore from '@/store/useSkillStore';
import useUIStore from '@/store/useUIStore';
import type { SkillCategory, Skill } from '@/types';
import SkillCard from '@/components/Skill/SkillCard';
import AuraBar from '@/components/Skill/AuraBar';

const SkillTreePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { treeData, aura, isLoading, error, fetchTreeData, upgradeSkill, selectBranch, clearError } = useSkillStore();
  const { showToast } = useUIStore();
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all');
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.id) fetchTreeData(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (error && !toastShown) {
      showToast({ type: 'error', message: error });
      clearError();
      setToastShown(true);
      setTimeout(() => setToastShown(false), 100);
    }
  }, [error]);

  const handleUpgrade = async (skill: Skill) => {
    if (!user?.id) return;
    const result = await upgradeSkill(user.id, skill.id);
    if (result) {
      const changes: string[] = [];
      if (result.effectsChange && result.effectsChange.length > 0) {
        result.effectsChange.forEach((eff) => {
          if (eff.change > 0) {
            const displayVal = eff.target === 'letter_multiplier' || eff.target === 'aura_free_window'
              ? `+${eff.change.toFixed(1)}`
              : `+${Math.floor(eff.change)}`;
            changes.push(`${eff.description} ${displayVal}`);
          }
        });
      }
      if (result.auraCost && result.auraCost.change !== 0) {
        const sign = result.auraCost.change > 0 ? '+' : '';
        changes.push(`灵气消耗 ${sign}${result.auraCost.change}`);
      }
      if (result.cooldown && result.cooldown.change !== 0) {
        const sign = result.cooldown.change > 0 ? '+' : '';
        changes.push(`冷却 ${sign}${result.cooldown.change}s`);
      }
      const changeStr = changes.length > 0 ? `\n📈 ${changes.join(' | ')}` : '';
      showToast({
        type: 'success',
        message: `${skill.name} 升级到 Lv.${result.newLevel}！${changeStr}`,
        duration: 3500,
      });
      if (result.branchAvailable && !result.selectedBranch) {
        setTimeout(() => {
          showToast({
            type: 'info',
            message: `🌟 ${skill.name} 已可选择分支强化！`,
            duration: 3000,
          });
        }, 1000);
      }
    } else {
      const err = useSkillStore.getState().error;
      if (err) showToast({ type: 'error', message: err });
    }
  };

  const handleBranch = async (skill: Skill, branch: 'path_a' | 'path_b') => {
    if (!user?.id) return;
    const result = await selectBranch(user.id, skill.id, branch);
    if (result) {
      const changes: string[] = [];
      if (result.effects && result.effects.length > 0) {
        result.effects.forEach((eff) => {
          const displayVal = eff.target === 'letter_multiplier' || eff.target === 'aura_free_window'
            ? `x${eff.value.toFixed(1)}`
            : `+${Math.floor(eff.value)}`;
          changes.push(`${eff.description} ${displayVal}`);
        });
      }
      if (result.auraCost !== undefined && result.auraCost !== skill.baseAuraCost) {
        const diff = result.auraCost - skill.baseAuraCost;
        const sign = diff > 0 ? '+' : '';
        changes.push(`灵气 ${sign}${diff}`);
      }
      if (result.cooldown !== undefined && result.cooldown !== skill.baseCooldown) {
        const diff = result.cooldown - skill.baseCooldown;
        const sign = diff > 0 ? '+' : '';
        changes.push(`冷却 ${sign}${diff}s`);
      }
      const changeStr = changes.length > 0 ? `\n✨ ${changes.join(' | ')}` : '';
      showToast({
        type: 'success',
        message: `${skill.name} 已选择「${result.branchInfo.name}」之道！${changeStr}`,
        duration: 3500,
      });
    }
  };

  const categories = treeData?.categories || [];
  const allSkills = treeData?.skills || [];
  const progressMap = new Map((treeData?.userProgress || []).map((p) => [p.skillId, p]));

  const filteredSkills = activeCategory === 'all' ? allSkills : allSkills.filter((s) => s.category === activeCategory);

  const checkPrereqMet = (skill: Skill): boolean => {
    for (const pid of skill.prerequisites) {
      const p = progressMap.get(pid);
      if (!p || p.level < 1) return false;
    }
    return true;
  };

  const skillsByCategory = (cat: SkillCategory) => allSkills.filter((s) => s.category === cat);

  const categoryStats = (cat: SkillCategory) => {
    const list = skillsByCategory(cat);
    const unlocked = list.filter((s) => progressMap.get(s.id)?.level).length;
    const totalLevels = list.reduce((sum, s) => sum + (progressMap.get(s.id)?.level || 0), 0);
    return { count: list.length, unlocked, totalLevels };
  };

  const starProgress = treeData?.starProgress;
  const nextProgressPercent = starProgress
    ? Math.min(100, ((starProgress.current - (starProgress.next - 50)) / 50) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif-sc font-bold bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 bg-clip-text text-transparent mb-2">
            ✦ 星辰功法阁 ✦
          </h1>
          <p className="text-white/60">修炼星界秘术，成就大道可期</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 bg-gradient-to-br from-indigo-950/80 to-purple-950/80 backdrop-blur rounded-3xl border border-indigo-500/20 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-serif-sc font-bold text-white mb-1">🌟 修炼总览</h2>
                <p className="text-sm text-white/60">用户等级 Lv.{treeData?.userLevel || 1}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <div className="text-3xl font-bold text-amber-300 tabular-nums">
                    {treeData?.availableSkillPoints ?? 0}
                  </div>
                  <div className="text-xs text-amber-400/80">可用技能点</div>
                </div>
                <div className="text-center px-4 py-2 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-300 tabular-nums">
                    {treeData?.totalSkillPoints ?? 0}
                  </div>
                  <div className="text-xs text-purple-400/80">累计获得</div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/70">⭐ 星尘进度</span>
                <span className="text-amber-300 font-medium tabular-nums">
                  {starProgress?.current ?? 0} / {starProgress?.next ?? 50} 星尘 (+1技能点)
                </span>
              </div>
              <div className="relative h-3 bg-indigo-950/80 rounded-full overflow-hidden border border-amber-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 transition-all duration-700 relative"
                  style={{ width: `${nextProgressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-white/50 mt-1">提示：完成成就任务可获得星尘</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const stats = categoryStats(cat.key);
                const active = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(active ? 'all' : cat.key)}
                    className={`p-4 rounded-2xl transition-all text-left border-2 ${
                      active
                        ? 'bg-white/10 border-white/40 scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    style={{
                      boxShadow: active ? `0 0 25px ${cat.color}40` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <h3 className="font-bold text-white">{cat.name}</h3>
                    </div>
                    <p className="text-xs text-white/60 mb-2 line-clamp-2">{cat.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{stats.unlocked}/{stats.count}</span>
                      <span className="font-bold tabular-nums" style={{ color: cat.color }}>
                        {stats.totalLevels}级
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <AuraBar aura={aura} />

            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border-indigo-400/50 scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌌</span>
                <div>
                  <h3 className="font-bold text-white">全部功法</h3>
                  <p className="text-xs text-white/60">
                    {allSkills.filter((s) => progressMap.get(s.id)?.level).length} / {allSkills.length} 已解锁
                  </p>
                </div>
              </div>
            </button>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 border border-rose-500/20">
              <h3 className="font-bold text-rose-300 mb-3 flex items-center gap-2">
                <span>💡</span> 修炼指南
              </h3>
              <ul className="space-y-2 text-xs text-white/70">
                <li>• 完成成就任务可获得<span className="text-amber-300 font-bold"> 星尘</span></li>
                <li>• 每 50 星尘可获得 <span className="text-amber-300 font-bold">1 技能点</span></li>
                <li>• 每门功法在指定等级可选择<span className="text-purple-300 font-bold"> 分支强化</span></li>
                <li>• 战斗时使用技能需消耗 <span className="text-emerald-300 font-bold">星灵气</span></li>
                <li>• 灵气不足请耐心等待 <span className="text-emerald-300 font-bold">自动恢复</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {(activeCategory === 'all' ? categories : categories.filter((c) => c.key === activeCategory)).map((cat) => {
            const skills = skillsByCategory(cat.key);
            if (skills.length === 0) return null;
            return (
              <div key={cat.key}>
                <div
                  className="flex items-center gap-3 mb-5 pb-3 border-b-2"
                  style={{ borderColor: `${cat.color}40` }}
                >
                  <span className="text-4xl">{cat.icon}</span>
                  <div>
                    <h2
                      className="text-2xl font-serif-sc font-bold"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </h2>
                    <p className="text-sm text-white/60">{cat.description}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {(() => {
                      const s = categoryStats(cat.key);
                      const totalPossible = skills.reduce((sum, x) => sum + x.maxLevel, 0);
                      const pct = totalPossible > 0 ? (s.totalLevels / totalPossible) * 100 : 0;
                      return (
                        <div className="text-right">
                          <div className="text-xs text-white/60">
                            进度 {s.totalLevels}/{totalPossible}
                          </div>
                          <div className="w-32 h-2 bg-indigo-950/60 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cat.color,
                                boxShadow: `0 0 8px ${cat.color}`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {skills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      progress={progressMap.get(skill.id) || null}
                      userLevel={treeData?.userLevel || 1}
                      availablePoints={treeData?.availableSkillPoints || 0}
                      onUpgrade={() => handleUpgrade(skill)}
                      onSelectBranch={(b) => handleBranch(skill, b)}
                      prereqMet={checkPrereqMet(skill)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div className="px-8 py-5 bg-indigo-950/90 rounded-2xl border border-indigo-400/30 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-white font-bold">修炼中...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillTreePage;
