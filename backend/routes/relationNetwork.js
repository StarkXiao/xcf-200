const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const DEFAULT_GROUPS = [
  { name: '家人', icon: '🏠', color: '#f72585', description: '血浓于水的至亲' },
  { name: '挚友', icon: '🤝', color: '#4cc9f0', description: '人生难得的知己' },
  { name: '恋人', icon: '💕', color: '#ff7b00', description: '心中最特别的人' },
  { name: '自己', icon: '🌟', color: '#ffd166', description: '写给不同时空的自己' },
  { name: '师长', icon: '📚', color: '#06d6a0', description: '人生路上的引路人' },
];

function generateFestivalSuggestions(userId) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const festivals = [
    {
      name: '春节',
      date: `${currentYear + 1}-02-17`,
      icon: '🧧',
      groups: ['家人', '挚友', '师长'],
      suggestion: '新的一年，给最爱的人写一封信，送上最真挚的祝福',
      emotions: ['温暖', '希望', '感恩'],
    },
    {
      name: '情人节',
      date: `${currentYear}-02-14`,
      icon: '💝',
      groups: ['恋人'],
      suggestion: '在这个特别的日子，把藏在心底的话写给心爱的Ta',
      emotions: ['爱情', '温暖', '思念'],
    },
    {
      name: '母亲节',
      date: `${currentYear}-05-11`,
      icon: '🌸',
      groups: ['家人'],
      suggestion: '妈妈是世界上最爱你的人，别忘了对她说声谢谢',
      emotions: ['亲情', '感恩', '温暖'],
    },
    {
      name: '父亲节',
      date: `${currentYear}-06-15`,
      icon: '👔',
      groups: ['家人'],
      suggestion: '那个不善言辞的男人，其实一直在默默守护着你',
      emotions: ['亲情', '感恩', '勇气'],
    },
    {
      name: '七夕',
      date: `${currentYear}-08-09`,
      icon: '🌙',
      groups: ['恋人'],
      suggestion: '牛郎织女鹊桥相会的日子，也是表达心意的好时机',
      emotions: ['爱情', '思念', '浪漫'],
    },
    {
      name: '中秋节',
      date: `${currentYear}-09-17`,
      icon: '🥮',
      groups: ['家人', '挚友'],
      suggestion: '月圆人团圆，把思念寄给远方的亲人',
      emotions: ['思念', '亲情', '温暖'],
    },
    {
      name: '感恩节',
      date: `${currentYear}-11-27`,
      icon: '🍂',
      groups: ['家人', '挚友', '师长'],
      suggestion: '感谢生命中遇到的每一个人，是他们让你成为更好的自己',
      emotions: ['感恩', '温暖', '治愈'],
    },
    {
      name: '圣诞节',
      date: `${currentYear}-12-25`,
      icon: '🎄',
      groups: ['家人', '挚友', '恋人'],
      suggestion: '在飘雪的日子里，给爱的人送上一份温暖的心意',
      emotions: ['温暖', '希望', '幸福'],
    },
    {
      name: '元旦',
      date: `${currentYear + 1}-01-01`,
      icon: '🎉',
      groups: ['家人', '挚友', '恋人', '自己', '师长'],
      suggestion: '新的一年，新的开始，写下对未来的期许',
      emotions: ['希望', '勇气', '温暖'],
    },
  ];

  return festivals
    .map((f, index) => {
      const festivalDate = new Date(f.date);
      const diffTime = festivalDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: `festival_${index}`,
        festivalName: f.name,
        festivalDate: f.date,
        icon: f.icon,
        recipientGroups: f.groups,
        suggestion: f.suggestion,
        recommendedEmotions: f.emotions,
        daysUntil: daysUntil,
        isUrgent: daysUntil <= 14 && daysUntil > 0,
      };
    })
    .filter(f => f.daysUntil > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);
}

