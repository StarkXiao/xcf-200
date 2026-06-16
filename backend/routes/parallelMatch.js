const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const MATCH_DIMENSIONS = {
  emotion_match: {
    weight: 30,
    label: '情感共鸣',
    icon: '💫',
    color: '#9B59B6',
    description: '基于你常用的情绪标签，找到情感频率相近的人'
  },
  theme_match: {
    weight: 25,
    label: '主题契合',
    icon: '🎯',
    color: '#F1C40F',
    description: '根据信件标题和内容主题，发现关注相似话题的人'
  },
  behavior_match: {
    weight: 20,
    label: '行为共振',
    icon: '🌊',
    color: '#4cc9f0',
    description: '写作频率、回复习惯和活跃时段的匹配程度'
  },
  recipient_match: {
    weight: 15,
    label: '收件偏好',
    icon: '📮',
    color: '#FF6B9D',
    description: '收件人类型（未来/过去/平行）的偏好一致性'
  },
  complement_match: {
    weight: 10,
    label: '互补吸引',
    icon: '⚡',
    color: '#2ECC71',
    description: '你的写信偏好与对方回信偏好的互补性'
  }
};

const TOPIC_TEMPLATES = [
  {
    id: 'topic_starlight',
    title: '星光夜话',
    description: '在宁静的夜晚倾诉思念与温柔，与同样心怀暖意的人交换心声',
    icon: '🌟',
    color: '#FFD166',
    emotions: ['思念', '温暖', '怀念', '治愈'],
    recipientTypes: ['past', 'parallel'],
    relatedThemes: ['思念亲人', '感恩回忆', '孤独治愈'],
    activityLevels: ['moderate', 'quiet']
  },
  {
    id: 'topic_braveheart',
    title: '勇者前行',
    description: '分享勇气与希望的故事，相互激励在困难中前行',
    icon: '🔥',
    color: '#E74C3C',
    emotions: ['勇气', '希望', '梦想'],
    recipientTypes: ['future', 'parallel'],
    relatedThemes: ['成长蜕变', '勇气冒险', '梦想追求'],
    activityLevels: ['active', 'moderate']
  },
  {
    id: 'topic_loveletter',
    title: '情书寄语',
    description: '关于爱情和亲密关系的信件，在平行宇宙中找到同频的心',
    icon: '💕',
    color: '#FF6B9D',
    emotions: ['爱情', '温暖', '幸福'],
    recipientTypes: ['past', 'future', 'parallel'],
    relatedThemes: ['爱情故事', '感恩回忆', '孤独治愈'],
    activityLevels: ['active', 'moderate', 'quiet']
  },
  {
    id: 'topic_solitude',
    title: '独行宇宙',
    description: '在孤独中寻找联结，和同样感受过寂寞的灵魂相遇',
    icon: '🌙',
    color: '#34495E',
    emotions: ['孤独', '遗憾', '告别'],
    recipientTypes: ['parallel', 'unknown'],
    relatedThemes: ['孤独治愈', '告别释怀', '思念亲人'],
    activityLevels: ['quiet', 'moderate']
  },
  {
    id: 'topic_dreamweaver',
    title: '梦想编织',
    description: '给未来的自己或平行世界的梦想家写信，编织共同的愿景',
    icon: '☁️',
    color: '#64B5F6',
    emotions: ['梦想', '希望', '好奇'],
    recipientTypes: ['future'],
    relatedThemes: ['梦想追求', '成长蜕变', '勇气冒险'],
    activityLevels: ['active', 'moderate']
  },
  {
    id: 'topic_healing_garden',
    title: '治愈花园',
    description: '在温暖的文字中疗愈彼此，交换善意与关怀',
    icon: '🌿',
    color: '#2ECC71',
    emotions: ['治愈', '温暖', '亲情'],
    recipientTypes: ['past', 'parallel'],
    relatedThemes: ['孤独治愈', '感恩回忆', '思念亲人'],
    activityLevels: ['moderate', 'quiet', 'active']
  },
  {
    id: 'topic_mystery_box',
    title: '神秘信箱',
    description: '探索未知与神秘，与好奇心旺盛的灵魂交流奇思妙想',
    icon: '🌌',
    color: '#5E35B1',
    emotions: ['神秘', '好奇', '梦想'],
    recipientTypes: ['unknown', 'parallel'],
    relatedThemes: ['勇气冒险', '梦想追求', '成长蜕变'],
    activityLevels: ['active', 'moderate']
  },
  {
    id: 'topic_timecapsule',
    title: '时光胶囊',
    description: '珍藏回忆与怀念，让过去的温暖延续到未来',
    icon: '🕰️',
    color: '#A1887F',
    emotions: ['怀念', '思念', '遗憾', '告别'],
    recipientTypes: ['past', 'future'],
    relatedThemes: ['感恩回忆', '告别释怀', '思念亲人'],
    activityLevels: ['quiet', 'moderate']
  }
];

