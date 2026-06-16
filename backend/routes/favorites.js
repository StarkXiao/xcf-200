const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const DEFAULT_GROUPS = [
  { name: '星河珍藏', icon: '⭐', color: 'starlight' },
  { name: '温暖治愈', icon: '💖', color: 'nebula-pink' },
  { name: '勇气激励', icon: '🔥', color: 'aurora' },
  { name: '思念回忆', icon: '🌙', color: 'nebula-purple' },
];

function ensureDefaultGroups(userId) {
  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  const userGroups = groupData.groups.filter(g => g.userId === userId);

  if (userGroups.length === 0) {
    const now = new Date().toISOString();
    DEFAULT_GROUPS.forEach((group, index) => {
      groupData.groups.push({
        id: generateId(),
        userId,
        name: group.name,
        icon: group.icon,
        color: group.color,
        description: '',
        createdAt: now,
        isDefault: index === 0
      });
    });
    writeJSON('favorite-groups.json', groupData);
    return groupData.groups.filter(g => g.userId === userId);
  }
  return userGroups;
}

router.get('/:userId/groups', (req, res) => {
  const { userId } = req.params;
  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  const favData = readJSON('favorites.json') || { favorites: [] };

  const groups = ensureDefaultGroups(userId);
  const userFavs = favData.favorites.filter(f => f.userId === userId);

  const groupsWithCount = groups.map(group => ({
    ...group,
    count: userFavs.filter(f => f.groupId === group.id).length
  }));

  const ungroupedCount = userFavs.filter(f => !f.groupId).length;

  res.json({
    success: true,
    data: groupsWithCount,
    ungroupedCount
  });
});

router.post('/:userId/groups', (req, res) => {
  const { userId } = req.params;
  const { name, icon = '📁', color = 'aurora', description = '' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '分组名称不能为空' });
  }

  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  ensureDefaultGroups(userId);

  const existingName = groupData.groups.find(
    g => g.userId === userId && g.name === name.trim()
  );
  if (existingName) {
    return res.status(400).json({ success: false, message: '分组名称已存在' });
  }

  const newGroup = {
    id: generateId(),
    userId,
    name: name.trim(),
    icon,
    color,
    description: description.trim(),
    createdAt: new Date().toISOString()
  };

  groupData.groups.push(newGroup);
  writeJSON('favorite-groups.json', groupData);

  res.json({
    success: true,
    message: '分组创建成功 ✨',
    data: { ...newGroup, count: 0 }
  });
});

router.put('/:userId/groups/:groupId', (req, res) => {
  const { userId, groupId } = req.params;
  const { name, icon, color, description } = req.body;

  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  const groupIndex = groupData.groups.findIndex(
    g => g.id === groupId && g.userId === userId
  );

  if (groupIndex === -1) {
    return res.status(404).json({ success: false, message: '分组不存在' });
  }

  if (name && name.trim()) {
    const existingName = groupData.groups.find(
      g => g.userId === userId && g.name === name.trim() && g.id !== groupId
    );
    if (existingName) {
      return res.status(400).json({ success: false, message: '分组名称已存在' });
    }
    groupData.groups[groupIndex].name = name.trim();
  }
  if (icon !== undefined) groupData.groups[groupIndex].icon = icon;
  if (color !== undefined) groupData.groups[groupIndex].color = color;
  if (description !== undefined) groupData.groups[groupIndex].description = description.trim();

  writeJSON('favorite-groups.json', groupData);

  res.json({
    success: true,
    message: '分组已更新',
    data: groupData.groups[groupIndex]
  });
});

router.delete('/:userId/groups/:groupId', (req, res) => {
  const { userId, groupId } = req.params;

  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  const group = groupData.groups.find(g => g.id === groupId && g.userId === userId);

  if (!group) {
    return res.status(404).json({ success: false, message: '分组不存在' });
  }

  if (group.isDefault) {
    return res.status(400).json({ success: false, message: '默认分组无法删除' });
  }

  groupData.groups = groupData.groups.filter(g => g.id !== groupId);

  const favData = readJSON('favorites.json') || { favorites: [] };
  favData.favorites = favData.favorites.map(f => {
    if (f.userId === userId && f.groupId === groupId) {
      return { ...f, groupId: null };
    }
    return f;
  });
  writeJSON('favorites.json', favData);

  writeJSON('favorite-groups.json', groupData);

  res.json({
    success: true,
    message: '分组已删除，收藏已移至未分组'
  });
});