function ensureUserGroups(userId) {
  let groupData = readJSON('recipient-groups.json') || { groups: [] };
  const userGroups = groupData.groups.filter(g => g.userId === userId);

  if (userGroups.length === 0) {
    const now = new Date().toISOString();
    DEFAULT_GROUPS.forEach(g => {
      groupData.groups.push({
        id: generateId(),
        userId,
        name: g.name,
        icon: g.icon,
        color: g.color,
        description: g.description,
        createdAt: now,
      });
    });
    writeJSON('recipient-groups.json', groupData);
  }

  return groupData;
}

function analyzeFromLetters(userId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);

  const recipientMap = new Map();
  const emotionMap = new Map();
  const monthlyMap = new Map();

  userLetters.forEach(letter => {
    const name = letter.recipient || '未知收件人';

    if (!recipientMap.has(name)) {
      recipientMap.set(name, {
        name,
        letterCount: 0,
        lastWrittenAt: letter.createdAt,
        emotions: new Map(),
      });
    }

    const recipient = recipientMap.get(name);
    recipient.letterCount++;
    if (new Date(letter.createdAt) > new Date(recipient.lastWrittenAt)) {
      recipient.lastWrittenAt = letter.createdAt;
    }

    if (letter.emotions) {
      letter.emotions.forEach(e => {
        recipient.emotions.set(e, (recipient.emotions.get(e) || 0) + 1);
        const key = `${name}|||${e}`;
        emotionMap.set(key, (emotionMap.get(key) || 0) + 1);
      });
    }

    const month = letter.createdAt.substring(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
  });

  return {
    recipients: Array.from(recipientMap.values()),
    emotions: Array.from(emotionMap.entries()).map(([key, count]) => {
      const [recipientId, emotion] = key.split('|||');
      return { recipientId, emotion, count };
    }),
    monthlyFrequency: Array.from(monthlyMap.entries())
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6),
  };
}

router.get('/:userId/stats', (req, res) => {
  const { userId } = req.params;

  const groupData = ensureUserGroups(userId);
  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  const letterAnalysis = analyzeFromLetters(userId);

  const userGroups = groupData.groups.filter(g => g.userId === userId);
  let userRelations = relationData.relations.filter(r => r.userId === userId);

  if (userRelations.length === 0 && letterAnalysis.recipients.length > 0) {
    const now = new Date().toISOString();
    letterAnalysis.recipients.slice(0, 10).forEach(recipient => {
      const avatarOptions = ['🌟', '💫', '✨', '🌙', '🌈', '🦋', '🌸', '🌊', '⭐', '🎨'];
      const newRelation = {
        id: generateId(),
        userId,
        name: recipient.name,
        groupId: userGroups[0]?.id || '',
        avatar: avatarOptions[Math.floor(Math.random() * avatarOptions.length)],
        note: '',
        letterCount: recipient.letterCount,
        lastWrittenAt: recipient.lastWrittenAt,
        createdAt: now,
      };
      relationData.relations.push(newRelation);
      userRelations.push(newRelation);
    });
    writeJSON('recipient-relations.json', relationData);
  }

  userRelations.sort((a, b) => b.letterCount - a.letterCount);

  const topRecipients = userRelations.slice(0, 5).map(r => ({
    ...r,
    group: userGroups.find(g => g.id === r.groupId),
  }));

  const recentRecipients = [...userRelations]
    .sort((a, b) => new Date(b.lastWrittenAt) - new Date(a.lastWrittenAt))
    .slice(0, 5);

  const groupDistribution = userGroups.map(group => {
    const count = userRelations.filter(r => r.groupId === group.id).length;
    return { group, count };
  }).sort((a, b) => b.count - a.count);

  const emotionPreferences = [];
  userRelations.slice(0, 5).forEach(relation => {
    const letterEmotions = letterAnalysis.emotions.filter(e => {
      const recipient = letterAnalysis.recipients.find(r => r.name === relation.name);
      return recipient && recipient.emotions && recipient.emotions.has(e.emotion);
    });
    if (letterEmotions.length > 0) {
      letterEmotions.forEach(e => {
        emotionPreferences.push({
          recipientId: relation.id,
          emotion: e.emotion,
          count: e.count,
          lastUsedAt: relation.lastWrittenAt,
        });
      });
    }
  });

  const stats = {
    totalRecipients: userRelations.length,
    totalGroups: userGroups.length,
    topRecipients,
    recentRecipients,
    emotionPreferences,
    festivalSuggestions: generateFestivalSuggestions(userId),
    groupDistribution,
    writingFrequency: letterAnalysis.monthlyFrequency,
  };

  res.json({
    success: true,
    data: stats,
  });
});

