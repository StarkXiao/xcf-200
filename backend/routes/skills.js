const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

function getSkillData() {
  return readJSON('skills.json') || { categories: [], skills: [] };
}

function getUserSkillData() {
  return readJSON('user-skills.json') || { userSkills: [] };
}

function getCooldownData() {
  return readJSON('cooldowns.json') || { cooldowns: [] };
}

function getUserStats(userId) {
  const userAchievements = readJSON('user-achievements.json') || { userAchievements: [] };
  const record = userAchievements.userAchievements.find(u => u.userId === userId);
  const totalStars = record?.totalStars || 0;
  const skillPoints = Math.floor(totalStars / 50);
  const nextThreshold = (skillPoints + 1) * 50;
  return { totalStars, skillPoints, nextThreshold };
}

function getUserLevel(totalStars) {
  const levels = [
    { min: 0, level: 1 },
    { min: 50, level: 2 },
    { min: 150, level: 3 },
    { min: 300, level: 4 },
    { min: 500, level: 5 },
    { min: 800, level: 6 },
    { min: 1200, level: 7 },
    { min: 1800, level: 8 },
    { min: 2500, level: 9 },
    { min: 3500, level: 10 }
  ];
  let currentLevel = 1;
  for (const lv of levels) {
    if (totalStars >= lv.min) currentLevel = lv.level;
  }
  return currentLevel;
}

function computeEffectiveAura(skill, progress, userProgress) {
  let base = skill.baseAuraCost;
  if (progress?.selectedBranch && skill.branches) {
    const branch = skill.branches.find(b => b.id === progress.selectedBranch);
    if (branch?.auraCostModifier) base += branch.auraCostModifier;
  }
  const wardenSkill = userProgress.find(p => p.skillId === 'warden_1');
  if (skill.id !== 'warden_1' && wardenSkill?.level) {
    const wardenDef = getSkillData().skills.find(s => s.id === 'warden_1');
    if (wardenDef) {
      let regenBonus = wardenDef.effects[1].value + wardenDef.effects[1].scalePerLevel * (wardenSkill.level - 1);
      if (wardenSkill.selectedBranch && wardenDef.branches) {
        const branch = wardenDef.branches.find(b => b.id === wardenSkill.selectedBranch);
        if (branch?.effectModifier?.value && branch.id === 'path_b') {
          regenBonus += branch.effectModifier.value;
        }
      }
      const auraDiscountPercent = Math.min(30, regenBonus * 2);
      base = Math.max(0, Math.floor(base * (100 - auraDiscountPercent) / 100));
    }
  }
  return Math.max(0, base);
}

function computeEffectiveCooldown(skill, progress, userProgress) {
  let base = skill.baseCooldown;
  if (progress?.selectedBranch && skill.branches) {
    const branch = skill.branches.find(b => b.id === progress.selectedBranch);
    if (branch?.cooldownModifier) base += branch.cooldownModifier;
  }
  const chronosSkill = userProgress.find(p => p.skillId === 'chronos_1');
  if (chronosSkill?.level) {
    const chronosProgress = chronosSkill;
    const chronosRecord = getSkillData().skills.find(s => s.id === 'chronos_1');
    if (chronosRecord) {
      let reduce = chronosRecord.effects[0].value + chronosRecord.effects[0].scalePerLevel * (chronosProgress.level - 1);
      if (chronosProgress.selectedBranch && chronosRecord.branches) {
        const branch = chronosRecord.branches.find(b => b.id === chronosProgress.selectedBranch);
        if (branch?.effectModifier?.value) reduce += branch.effectModifier.value;
      }
      base = Math.max(0, base - reduce);
    }
  }
  return Math.max(0, base);
}

function computeEffectiveEffects(skill, progress) {
  const level = progress?.level || 1;
  return skill.effects.map(eff => {
    let value = eff.value + eff.scalePerLevel * (level - 1);
    if (progress?.selectedBranch && skill.branches) {
      const branch = skill.branches.find(b => b.id === progress.selectedBranch);
      if (branch?.effectModifier?.value) value += branch.effectModifier.value;
      if (branch?.effectModifier?.scalePerLevel) value += branch.effectModifier.scalePerLevel * (level - 1);
    }
    return { ...eff, value };
  });
}

function computeUpgradeCost(skill, currentLevel) {
  const base = 1;
  const rarityMultiplier = skill.rarity === 'legendary' ? 4 : skill.rarity === 'epic' ? 3 : skill.rarity === 'rare' ? 2 : 1;
  return base * rarityMultiplier * (currentLevel + 1);
}