function getUserEmotionProfile(userId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };
  const emotionRecords = readJSON('emotion-records.json') || { records: [] };

  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const letterEmotions = {};
  userLetters.forEach(l => {
    (l.emotions || []).forEach(e => {
      letterEmotions[e] = (letterEmotions[e] || 0) + 1;
    });
  });

  const userRecords = emotionRecords.records?.filter(r => r.userId === userId) || [];
  const recordEmotions = {};
  userRecords.forEach(r => {
    recordEmotions[r.emotion] = (recordEmotions[r.emotion] || 0) + r.intensity;
  });

  const combined = {};
  for (const [emo, count] of Object.entries(letterEmotions)) {
    combined[emo] = (combined[emo] || 0) + count * 2;
  }
  for (const [emo, score] of Object.entries(recordEmotions)) {
    combined[emo] = (combined[emo] || 0) + score;
  }

  const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  return {
    emotionMap: combined,
    topEmotions: sorted.slice(0, 5).map(([name]) => name),
    totalWeight: sorted.reduce((sum, [, w]) => sum + w, 0)
  };
}

function getUserThemeProfile(userId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);

  const themes = {};
  const themeKeywords = {
    '思念亲人': ['亲人', '家人', '妈妈', '爸爸', '家', '回家', '想念'],
    '爱情故事': ['爱', '喜欢', '恋', '心', '牵手', '拥抱', '在一起'],
    '成长蜕变': ['成长', '改变', '勇敢', '努力', '坚持', '突破', '蜕变'],
    '梦想追求': ['梦想', '未来', '目标', '追求', '奋斗', '远方'],
    '告别释怀': ['告别', '再见', '离开', '放下', '释怀', '结束', '离别'],
    '孤独治愈': ['孤独', '寂寞', '一个人', '治愈', '温暖', '陪伴'],
    '感恩回忆': ['感谢', '感恩', '回忆', '记得', '怀念', '曾经', '记忆'],
    '勇气冒险': ['勇气', '冒险', '挑战', '尝试', '突破', '无畏']
  };

  userLetters.forEach(l => {
    const text = (l.title + ' ' + l.content).toLowerCase();
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matched = keywords.filter(kw => text.includes(kw)).length;
      if (matched > 0) {
        themes[theme] = (themes[theme] || 0) + matched;
      }
    }
  });

  const sorted = Object.entries(themes).sort((a, b) => b[1] - a[1]);
  return {
    themeMap: themes,
    topThemes: sorted.slice(0, 3).map(([name]) => name)
  };
}

function getUserBehaviorProfile(userId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentLetters = userLetters.filter(l => (now - new Date(l.createdAt).getTime()) < weekMs);

  let totalRepliesMade = 0;
  for (const letter of letterData.letters) {
    for (const reply of letter.replies || []) {
      if (reply.replierId === userId) totalRepliesMade++;
    }
  }

  const hourCounts = new Array(24).fill(0);
  userLetters.forEach(l => {
    const hour = new Date(l.createdAt).getHours();
    hourCounts[hour]++;
  });
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  const recipientTypeCounts = {};
  userLetters.forEach(l => {
    recipientTypeCounts[l.recipientType] = (recipientTypeCounts[l.recipientType] || 0) + 1;
  });

  const activityLevel = recentLetters.length >= 3 ? 'active'
    : recentLetters.length >= 1 ? 'moderate' : 'quiet';

  return {
    totalLetters: userLetters.length,
    recentLetters: recentLetters.length,
    totalReplies: totalRepliesMade,
    peakHours,
    recipientTypeCounts,
    activityLevel,
    avgLetterLength: userLetters.length > 0
      ? Math.round(userLetters.reduce((sum, l) => sum + (l.content?.length || 0), 0) / userLetters.length)
      : 0
  };
}

