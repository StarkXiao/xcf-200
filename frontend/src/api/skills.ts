import api from '@/utils/api';
import type {
  ApiResponse,
  SkillTreeData,
  UserSkillOverview,
  CombatTrigger,
  SkillBranch,
  SkillUseRequest,
  SkillUseResult,
} from '@/types';

export interface CombatButtonDataAPI {
  skillId: string;
  skillName: string;
  icon: string;
  color: string;
  category: string;
  rarity: string;
  level: number;
  maxLevel: number;
  selectedBranch: SkillBranch;
  isUnlocked: boolean;
  baseAuraCost: number;
  effectiveAuraCost: number;
  finalAuraCost: number;
  baseCooldown: number;
  effectiveCooldown: number;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  hasEnoughAura: boolean;
  canUse: boolean;
  effects: Array<{
    type: string;
    target: string;
    value: number;
    scalePerLevel: number;
    description: string;
  }>;
  description: string;
  auraFreeActive: boolean;
}

export interface CombatData {
  trigger: CombatTrigger;
  aura: {
    current: number;
    max: number;
    regenRate: number;
    lastRegenAt: string;
  };
  auraFreeActive: boolean;
  auraFreeRemaining: number;
  combatButtons: CombatButtonDataAPI[];
}

export interface UpgradeResult {
  skillId: string;
  newLevel: number;
  maxLevel: number;
  upgradeCost: number;
  remainingPoints: number;
  branchAvailable: boolean;
  branches: SkillBranch[] | null;
  selectedBranch: SkillBranch;
  nextUpgradeCost: number | null;
  effects: Array<{
    type: string;
    target: string;
    value: number;
    scalePerLevel: number;
    description: string;
  }>;
  auraCost: {
    previous: number;
    current: number;
    change: number;
  };
  cooldown: {
    previous: number;
    current: number;
    change: number;
  };
  effectsChange: Array<{
    type: string;
    target: string;
    value: number;
    scalePerLevel: number;
    description: string;
    previousValue: number;
    change: number;
  }>;
}

export interface BranchResult {
  skillId: string;
  selectedBranch: SkillBranch;
  branchInfo: {
    id: SkillBranch;
    name: string;
    description: string;
    icon: string;
    effectModifier: Partial<{
      type: string;
      target: string;
      value: number;
      scalePerLevel: number;
      description: string;
    }>;
    auraCostModifier?: number;
    cooldownModifier?: number;
  };
  effects: Array<{
    type: string;
    target: string;
    value: number;
    scalePerLevel: number;
    description: string;
  }>;
  auraCost: number;
  cooldown: number;
}

export const skillsApi = {
  getSkillTree: (userId: string) =>
    api.get<ApiResponse<SkillTreeData>>(`/skills/tree/${userId}`),

  getOverview: (userId: string) =>
    api.get<ApiResponse<UserSkillOverview>>(`/skills/overview/${userId}`),

  upgradeSkill: (userId: string, skillId: string) =>
    api.post<ApiResponse<UpgradeResult>>(`/skills/upgrade/${userId}/${skillId}`),

  selectBranch: (userId: string, skillId: string, branch: SkillBranch) =>
    api.post<ApiResponse<BranchResult>>(`/skills/branch/${userId}/${skillId}`, { branch }),

  getCombatButtons: (userId: string, trigger: CombatTrigger) =>
    api.get<ApiResponse<CombatData>>(`/skills/combat/${userId}/${trigger}`),

  useSkill: (userId: string, data: SkillUseRequest) =>
    api.post<ApiResponse<SkillUseResult>>(`/skills/use/${userId}`, data),
};