function getOrCreateUserRecord(userId) {
  const data = getUserSkillData();
  let record = data.userSkills.find(u => u.userId === userId);
  if (!record) {
    record = {
      userId,
      skills: [],
      aura: {
        current: 100,
        max: 100,
        regenRate: 2,
        lastRegenAt: new Date().toISOString()
      },
      skillPoints: 0,
      usedSkillPoints: 0,
      auraFreeUntil: null
    };
    data.userSkills.push(record);
    writeJSON('user-skills.json', data);
  }
  return record;
}

function regenAura(aura) {
  const now = Date.now();
  const last = new Date(aura.lastRegenAt).getTime();
  const seconds = Math.floor((now - last) / 1000);
  if (seconds > 0) {
    const regen = Math.floor(seconds * aura.regenRate);
    aura.current = Math.min(aura.max, aura.current + regen);
    aura.lastRegenAt = new Date().toISOString();
  }
  return aura;
}

router.get('/tree/:userId', (req, res) => {
  const { userId } = req.params;
  const skillData = getSkillData();
  const userRecord = getOrCreateUserRecord(userId);
  const userStats = getUserStats(userId);
  const userLevel = getUserLevel(userStats.totalStars);

  userRecord.aura = regenAura(userRecord.aura);
  const wardenSkill = userRecord.skills.find(s => s.skillId === 'warden_1');
  if (wardenSkill) {
    const wardenDef = skillData.skills.find(s => s.id === 'warden_1');
    if (wardenDef) {
      let maxBonus = wardenDef.effects[0].value + wardenDef.effects[0].scalePerLevel * (wardenSkill.level - 1);
      let regenBonus = wardenDef.effects[1].value + wardenDef.effects[1].scalePerLevel * (wardenSkill.level - 1);
      if (wardenSkill.selectedBranch && wardenDef.branches) {
        const branch = wardenDef.branches.find(b => b.id === wardenSkill.selectedBranch);
        if (branch?.effectModifier?.value) {
          if (branch.id === 'path_a') maxBonus += branch.effectModifier.value;
          if (branch.id === 'path_b') regenBonus += branch.effectModifier.value;
        }
      }
      userRecord.aura.max = 100 + maxBonus;
      userRecord.aura.regenRate = 2 + regenBonus;
      if (userRecord.aura.current > userRecord.aura.max) userRecord.aura.current = userRecord.aura.max;
    }
  }

  const availablePoints = userStats.skillPoints - userRecord.usedSkillPoints;

  res.json({
    success: true,
    data: {
      categories: skillData.categories,
      skills: skillData.skills,
      userProgress: userRecord.skills,
      aura: userRecord.aura,
      userLevel,
      totalSkillPoints: userStats.skillPoints,
      usedSkillPoints: userRecord.usedSkillPoints,
      availableSkillPoints: Math.max(0, availablePoints),
      starProgress: {
        current: userStats.totalStars,
        next: userStats.nextThreshold
      }
    }
  });
});