function calculateDimensionScore(dimension, userProfile, targetProfile) {
  switch (dimension) {
    case 'emotion_match': {
      const userEmos = userProfile.emotion.topEmotions;
      const targetEmos = targetProfile.emotion.topEmotions;
      if (userEmos.length === 0 || targetEmos.length === 0) return 0;
      const common = userEmos.filter(e => targetEmos.includes(e));
      const union = new Set([...userEmos, ...targetEmos]).size;
      return union > 0 ? Math.round((common.length / union) * 100) : 0;
    }
    case 'theme_match': {
      const userThemes = userProfile.theme.topThemes;
      const targetThemes = targetProfile.theme.topThemes;
      if (userThemes.length === 0 || targetThemes.length === 0) return 0;
      const common = userThemes.filter(t => targetThemes.includes(t));
      const union = new Set([...userThemes, ...targetThemes]).size;
      return union > 0 ? Math.round((common.length / union) * 100) : 0;
    }
    case 'behavior_match': {
      let score = 0;
      const ub = userProfile.behavior;
      const tb = targetProfile.behavior;

      if (ub.activityLevel === tb.activityLevel) score += 30;
      else if (
        (ub.activityLevel === 'active' && tb.activityLevel === 'moderate') ||
        (ub.activityLevel === 'moderate' && tb.activityLevel === 'active')
      ) score += 20;

      const hourOverlap = ub.peakHours.filter(h => tb.peakHours.includes(h)).length;
      score += Math.min(hourOverlap * 15, 30);

      const lengthDiff = Math.abs(ub.avgLetterLength - tb.avgLetterLength);
      if (lengthDiff < 100) score += 25;
      else if (lengthDiff < 300) score += 15;

      const replyBalance = Math.abs(ub.totalReplies - tb.totalReplies);
      if (replyBalance < 3) score += 15;
      else if (replyBalance < 10) score += 8;

      return Math.min(score, 100);
    }
    case 'recipient_match': {
      const urt = userProfile.behavior.recipientTypeCounts;
      const trt = targetProfile.behavior.recipientTypeCounts;
      const allTypes = new Set([...Object.keys(urt), ...Object.keys(trt)]);
      if (allTypes.size === 0) return 0;

      let commonCount = 0;
      allTypes.forEach(t => {
        if (urt[t] && trt[t]) commonCount++;
      });

      return Math.round((commonCount / allTypes.size) * 100);
    }
    case 'complement_match': {
      const ub = userProfile.behavior;
      const tb = targetProfile.behavior;

      let score = 0;
      if (ub.totalLetters > 5 && tb.totalReplies > 3) score += 35;
      if (ub.totalReplies > 3 && tb.totalLetters > 5) score += 35;

      const userEmos = userProfile.emotion.topEmotions;
      const targetEmos = targetProfile.emotion.topEmotions;
      const positiveEmos = ['希望', '勇气', '治愈', '温暖', '幸福', '梦想'];
      const negativeEmos = ['孤独', '遗憾', '告别'];

      const userHasNeg = userEmos.some(e => negativeEmos.includes(e));
      const targetHasPos = targetEmos.some(e => positiveEmos.includes(e));
      const userHasPos = userEmos.some(e => positiveEmos.includes(e));
      const targetHasNeg = targetEmos.some(e => negativeEmos.includes(e));

      if (userHasNeg && targetHasPos) score += 30;
      if (userHasPos && targetHasNeg) score += 30;

      if (ub.avgLetterLength > 300 && tb.avgLetterLength > 100 && tb.avgLetterLength < 300) score += 20;

      return Math.min(score, 100);
    }
    default:
      return 0;
  }
}