router.get('/:userId/groups', (req, res) => {
  const { userId } = req.params;
  const groupData = ensureUserGroups(userId);
  const userGroups = groupData.groups.filter(g => g.userId === userId);

  res.json({
    success: true,
    data: userGroups,
  });
});

router.post('/:userId/groups', (req, res) => {
  const { userId } = req.params;
  const { name, icon, color, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '分组名称不能为空' });
  }

  const groupData = readJSON('recipient-groups.json') || { groups: [] };

  const existing = groupData.groups.find(g => g.userId === userId && g.name === name.trim());
  if (existing) {
    return res.status(400).json({ success: false, message: '分组名称已存在' });
  }

  const newGroup = {
    id: generateId(),
    userId,
    name: name.trim(),
    icon: icon || '📁',
    color: color || '#7a63ff',
    description: description || '',
    createdAt: new Date().toISOString(),
  };

  groupData.groups.push(newGroup);
  writeJSON('recipient-groups.json', groupData);

  res.json({
    success: true,
    message: '分组创建成功',
    data: newGroup,
  });
});

router.put('/:userId/groups/:groupId', (req, res) => {
  const { userId, groupId } = req.params;
  const { name, icon, color, description } = req.body;

  const groupData = readJSON('recipient-groups.json') || { groups: [] };
  const groupIndex = groupData.groups.findIndex(g => g.id === groupId && g.userId === userId);

  if (groupIndex === -1) {
    return res.status(404).json({ success: false, message: '分组不存在' });
  }

  if (name && name.trim()) {
    const existing = groupData.groups.find(
      g => g.userId === userId && g.name === name.trim() && g.id !== groupId
    );
    if (existing) {
      return res.status(400).json({ success: false, message: '分组名称已存在' });
    }
    groupData.groups[groupIndex].name = name.trim();
  }
  if (icon !== undefined) groupData.groups[groupIndex].icon = icon;
  if (color) groupData.groups[groupIndex].color = color;
  if (description !== undefined) groupData.groups[groupIndex].description = description;

  writeJSON('recipient-groups.json', groupData);

  res.json({
    success: true,
    message: '分组已更新',
    data: groupData.groups[groupIndex],
  });
});

router.delete('/:userId/groups/:groupId', (req, res) => {
  const { userId, groupId } = req.params;

  const groupData = readJSON('recipient-groups.json') || { groups: [] };
  const groupIndex = groupData.groups.findIndex(g => g.id === groupId && g.userId === userId);

  if (groupIndex === -1) {
    return res.status(404).json({ success: false, message: '分组不存在' });
  }

  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  relationData.relations.forEach(r => {
    if (r.groupId === groupId && r.userId === userId) {
      const defaultGroup = groupData.groups.find(g => g.userId === userId && g.id !== groupId);
      r.groupId = defaultGroup?.id || '';
    }
  });
  writeJSON('recipient-relations.json', relationData);

  groupData.groups.splice(groupIndex, 1);
  writeJSON('recipient-groups.json', groupData);

  res.json({
    success: true,
    message: '分组已删除',
  });
});