router.post('/upgrade/:userId/:skillId', (req, res) => {
  const { userId, skillId } = req.params;
  const skillData = getSkillData();
  const userSkillData = getUserSkillData();
  const skill = skillData.skills.find(s => s.id === skillId);

  if (!skill) return res.status(404).json({ success: false, message: '技能不存在' });

  const userRecord = userSkillData.userSkills.find(u => u.userId === userId);
  if (!userRecord) return res.status(404).json({ success: false, message: '用户数据不存在' });

  const userStats = getUserStats(userId);
  const userLevel = getUserLevel(userStats.totalStars);

  if (skill.unlockLevel > userLevel) {
    return res.status(400).json({ success: false, message: `需要用户等级 ${skill.unlockLevel} 才能解锁此技能` });
  }

  for (const prereqId of skill.prerequisites) {
    const prereqProgress = userRecord.skills.find(s => s.skillId === prereqId);
    const prereqSkill = skillData.skills.find(s => s.id === prereqId);
    if (!prereqProgress || prereqProgress.level < 1) {
      return res.status(400).json({ success: false, message: `需要先学习技能: ${prereqSkill?.name || prereqId}` });
    }
  }

  let progress = userRecord.skills.find(s => s.skillId === skillId);
  const currentLevel = progress?.level || 0;
  const upgradeCost = computeUpgradeCost(skill, currentLevel);
  const availablePoints = userStats.skillPoints - userRecord.usedSkillPoints;

  if (currentLevel >= skill.maxLevel) {
    return res.status(400).json({ success: false, message: '技能已达到最高等级' });
  }

  if (availablePoints < upgradeCost) {
    return res.status(400).json({ success: false, message: `技能点不足，需要 ${upgradeCost} 点` });
  }

  if (!progress) {
    progress = {
      skillId,
      level: 1,
      selectedBranch: null,
      unlockedAt: new Date().toISOString(),
      upgradedAt: new Date().toISOString(),
      totalUsed: 0
    };
    userRecord.skills.push(progress);
  } else {
    progress.level += 1;
    progress.upgradedAt = new Date().toISOString();
  }

  userRecord.usedSkillPoints += upgradeCost;
  writeJSON('user-skills.json', userSkillData);

  const newLevel = progress.level;
  const branchAvailable = skill.branches && newLevel >= (skill.branchUnlockLevel || 3);
  const nextUpgradeCost = newLevel < skill.maxLevel ? computeUpgradeCost(skill, newLevel) : null;
  const prevProgress = { ...progress, level: newLevel - 1 };
  const prevAuraCost = computeEffectiveAura(skill, prevProgress, userRecord.skills);
  const newAuraCost = computeEffectiveAura(skill, progress, userRecord.skills);
  const prevCooldown = computeEffectiveCooldown(skill, prevProgress, userRecord.skills);
  const newCooldown = computeEffectiveCooldown(skill, progress, userRecord.skills);
  const prevEffects = computeEffectiveEffects(skill, prevProgress);
  const newEffects = computeEffectiveEffects(skill, progress);

  res.json({
    success: true,
    message: `${skill.name} 升级成功！当前等级 ${newLevel}`,
    data: {
      skillId,
      newLevel,
      maxLevel: skill.maxLevel,
      upgradeCost,
      remainingPoints: userStats.skillPoints - userRecord.usedSkillPoints,
      branchAvailable,
      branches: branchAvailable ? skill.branches : null,
      selectedBranch: progress.selectedBranch,
      nextUpgradeCost,
      effects: newEffects,
      prevEffects,
      auraCost: {
        previous: prevAuraCost,
        current: newAuraCost,
        change: newAuraCost - prevAuraCost
      },
      cooldown: {
        previous: prevCooldown,
        current: newCooldown,
        change: newCooldown - prevCooldown
      },
      effectsChange: newEffects.map((eff, i) => ({
        ...eff,
        previousValue: prevEffects[i]?.value || 0,
        change: eff.value - (prevEffects[i]?.value || 0)
      }))
    }
  });
});

router.post('/branch/:userId/:skillId', (req, res) => {
  const { userId, skillId } = req.params;
  const { branch } = req.body;
  const skillData = getSkillData();
  const userSkillData = getUserSkillData();
  const skill = skillData.skills.find(s => s.id === skillId);

  if (!skill) return res.status(404).json({ success: false, message: '技能不存在' });
  if (!skill.branches) return res.status(400).json({ success: false, message: '此技能没有分支' });

  const userRecord = userSkillData.userSkills.find(u => u.userId === userId);
  if (!userRecord) return res.status(404).json({ success: false, message: '用户数据不存在' });

  const progress = userRecord.skills.find(s => s.skillId === skillId);
  if (!progress) return res.status(400).json({ success: false, message: '请先学习此技能' });

  if (progress.level < (skill.branchUnlockLevel || 3)) {
    return res.status(400).json({ success: false, message: `需要等级 ${skill.branchUnlockLevel || 3} 才能选择分支` });
  }

  const validBranch = skill.branches.find(b => b.id === branch);
  if (!validBranch) return res.status(400).json({ success: false, message: '无效的分支选项' });

  progress.selectedBranch = branch;
  writeJSON('user-skills.json', userSkillData);

  res.json({
    success: true,
    message: `${skill.name} 已选择「${validBranch.name}」之道`,
    data: {
      skillId,
      selectedBranch: branch,
      branchInfo: validBranch,
      effects: computeEffectiveEffects(skill, progress),
      auraCost: computeEffectiveAura(skill, progress, userRecord.skills),
      cooldown: computeEffectiveCooldown(skill, progress, userRecord.skills)
    }
  });
});