function calculateMatchScore(userProfile, targetProfile) {
  const dimensions = [];
  let totalScore = 0;

  for (const [key, config] of Object.entries(MATCH_DIMENSIONS)) {
    const dimScore = calculateDimensionScore(key, userProfile, targetProfile);
    const weightedScore = (dimScore * config.weight) / 100;
    totalScore += weightedScore;

    dimensions.push({
      key,
      label: config.label,
      score: dimScore,
      maxScore: 100,
      icon: config.icon,
      color: config.color
    });
  }

  return {
    totalScore: Math.round(totalScore),
    dimensions
  };
}

function buildUserProfile(userId) {
  return {
    emotion: getUserEmotionProfile(userId),
    theme: getUserThemeProfile(userId),
    behavior: getUserBehaviorProfile(userId)
  };
}

function getInteractionHint(matchResult, targetProfile) {
  const { totalScore, dimensions } = matchResult;
  const bestDim = dimensions.sort((a, b) => b.score - a.score)[0];

  if (totalScore >= 70) {
    if (bestDim?.key === 'emotion_match') return '你们的心灵频率高度共振，来一封信吧';
    if (bestDim?.key === 'theme_match') return '你们关注着相似的故事，值得交流';
    if (bestDim?.key === 'complement_match') return '你们的文字能互补治愈，试试互动';
    return '来自平行宇宙的知己，不要错过';
  }

  if (totalScore >= 40) {
    if (bestDim?.key === 'emotion_match') return '情感世界有交集，或许能产生共鸣';
    if (bestDim?.key === 'behavior_match') return '写信习惯相似，交流会很顺畅';
    if (bestDim?.key === 'recipient_match') return '你们写给相似的对象，值得认识';
    return '有一些奇妙的连接，可以探索';
  }

  return '平行宇宙的微弱信号，也许有惊喜';
}

