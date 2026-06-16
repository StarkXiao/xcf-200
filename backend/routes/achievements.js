const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

function getAchievementData() {
  return readJSON('achievements.json') || { tasks: [], badges: [], levels: [] };
}

function getUserAchievementData() {
  return readJSON('user-achievements.json') || { userAchievements: [] };
}

function getUserStats(userId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotion-records.json') || { emotionRecords: [] };
  const userData = readJSON('users.json') || { users: [] };

  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const totalSent = userLetters.length;
  const publicLetters = userLetters.filter(l => l.isPublic).length;
  const maxLikes = userLetters.reduce((max, l) => Math.max(max, l.likes || 0), 0);

  let totalRepliesReceived = 0;
  userLetters.forEach(l => {
    totalRepliesReceived += (l.replies || []).length;
  });

  const strangerReplyData = readJSON('notifications.json') || { notifications: [] };
  const strangerRepliesGiven = strangerReplyData.notifications.filter(
    n => n.type === 'stranger_reply_sent' && n.userId === userId
  ).length;

  const userEmotionRecords = emotionData.emotionRecords.filter(r => r.userId === userId);
  const totalEmotionRecords = userEmotionRecords.length;
  const uniqueEmotions = new Set(userEmotionRecords.map(r => r.emotion)).size;

  return {
    totalSent,
    publicLetters,
    maxLikes,
    totalRepliesReceived,
    strangerRepliesGiven,
    totalEmotionRecords,
    uniqueEmotions
  };
}

function computeTaskProgress(task, userStats) {
  switch (task.id) {
    case 'writing_1': return userStats.totalSent;
    case 'writing_2': return userStats.totalSent;
    case 'writing_3': return userStats.totalSent;
    case 'writing_4': return userStats.totalSent;
    case 'replying_1': return userStats.totalRepliesReceived;
    case 'replying_2': return userStats.totalRepliesReceived;
    case 'replying_3': return userStats.strangerRepliesGiven;
    case 'replying_4': return userStats.totalRepliesReceived;
    case 'sharing_1': return userStats.publicLetters;
    case 'sharing_2': return userStats.publicLetters;
    case 'sharing_3': return userStats.maxLikes;
    case 'sharing_4': return userStats.publicLetters;
    case 'emotion_1': return userStats.totalEmotionRecords;
    case 'emotion_2': return userStats.uniqueEmotions;
    case 'emotion_3': return userStats.totalEmotionRecords;
    case 'emotion_4': return userStats.uniqueEmotions;
    default: return 0;
  }
}

function computeTaskStatus(task, currentValue, completedTaskIds) {
  if (completedTaskIds.has(task.id)) return 'completed';
  const prereqsMet = task.prerequisiteTaskIds.every(pid => completedTaskIds.has(pid));
  if (!prereqsMet) return 'locked';
  if (currentValue >= task.targetValue) return 'completed';
  if (currentValue > 0) return 'in_progress';
  return 'available';
}

function getUserLevel(totalStars, levels) {
  let current = levels[0];
  let next = null;
  for (let i = 0; i < levels.length; i++) {
    if (totalStars >= levels[i].minStars) {
      current = levels[i];
      next = levels[i + 1] || null;
    }
  }
  let progress = 0;
  if (next) {
    const range = next.minStars - current.minStars;
    const gained = totalStars - current.minStars;
    progress = range > 0 ? Math.min(gained / range, 1) : 1;
  } else {
    progress = 1;
  }
  return { level: current, nextLevel: next, levelProgress: progress };
}