router.get('/:userId/relations', (req, res) => {
  const { userId } = req.params;
  const { groupId } = req.query;

  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  let relations = relationData.relations.filter(r => r.userId === userId);

  if (groupId) {
    relations = relations.filter(r => r.groupId === groupId);
  }

  relations.sort((a, b) => b.letterCount - a.letterCount);

  res.json({
    success: true,
    data: relations,
  });
});

router.get('/:userId/relations/:relationId', (req, res) => {
  const { userId, relationId } = req.params;

  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  const relation = relationData.relations.find(r => r.id === relationId && r.userId === userId);

  if (!relation) {
    return res.status(404).json({ success: false, message: '收信人不存在' });
  }

  const groupData = readJSON('recipient-groups.json') || { groups: [] };
  const group = groupData.groups.find(g => g.id === relation.groupId && g.userId === userId);

  const letterData = readJSON('letters.json') || { letters: [] };
  const letters = letterData.letters.filter(
    l => l.senderId === userId && l.recipient === relation.name
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const emotionStats = {};
  letters.forEach(l => {
    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionStats[e] = (emotionStats[e] || 0) + 1;
      });
    }
  });

  res.json({
    success: true,
    data: {
      ...relation,
      group,
      letters,
      emotionStats,
    },
  });
});

router.post('/:userId/relations', (req, res) => {
  const { userId } = req.params;
  const { name, groupId, avatar, note } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '收信人名称不能为空' });
  }

  const relationData = readJSON('recipient-relations.json') || { relations: [] };

  const existing = relationData.relations.find(r => r.userId === userId && r.name === name.trim());
  if (existing) {
    return res.status(400).json({ success: false, message: '该收信人已存在' });
  }

  const avatarOptions = ['🌟', '💫', '✨', '🌙', '🌈', '🦋', '🌸', '🌊', '⭐', '🎨'];

  const newRelation = {
    id: generateId(),
    userId,
    name: name.trim(),
    groupId: groupId || '',
    avatar: avatar || avatarOptions[Math.floor(Math.random() * avatarOptions.length)],
    note: note || '',
    letterCount: 0,
    lastWrittenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  relationData.relations.push(newRelation);
  writeJSON('recipient-relations.json', relationData);

  res.json({
    success: true,
    message: '收信人添加成功',
    data: newRelation,
  });
});

router.put('/:userId/relations/:relationId', (req, res) => {
  const { userId, relationId } = req.params;
  const { name, groupId, avatar, note } = req.body;

  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  const relationIndex = relationData.relations.findIndex(r => r.id === relationId && r.userId === userId);

  if (relationIndex === -1) {
    return res.status(404).json({ success: false, message: '收信人不存在' });
  }

  if (name && name.trim()) {
    const existing = relationData.relations.find(
      r => r.userId === userId && r.name === name.trim() && r.id !== relationId
    );
    if (existing) {
      return res.status(400).json({ success: false, message: '该收信人名称已存在' });
    }
    relationData.relations[relationIndex].name = name.trim();
  }
  if (groupId !== undefined) relationData.relations[relationIndex].groupId = groupId;
  if (avatar !== undefined) relationData.relations[relationIndex].avatar = avatar;
  if (note !== undefined) relationData.relations[relationIndex].note = note;

  writeJSON('recipient-relations.json', relationData);

  res.json({
    success: true,
    message: '收信人已更新',
    data: relationData.relations[relationIndex],
  });
});

router.delete('/:userId/relations/:relationId', (req, res) => {
  const { userId, relationId } = req.params;

  const relationData = readJSON('recipient-relations.json') || { relations: [] };
  const relationIndex = relationData.relations.findIndex(r => r.id === relationId && r.userId === userId);

  if (relationIndex === -1) {
    return res.status(404).json({ success: false, message: '收信人不存在' });
  }

  relationData.relations.splice(relationIndex, 1);
  writeJSON('recipient-relations.json', relationData);

  res.json({
    success: true,
    message: '收信人已删除',
  });
});

module.exports = router;