function generateRecommendations(userId, limit = 6) {
  const userData = readJSON('users.json') || { users: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const userProfile = buildUserProfile(userId);

  const otherUsers = userData.users.filter(u => u.id !== userId);
  const results = [];

  for (const target of otherUsers) {
    const targetProfile = buildUserProfile(target.id);
    const matchResult = calculateMatchScore(userProfile, targetProfile);

    if (matchResult.totalScore < 10) continue;

    const targetLetters = letterData.letters.filter(l => l.senderId === target.id);
    const recentLetter = targetLetters.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const commonEmotions = userProfile.emotion.topEmotions.filter(e =>
      targetProfile.emotion.topEmotions.includes(e)
    );

    const userRecipientTypes = Object.keys(userProfile.behavior.recipientTypeCounts);
    const targetRecipientTypes = Object.keys(targetProfile.behavior.recipientTypeCounts);
    const commonRecipientTypes = userRecipientTypes.filter(t => targetRecipientTypes.includes(t));

    results.push({
      userId: target.id,
      username: target.username,
      avatar: target.avatar,
      bio: target.bio || '这位星人还没有写简介',
      matchScore: matchResult.totalScore,
      matchDimensions: matchResult.dimensions,
      commonEmotions,
      commonRecipientTypes,
      recentLetterTitle: recentLetter?.title || null,
      recentLetterId: recentLetter?.id || null,
      activityLevel: targetProfile.behavior.activityLevel,
      interactionHint: getInteractionHint(matchResult, targetProfile)
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, limit);
}

function generateTopics(userId, limit = 6) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const userData = readJSON('users.json') || { users: [] };

  const userProfile = userId ? buildUserProfile(userId) : null;

  const RECIPIENT_LABELS = { future: '未来', past: '过去', parallel: '平行世界', unknown: '未知' };
  const ACTIVITY_LABELS = { active: '活跃', moderate: '温和', quiet: '宁静' };

  const topicsWithScores = TOPIC_TEMPLATES.map(template => {
    const matchingLetters = letterData.letters.filter(l => {
      const hasEmotion = (l.emotions || []).some(e => template.emotions.includes(e));
      const hasType = template.recipientTypes.includes(l.recipientType);
      return l.isPublic && (hasEmotion || hasType);
    });

    const participantIds = new Set(matchingLetters.map(l => l.senderId));
    let relevanceScore = 0;
    let relevanceReason = '';

    const matchDetails = {
      emotion: { score: 0, overlap: [] as string[] },
      recipientType: { score: 0, overlap: [] as string[] },
      theme: { score: 0, overlap: [] as string[] },
      behavior: { score: 0, activityMatched: false, letterVolumeMatched: false }
    };

    if (userProfile) {
      const emotionOverlap = template.emotions.filter(e =>
        userProfile.emotion.topEmotions.includes(e)
      );
      const typeOverlap = template.recipientTypes.filter(t =>
        Object.keys(userProfile.behavior.recipientTypeCounts).includes(t)
      );
      const themeOverlap = (template.relatedThemes || []).filter(t =>
        userProfile.theme.topThemes.includes(t)
      );

      matchDetails.emotion.overlap = emotionOverlap;
      matchDetails.emotion.score = emotionOverlap.length * 25;

      matchDetails.recipientType.overlap = typeOverlap;
      matchDetails.recipientType.score = typeOverlap.length * 15;

      matchDetails.theme.overlap = themeOverlap;
      matchDetails.theme.score = themeOverlap.length * 20;

      const activityMatch = (template.activityLevels || []).includes(userProfile.behavior.activityLevel);
      matchDetails.behavior.activityMatched = activityMatch;
      if (activityMatch) {
        matchDetails.behavior.score += 10;
      }

      const userTotalLetters = userProfile.behavior.totalLetters;
      const topicLetterDensity = matchingLetters.length;
      if (userTotalLetters >= 3 && topicLetterDensity >= 2) {
        matchDetails.behavior.score += 8;
        matchDetails.behavior.letterVolumeMatched = true;
      }

      if (userProfile.behavior.totalReplies >= 2 && matchingLetters.some(l => !l.replies || l.replies.length < 3)) {
        matchDetails.behavior.score += 5;
      }

      relevanceScore =
        matchDetails.emotion.score +
        matchDetails.recipientType.score +
        matchDetails.theme.score +
        matchDetails.behavior.score;

      const reasonParts: string[] = [];
      if (emotionOverlap.length > 0) {
        reasonParts.push(`情感共振（${emotionOverlap.join('、')}）`);
      }
      if (themeOverlap.length > 0) {
        reasonParts.push(`主题契合（${themeOverlap.join('、')}）`);
      }
      if (typeOverlap.length > 0) {
        reasonParts.push(`收件偏好（${typeOverlap.map(t => RECIPIENT_LABELS[t as keyof typeof RECIPIENT_LABELS] || t).join('、')}）`);
      }
      if (activityMatch) {
        reasonParts.push(`活跃度匹配（${ACTIVITY_LABELS[userProfile.behavior.activityLevel as keyof typeof ACTIVITY_LABELS] || userProfile.behavior.activityLevel}）`);
      }

      if (reasonParts.length >= 2) {
        relevanceReason = reasonParts.slice(0, 3).join(' · ');
      } else if (reasonParts.length === 1) {
        relevanceReason = reasonParts[0];
      } else {
        relevanceReason = '探索新的情感维度，拓展你的星际视野';
      }

      if (relevanceScore === 0 && userTotalLetters < 3) {
        relevanceReason = '多写几封信后，专题推荐会更加精准贴合你的风格';
      }
    } else {
      relevanceScore = matchingLetters.length * 5;
      relevanceReason = `已有 ${participantIds.size} 位星人参与`;
    }

    const sampleLetters = matchingLetters.slice(0, 3).map(l => ({
      id: l.id,
      title: l.title,
      senderName: l.isAnonymous ? '匿名星人' : l.senderName
    }));

    return {
      ...template,
      letterCount: matchingLetters.length,
      participantCount: participantIds.size,
      relevanceScore,
      relevanceReason,
      matchDetails,
      sampleLetters
    };
  });

  topicsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return topicsWithScores.slice(0, limit);
}

function calculateStats(recommendations, topics) {
  const totalUsers = recommendations.length;
  const matchScores = recommendations.map(r => r.matchScore);

  const dimensionAverages = Object.entries(MATCH_DIMENSIONS).map(([key, config]) => {
    const scores = recommendations.map(r => {
      const dim = r.matchDimensions.find(d => d.key === key);
      return dim ? dim.score : 0;
    });
    return {
      key,
      label: config.label,
      average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    };
  });

  return {
    totalUsers,
    matchedUsers: recommendations.filter(r => r.matchScore >= 40).length,
    totalTopics: topics.length,
    topMatchScore: matchScores.length > 0 ? Math.max(...matchScores) : 0,
    averageMatchScore: matchScores.length > 0
      ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
      : 0,
    emotionCoverage: topics.reduce((sum, t) => sum + t.letterCount, 0),
    dimensionAverages
  };
}

router.get('/recommendations/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 6 } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const recommendations = generateRecommendations(userId, parseInt(limit));
  const topics = generateTopics(userId);
  const stats = calculateStats(recommendations, topics);

  res.json({
    success: true,
    data: {
      recommendations,
      topics,
      stats,
      matchRules: Object.entries(MATCH_DIMENSIONS).map(([key, val]) => ({
        key,
        label: val.label,
        weight: val.weight,
        description: val.description
      }))
    }
  });
});

router.get('/topics', (req, res) => {
  const { userId, limit = 8 } = req.query;

  const topics = generateTopics(userId || null, parseInt(limit));

  res.json({
    success: true,
    data: topics
  });
});

router.get('/match-rules', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(MATCH_DIMENSIONS).map(([key, val]) => ({
      key,
      label: val.label,
      weight: val.weight,
      description: val.description
    }))
  });
});