router.get('/center/:userId', (req, res) => {
  const { userId } = req.params;
  const achievementData = getAchievementData();
  const userAchievementData = getUserAchievementData();

  const userRecord = userAchievementData.userAchievements.find(u => u.userId === userId) || {
    userId,
    completedTaskIds: [],
    earnedBadgeIds: [],
    totalStars: 0,
    claimedRewards: []
  };

  const userStats = getUserStats(userId);
  const completedTaskIds = new Set(userRecord.completedTaskIds);
  const earnedBadgeIds = new Set(userRecord.earnedBadgeIds);

  const tasks = achievementData.tasks.map(task => {
    const currentValue = computeTaskProgress(task, userStats);
    const status = computeTaskStatus(task, currentValue, completedTaskIds);
    return {
      ...task,
      currentValue,
      status,
      completedAt: status === 'completed' ? (userRecord.claimedRewards?.find(r => r.taskId === task.id)?.claimedAt || null) : undefined
    };
  });

  let totalStars = 0;
  tasks.forEach(t => {
    if (t.status === 'completed') totalStars += t.rewardStars;
  });

  const badges = achievementData.badges.map(badge => ({
    ...badge,
    isEarned: earnedBadgeIds.has(badge.id) || tasks.some(t => t.status === 'completed' && t.rewardBadgeId === badge.id),
    earnedAt: userRecord.claimedRewards?.find(r => r.badgeId === badge.id)?.claimedAt || undefined
  }));

  const { level, nextLevel, levelProgress } = getUserLevel(totalStars, achievementData.levels);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const earnedBadges = badges.filter(b => b.isEarned).length;

  const categoryStats = {
    writing: { completed: 0, total: 0, stars: 0 },
    replying: { completed: 0, total: 0, stars: 0 },
    sharing: { completed: 0, total: 0, stars: 0 },
    emotion: { completed: 0, total: 0, stars: 0 }
  };

  tasks.forEach(t => {
    const cat = t.category;
    categoryStats[cat].total++;
    if (t.status === 'completed') {
      categoryStats[cat].completed++;
      categoryStats[cat].stars += t.rewardStars;
    }
  });

  const userProgress = {
    userId,
    totalStars,
    level,
    nextLevel,
    levelProgress,
    completedTasks,
    totalTasks: tasks.length,
    earnedBadges,
    totalBadges: badges.length,
    categoryStats
  };

  res.json({
    success: true,
    data: {
      userProgress,
      tasks,
      badges,
      levels: achievementData.levels
    }
  });
});

router.post('/claim/:userId/:taskId', (req, res) => {
  const { userId, taskId } = req.params;
  const achievementData = getAchievementData();
  const userAchievementData = getUserAchievementData();

  const task = achievementData.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: '任务不存在' });
  }

  let userRecord = userAchievementData.userAchievements.find(u => u.userId === userId);
  if (!userRecord) {
    userRecord = {
      userId,
      completedTaskIds: [],
      earnedBadgeIds: [],
      totalStars: 0,
      claimedRewards: []
    };
    userAchievementData.userAchievements.push(userRecord);
  }

  const completedTaskIds = new Set(userRecord.completedTaskIds);
  const userStats = getUserStats(userId);
  const currentValue = computeTaskProgress(task, userStats);
  const status = computeTaskStatus(task, currentValue, completedTaskIds);

  if (status !== 'completed') {
    return res.status(400).json({ success: false, message: '任务尚未完成，无法领取奖励' });
  }

  if (userRecord.claimedRewards?.some(r => r.taskId === taskId)) {
    return res.status(400).json({ success: false, message: '奖励已领取过' });
  }

  if (!userRecord.completedTaskIds.includes(taskId)) {
    userRecord.completedTaskIds.push(taskId);
  }

  if (task.rewardBadgeId && !userRecord.earnedBadgeIds.includes(task.rewardBadgeId)) {
    userRecord.earnedBadgeIds.push(task.rewardBadgeId);
  }

  if (!userRecord.claimedRewards) userRecord.claimedRewards = [];
  userRecord.claimedRewards.push({
    taskId,
    badgeId: task.rewardBadgeId,
    stars: task.rewardStars,
    claimedAt: new Date().toISOString()
  });

  userRecord.totalStars = (userRecord.totalStars || 0) + task.rewardStars;

  writeJSON('user-achievements.json', userAchievementData);

  res.json({
    success: true,
    message: `领取成功！获得 ${task.rewardStars} 星尘${task.rewardBadgeId ? ' 和徽章' : ''} ✨`,
    data: {
      taskId,
      rewardStars: task.rewardStars,
      rewardBadgeId: task.rewardBadgeId,
      totalStars: userRecord.totalStars
    }
  });
});

router.get('/badges/:userId', (req, res) => {
  const { userId } = req.params;
  const achievementData = getAchievementData();
  const userAchievementData = getUserAchievementData();

  const userRecord = userAchievementData.userAchievements.find(u => u.userId === userId);
  const earnedBadgeIds = new Set(userRecord?.earnedBadgeIds || []);

  const badges = achievementData.badges.map(badge => ({
    ...badge,
    isEarned: earnedBadgeIds.has(badge.id),
    earnedAt: userRecord?.claimedRewards?.find(r => r.badgeId === badge.id)?.claimedAt || undefined
  }));

  res.json({
    success: true,
    data: badges,
    total: badges.length,
    earned: badges.filter(b => b.isEarned).length
  });
});

module.exports = router;