router.get('/combat/:userId/:trigger', (req, res) => {
  const { userId, trigger } = req.params;
  const skillData = getSkillData();
  const cooldownData = getCooldownData();
  const userRecord = getOrCreateUserRecord(userId);
  const now = Date.now();

  userRecord.aura = regenAura(userRecord.aura);

  const validTriggers = ['write_letter', 'reply', 'favorite', 'browse'];
  if (!validTriggers.includes(trigger)) {
    return res.status(400).json({ success: false, message: '无效的触发场景' });
  }

  const availableSkills = skillData.skills.filter(s => s.combatTrigger.includes(trigger));
  const activeCooldowns = cooldownData.cooldowns.filter(c => c.userId === userId);

  const auraFreeActive = userRecord.auraFreeUntil && new Date(userRecord.auraFreeUntil).getTime() > now;

  const combatButtons = availableSkills.map(skill => {
    const progress = userRecord.skills.find(s => s.skillId === skill.id);
    const isUnlocked = progress && progress.level >= 1;
    const level = progress?.level || 0;
    const effectiveAura = computeEffectiveAura(skill, progress, userRecord.skills);
    const effectiveCooldown = computeEffectiveCooldown(skill, progress, userRecord.skills);
    const finalAuraCost = auraFreeActive ? 0 : effectiveAura;

    const cooldownRecord = activeCooldowns.find(c => c.skillId === skill.id);
    const cooldownEndTime = cooldownRecord ? new Date(cooldownRecord.endsAt).getTime() : 0;
    const isOnCooldown = cooldownEndTime > now;
    const cooldownRemaining = isOnCooldown ? Math.ceil((cooldownEndTime - now) / 1000) : 0;

    return {
      skillId: skill.id,
      skillName: skill.name,
      icon: skill.icon,
      color: skill.color,
      category: skill.category,
      rarity: skill.rarity,
      level,
      maxLevel: skill.maxLevel,
      selectedBranch: progress?.selectedBranch || null,
      isUnlocked,
      baseAuraCost: skill.baseAuraCost,
      effectiveAuraCost: effectiveAura,
      finalAuraCost,
      baseCooldown: skill.baseCooldown,
      effectiveCooldown,
      isOnCooldown,
      cooldownRemaining,
      hasEnoughAura: userRecord.aura.current >= finalAuraCost,
      canUse: isUnlocked && !isOnCooldown && userRecord.aura.current >= finalAuraCost,
      effects: isUnlocked ? computeEffectiveEffects(skill, progress) : skill.effects,
      description: skill.description,
      auraFreeActive
    };
  });

  const userSkillData = require('../utils/db').readJSON('user-skills.json');
  if (userSkillData) {
    writeJSON('user-skills.json', userSkillData);
  }

  res.json({
    success: true,
    data: {
      trigger,
      aura: userRecord.aura,
      auraFreeActive,
      auraFreeRemaining: auraFreeActive ? Math.ceil((new Date(userRecord.auraFreeUntil).getTime() - now) / 1000) : 0,
      combatButtons: combatButtons.sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
        return a.effectiveAuraCost - b.effectiveAuraCost;
      })
    }
  });
});