router.post('/:userId/move', (req, res) => {
  const { userId } = req.params;
  const { letterIds, targetGroupId } = req.body;

  if (!Array.isArray(letterIds) || letterIds.length === 0) {
    return res.status(400).json({ success: false, message: '请选择要移动的信件' });
  }

  const favData = readJSON('favorites.json') || { favorites: [] };
  let movedCount = 0;

  favData.favorites = favData.favorites.map(f => {
    if (f.userId === userId && letterIds.includes(f.letterId)) {
      movedCount++;
      return { ...f, groupId: targetGroupId || null };
    }
    return f;
  });

  writeJSON('favorites.json', favData);

  res.json({
    success: true,
    message: `已移动 ${movedCount} 封信件`
  });
});

router.post('/:userId/batch-remove', (req, res) => {
  const { userId } = req.params;
  const { letterIds } = req.body;

  if (!Array.isArray(letterIds) || letterIds.length === 0) {
    return res.status(400).json({ success: false, message: '请选择要取消收藏的信件' });
  }

  const favData = readJSON('favorites.json') || { favorites: [] };
  const beforeCount = favData.favorites.filter(f => f.userId === userId).length;

  favData.favorites = favData.favorites.filter(
    f => !(f.userId === userId && letterIds.includes(f.letterId))
  );

  const removedCount = beforeCount - favData.favorites.filter(f => f.userId === userId).length;
  writeJSON('favorites.json', favData);

  res.json({
    success: true,
    message: `已取消收藏 ${removedCount} 封信件`
  });
});

router.get('/:userId/reminders', (req, res) => {
  const { userId } = req.params;
  const reminderData = readJSON('favorite-reminders.json') || { reminders: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const userReminders = reminderData.reminders
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));

  const remindersWithLetter = userReminders.map(r => {
    const letter = letterData.letters.find(l => l.id === r.letterId);
    return {
      ...r,
      letter: letter ? {
        id: letter.id,
        title: letter.title,
        senderName: letter.senderName,
        emotions: letter.emotions
      } : null
    };
  });

  res.json({
    success: true,
    data: remindersWithLetter,
    pendingCount: remindersWithLetter.filter(r => !r.completed).length
  });
});

router.post('/:userId/reminders', (req, res) => {
  const { userId } = req.params;
  const { letterId, remindAt, note } = req.body;

  if (!letterId || !remindAt) {
    return res.status(400).json({ success: false, message: '请填写完整的提醒信息' });
  }

  const reminderData = readJSON('favorite-reminders.json') || { reminders: [] };

  const existing = reminderData.reminders.find(
    r => r.userId === userId && r.letterId === letterId && !r.completed
  );
  if (existing) {
    return res.status(400).json({ success: false, message: '该信件已有未完成的提醒' });
  }

  const newReminder = {
    id: generateId(),
    userId,
    letterId,
    remindAt,
    note: note?.trim() || '',
    completed: false,
    createdAt: new Date().toISOString()
  };

  reminderData.reminders.push(newReminder);
  writeJSON('favorite-reminders.json', reminderData);

  res.json({
    success: true,
    message: '回看提醒已设置 ⏰',
    data: newReminder
  });
});

router.put('/:userId/reminders/:reminderId', (req, res) => {
  const { userId, reminderId } = req.params;
  const { remindAt, note, completed } = req.body;

  const reminderData = readJSON('favorite-reminders.json') || { reminders: [] };
  const reminderIndex = reminderData.reminders.findIndex(
    r => r.id === reminderId && r.userId === userId
  );

  if (reminderIndex === -1) {
    return res.status(404).json({ success: false, message: '提醒不存在' });
  }

  if (remindAt) reminderData.reminders[reminderIndex].remindAt = remindAt;
  if (note !== undefined) reminderData.reminders[reminderIndex].note = note.trim();
  if (completed !== undefined) {
    reminderData.reminders[reminderIndex].completed = completed;
    if (completed) {
      reminderData.reminders[reminderIndex].completedAt = new Date().toISOString();
    } else {
      delete reminderData.reminders[reminderIndex].completedAt;
    }
  }

  writeJSON('favorite-reminders.json', reminderData);

  res.json({
    success: true,
    message: completed ? '已标记为已回看' : '提醒已更新',
    data: reminderData.reminders[reminderIndex]
  });
});

