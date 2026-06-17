import { create } from 'zustand';
import { skillsApi, type CombatButtonDataAPI, type CombatData, type UpgradeResult, type BranchResult } from '@/api/skills';
import type {
  SkillTreeData,
  UserSkillOverview,
  CombatTrigger,
  SkillBranch,
  UserAuraState,
  SkillUseResult,
} from '@/types';

interface SkillState {
  treeData: SkillTreeData | null;
  overview: UserSkillOverview | null;
  combatData: Record<CombatTrigger, CombatData | null>;
  aura: UserAuraState | null;
  isLoading: boolean;
  error: string | null;
  lastUseResult: SkillUseResult | null;

  fetchTreeData: (userId: string) => Promise<void>;
  fetchOverview: (userId: string) => Promise<void>;
  fetchCombatButtons: (userId: string, trigger: CombatTrigger) => Promise<void>;
  upgradeSkill: (userId: string, skillId: string) => Promise<UpgradeResult | null>;
  selectBranch: (userId: string, skillId: string, branch: SkillBranch) => Promise<BranchResult | null>;
  useSkill: (userId: string, skillId: string, trigger: CombatTrigger, targetId?: string) => Promise<SkillUseResult | null>;
  refreshAura: (userId: string) => Promise<void>;
  clearError: () => void;
}

const useSkillStore = create<SkillState>()((set, get) => ({
  treeData: null,
  overview: null,
  combatData: {
    write_letter: null,
    reply: null,
    favorite: null,
    browse: null,
  },
  aura: null,
  isLoading: false,
  error: null,
  lastUseResult: null,

  fetchTreeData: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await skillsApi.getSkillTree(userId);
      if (res.data.success && res.data.data) {
        set({ treeData: res.data.data, aura: res.data.data.aura });
      }
    } catch (e: any) {
      set({ error: e.response?.data?.message || '获取技能树失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOverview: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await skillsApi.getOverview(userId);
      if (res.data.success && res.data.data) {
        set({ overview: res.data.data, aura: res.data.data.aura });
      }
    } catch (e: any) {
      set({ error: e.response?.data?.message || '获取技能概览失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCombatButtons: async (userId, trigger) => {
    try {
      const res = await skillsApi.getCombatButtons(userId, trigger);
      if (res.data.success && res.data.data) {
        set((state) => ({
          combatData: { ...state.combatData, [trigger]: res.data.data! },
          aura: res.data.data!.aura,
        }));
      }
    } catch (e: any) {
      set({ error: e.response?.data?.message || '获取战斗按钮失败' });
    }
  },

  upgradeSkill: async (userId, skillId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await skillsApi.upgradeSkill(userId, skillId);
      if (res.data.success && res.data.data) {
        await get().fetchTreeData(userId);
        return res.data.data;
      }
      return null;
    } catch (e: any) {
      set({ error: e.response?.data?.message || '技能升级失败' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  selectBranch: async (userId, skillId, branch) => {
    set({ isLoading: true, error: null });
    try {
      const res = await skillsApi.selectBranch(userId, skillId, branch);
      if (res.data.success && res.data.data) {
        await get().fetchTreeData(userId);
        return res.data.data;
      }
      return null;
    } catch (e: any) {
      set({ error: e.response?.data?.message || '选择分支失败' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  useSkill: async (userId, skillId, trigger, targetId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await skillsApi.useSkill(userId, { userId, skillId, trigger, targetId });
      if (res.data.success && res.data.data) {
        const result = res.data.data;
        const newAura = get().aura ? { ...get().aura! } : { current: 0, max: 100, regenRate: 2, lastRegenAt: new Date().toISOString() };
        newAura.current = result.auraRemaining;
        newAura.lastRegenAt = new Date().toISOString();
        set({ aura: newAura, lastUseResult: result });
        await get().fetchCombatButtons(userId, trigger);
        return result;
      }
      return null;
    } catch (e: any) {
      set({ error: e.response?.data?.message || '释放技能失败' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshAura: async (userId) => {
    try {
      const res = await skillsApi.getOverview(userId);
      if (res.data.success && res.data.data) {
        set({ aura: res.data.data.aura });
      }
    } catch {
    }
  },

  clearError: () => set({ error: null }),
}));

export default useSkillStore;