router.post('/use/:userId', (req, res) => {
  const { userId } = req.params;
  const { skillId, trigger, targetId } = req.body;
  const skillData = getSkillData();
  const userSkillData = getUserSkillData();
  const cooldownData = getCooldownData();
  const now = Date.now();

  const skill = skillData.skills.find(s => s.id === skillId);
  if (!skill) return res.status(404).json({ success: false, message: '技能不存在' });
  if (!skill.combatTrigger.includes(trigger)) {
    return res.status(400).json({ success: false, message: '此技能不能在该场景使用' });
  }

  const userRecord = userSkillData.userSkills.find(u => u.userId === userId);
  if (!userRecord) return res.status(404).json({ success: false, message: '用户数据不存在' });

  const progress = userRecord.skills.find(s => s.skillId === skillId);
  if (!progress || progress.level < 1) {
    return res.status(400).json({ success: false, message: '技能未解锁' });
  }

  userRecord.aura = regenAura(userRecord.aura);

  const activeCooldown = cooldownData.cooldowns.find(c => c.userId === userId && c.skillId === skillId);
  if (activeCooldown && new Date(activeCooldown.endsAt).getTime() > now) {
    const remain = Math.ceil((new Date(activeCooldown.endsAt).getTime() - now) / 1000);
    return res.status(400).json({ success: false, message: `技能冷却中，还需 ${remain} 秒` });
  }

  const auraFreeActive = userRecord.auraFreeUntil && new Date(userRecord.auraFreeUntil).getTime() > now;
  const effectiveAura = computeEffectiveAura(skill, progress, userRecord.skills);
  const finalCost = auraFreeActive ? 0 : effectiveAura;

  if (userRecord.aura.current < finalCost) {
    return res.status(400).json({ success: false, message: `灵气不足，需要 ${finalCost} 点` });
  }

  userRecord.aura.current -= finalCost;
  progress.totalUsed = (progress.totalUsed || 0) + 1;

  const effectiveCooldown = computeEffectiveCooldown(skill, progress, userRecord.skills);
  const cooldownEndsAt = new Date(now + effectiveCooldown * 1000).toISOString();

  let existingCdIdx = cooldownData.cooldowns.findIndex(c => c.userId === userId && c.skillId === skillId);
  if (existingCdIdx >= 0) {
    cooldownData.cooldowns[existingCdIdx].endsAt = cooldownEndsAt;
  } else {
    cooldownData.cooldowns.push({ userId, skillId, endsAt: cooldownEndsAt });
  }
  cooldownData.cooldowns = cooldownData.cooldowns.filter(c => new Date(c.endsAt).getTime() > now || c.skillId === skillId);

  const effects = computeEffectiveEffects(skill, progress);

  let message = `释放了「${skill.name}」！`;
  for (const eff of effects) {
    if (eff.target === 'aura_restore') {
      userRecord.aura.current = Math.min(userRecord.aura.max, userRecord.aura.current + eff.value);
      message += ` 恢复 ${eff.value} 灵气！`;
    }
    if (eff.target === 'reset_cooldown') {
      let resetCount = eff.value;
      const userCds = cooldownData.cooldowns.filter(c => c.userId === userId && c.skillId !== skillId);
      for (const cd of userCds) {
        if (resetCount <= 0) break;
        cd.endsAt = new Date().toISOString();
        resetCount--;
      }
      message += ` 重置了 ${eff.value - resetCount} 个技能冷却！`;
    }
    if (eff.target === 'aura_free_window') {
      userRecord.auraFreeUntil = new Date(now + eff.value * 1000).toISOString();
      message += ` 进入灵气免费状态 ${eff.value} 秒！`;
    }
    if (eff.target === 'aura_gain') {
      userRecord.aura.current = Math.min(userRecord.aura.max, userRecord.aura.current + eff.value);
      message += ` 获得 ${eff.value} 灵气！`;
    }
    if (eff.target === 'browse_aura') {
      userRecord.aura.current = Math.min(userRecord.aura.max, userRecord.aura.current + eff.value);
      message += ` 共鸣获得 ${eff.value} 灵气！`;
    }
  }

  writeJSON('user-skills.json', userSkillData);
  writeJSON('cooldowns.json', cooldownData);

  res.json({
    success: true,
    message,
    data: {
      skillId,
      skillName: skill.name,
      effects,
      auraSpent: finalCost,
      auraRemaining: userRecord.aura.current,
      auraMax: userRecord.aura.max,
      cooldownEndsAt,
      cooldownSeconds: effectiveCooldown,
      trigger,
      targetId: targetId || null,
      level: progress.level,
      branch: progress.selectedBranch
    }
  });
});

router.get('/overview/:userId', (req, res) => {
  const { userId } = req.params;
  const skillData = getSkillData();
  const userRecord = getOrCreateUserRecord(userId);
  const userStats = getUserStats(userId);
  const userLevel = getUserLevel(userStats.totalStars);

  userRecord.aura = regenAura(userRecord.aura);

  const categoryBreakdown = {};
  for (const cat of skillData.categories) {
    const catSkills = skillData.skills.filter(s => s.category === cat.key);
    const unlocked = catSkills.filter(s => userRecord.skills.find(u => u.skillId === s.id && u.level >= 1));
    const totalLevels = unlocked.reduce((sum, s) => sum + (userRecord.skills.find(u => u.skillId === s.id)?.level || 0), 0);
    categoryBreakdown[cat.key] = {
      unlocked: unlocked.length,
      total: catSkills.length,
      totalLevels
    };
  }

  const maxLeveled = skillData.skills.filter(s => {
    const p = userRecord.skills.find(u => u.skillId === s.id);
    return p && p.level >= s.maxLevel;
  }).length;

  const activeBranches = userRecord.skills.filter(s => s.selectedBranch).length;
  const availablePoints = userStats.skillPoints - userRecord.usedSkillPoints;

  res.json({
    success: true,
    data: {
      userId,
      aura: userRecord.aura,
      userLevel,
      totalUnlocked: userRecord.skills.filter(s => s.level >= 1).length,
      totalSkills: skillData.skills.length,
      totalMaxLeveled: maxLeveled,
      activeBranches,
      totalSkillPoints: userStats.skillPoints,
      availableSkillPoints: Math.max(0, availablePoints),
      usedSkillPoints: userRecord.usedSkillPoints,
      starProgress: {
        current: userStats.totalStars,
        next: userStats.nextThreshold,
        points: Math.max(0, availablePoints)
      },
      categoryBreakdown
    }
  });
});

module.exports = router;