router.delete('/:userId/reminders/:reminderId', (req, res) => {
  const { userId, reminderId } = req.params;

  const reminderData = readJSON('favorite-reminders.json') || { reminders: [] };
  const reminder = reminderData.reminders.find(
    r => r.id === reminderId && r.userId === userId
  );

  if (!reminder) {
    return res.status(404).json({ success: false, message: '提醒不存在' });
  }

  reminderData.reminders = reminderData.reminders.filter(r => r.id !== reminderId);
  writeJSON('favorite-reminders.json', reminderData);

  res.json({
    success: true,
    message: '提醒已删除'
  });
});

router.get('/:userId/stats', (req, res) => {
  const { userId } = req.params;

  const favData = readJSON('favorites.json') || { favorites: [] };
  const groupData = readJSON('favorite-groups.json') || { groups: [] };
  const reminderData = readJSON('favorite-reminders.json') || { reminders: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const userFavs = favData.favorites.filter(f => f.userId === userId);
  const userGroups = ensureDefaultGroups(userId);
  const userReminders = reminderData.reminders.filter(r => r.userId === userId);

  const groupDistribution = userGroups.map(group => ({
    groupId: group.id,
    groupName: group.name,
    count: userFavs.filter(f => f.groupId === group.id).length
  }));

  const emotionDistribution = {};
  userFavs.forEach(fav => {
    const letter = letterData.letters.find(l => l.id === fav.letterId);
    if (letter && letter.emotions) {
      letter.emotions.forEach(e => {
        emotionDistribution[e] = (emotionDistribution[e] || 0) + 1;
      });
    }
  });

  const monthlyMap = {};
  userFavs.forEach(fav => {
    const date = new Date(fav.createdAt || fav.favoritedAt || new Date());
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[month] = (monthlyMap[month] || 0) + 1;
  });
  const monthlyCollection = Object.entries(monthlyMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyReviewCount = userReminders.filter(
    r => r.completed && new Date(r.completedAt) >= weekAgo
  ).length;

  const completedReminders = userReminders.filter(r => r.completed);
  const lastReviewAt = completedReminders.length > 0
    ? completedReminders.reduce((latest, r) =>
        new Date(r.completedAt) > new Date(latest.completedAt) ? r : latest
      ).completedAt
    : null;

  res.json({
    success: true,
    data: {
      totalFavorites: userFavs.length,
      totalGroups: userGroups.length,
      totalReminders: userReminders.length,
      pendingReminders: userReminders.filter(r => !r.completed).length,
      completedReminders: completedReminders.length,
      groupDistribution,
      emotionDistribution,
      monthlyCollection,
      weeklyReviewCount,
      lastReviewAt
    }
  });
});

router.get('/:userId/letters', (req, res) => {
  const { userId } = req.params;
  const { groupId } = req.query;

  const favData = readJSON('favorites.json') || { favorites: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  let userFavs = favData.favorites.filter(f => f.userId === userId);

  if (groupId === 'ungrouped') {
    userFavs = userFavs.filter(f => !f.groupId);
  } else if (groupId) {
    userFavs = userFavs.filter(f => f.groupId === groupId);
  }

  const favLetters = userFavs.map(fav => {
    const letter = letterData.letters.find(l => l.id === fav.letterId);
    return letter ? {
      ...letter,
      favoritedAt: fav.createdAt || fav.favoritedAt,
      favoriteId: fav.id,
      groupId: fav.groupId
    } : null;
  }).filter(Boolean);

  favLetters.sort((a, b) =>
    new Date(b.favoritedAt) - new Date(a.favoritedAt)
  );

  res.json({
    success: true,
    data: favLetters,
    total: favLetters.length
  });
});

module.exports = router;