router.post('/interact', (req, res) => {
  const { fromUserId, toUserId, type, message } = req.body;

  if (!fromUserId || !toUserId || !type) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (!['wave', 'resonate', 'invite'].includes(type)) {
    return res.status(400).json({ success: false, message: '无效的互动类型' });
  }

  if (fromUserId === toUserId) {
    return res.status(400).json({ success: false, message: '不能和自己互动哦' });
  }

  const interactionData = readJSON('parallelInteractions.json') || { interactions: [] };

  const recentDup = interactionData.interactions.find(
    i => i.fromUserId === fromUserId &&
      i.toUserId === toUserId &&
      i.type === type &&
      (Date.now() - new Date(i.createdAt).getTime()) < 60000
  );
  if (recentDup) {
    return res.status(400).json({ success: false, message: '请稍后再试' });
  }

  const interaction = {
    id: generateId(),
    fromUserId,
    toUserId,
    type,
    message: message || '',
    createdAt: new Date().toISOString()
  };

  interactionData.interactions.unshift(interaction);
  writeJSON('parallelInteractions.json', interactionData);

  const typeLabels = { wave: '星波致意', resonate: '共鸣连接', invite: '信件邀请' };

  const notifData = readJSON('notifications.json') || { notifications: [] };
  notifData.notifications.unshift({
    id: generateId(),
    userId: toUserId,
    type: 'parallel_match',
    title: `${typeLabels[type]} 🌌`,
    content: message || `有人向你发起了「${typeLabels[type]}」，去看看吧`,
    relatedId: interaction.id,
    read: false,
    createdAt: new Date().toISOString()
  });
  writeJSON('notifications.json', notifData);

  res.json({
    success: true,
    message: `${typeLabels[type]}已发送 ✨`,
    data: interaction
  });
});

router.get('/interactions/:userId', (req, res) => {
  const { userId } = req.params;
  const { type, limit = 20 } = req.query;

  const interactionData = readJSON('parallelInteractions.json') || { interactions: [] };
  let interactions = interactionData.interactions.filter(
    i => i.fromUserId === userId || i.toUserId === userId
  );

  if (type) {
    interactions = interactions.filter(i => i.type === type);
  }

  interactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: interactions.slice(0, parseInt(limit)),
    total: interactions.length
  });
});

router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const profile = buildUserProfile(userId);

  res.json({
    success: true,
    data: profile
  });
});

module.exports = router;
