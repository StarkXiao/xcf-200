const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const RISK_KEYWORDS = {
  self_harm: ['自杀', '自残', '不想活', '结束生命', '割腕', '跳楼', '上吊', '服毒', '安眠药', '离开这个世界', '解脱'],
  harm_others: ['杀人', '报复', '同归于尽', '毁了他', '弄死', '打死', '杀了'],
  depression: ['抑郁', '绝望', '没有希望', '活着没意思', '生无可恋', '行尸走肉', '空虚', '麻木'],
  anxiety: ['焦虑', '恐慌', '害怕', '恐惧', '睡不着', '失眠', '心慌', '喘不过气'],
  abuse: ['家暴', '虐待', '欺凌', '霸凌', '被欺负', '被打', '被骂', '骚扰'],
  addiction: ['吸毒', '酗酒', '赌', '上瘾', '戒不掉']
};

const CONTENT_RISK_LEVELS = {
  safe: { level: 0, label: '安全' },
  mild: { level: 1, label: '轻度关注' },
  moderate: { level: 2, label: '中度警示' },
  severe: { level: 3, label: '重度风险' }
};

function analyzeContentRisk(content) {
  if (!content) return { level: 'safe', score: 0, details: [], categories: [] };

  let totalScore = 0;
  let details = [];
  let matchedCategories = [];

  for (const [category, keywords] of Object.entries(RISK_KEYWORDS)) {
    let categoryScore = 0;
    let matchedKeywords = [];

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) {
        categoryScore += matches.length * 10;
        matchedKeywords.push(keyword);
      }
    }

    if (categoryScore > 0) {
      matchedCategories.push(category);
      details.push({ category, score: categoryScore, keywords: matchedKeywords });
      totalScore += categoryScore;
    }
  }

  let level = 'safe';
  if (totalScore >= 80) level = 'severe';
  else if (totalScore >= 40) level = 'moderate';
  else if (totalScore >= 10) level = 'mild';

  return { level, score: totalScore, details, categories: matchedCategories };
}

function processContentRating(targetId, targetType, content, userId = null) {
  const analysis = analyzeContentRisk(content);

  if (analysis.level !== 'safe') {
    const ratingData = readJSON('contentRatings.json') || { ratings: [] };
    const existingRating = ratingData.ratings.find(r => r.targetId === targetId && r.targetType === targetType);

    const ratingRecord = {
      id: existingRating?.id || generateId(),
      targetId,
      targetType,
      riskLevel: analysis.level,
      riskScore: analysis.score,
      riskCategories: analysis.categories,
      details: analysis.details,
      autoAnalyzed: true,
      createdAt: existingRating?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingRating) {
      const index = ratingData.ratings.findIndex(r => r.id === existingRating.id);
      ratingData.ratings[index] = ratingRecord;
    } else {
      ratingData.ratings.push(ratingRecord);
    }
    writeJSON('contentRatings.json', ratingData);

    if (analysis.level === 'severe' || analysis.level === 'moderate') {
      const interventionData = readJSON('interventions.json') || { interventions: [] };
      const existingIntervention = interventionData.interventions.find(
        i => i.targetId === targetId && i.targetType === targetType && i.status !== 'closed'
      );

      if (!existingIntervention) {
        const intervention = {
          id: generateId(),
          targetId,
          targetType,
          userId,
          riskLevel: analysis.level,
          riskScore: analysis.score,
          type: analysis.level === 'severe' ? 'emergency' : 'system_tip',
          status: 'pending',
          priority: analysis.level === 'severe' ? 'high' : 'medium',
          records: [
            {
              id: generateId(),
              type: 'system_detection',
              content: `系统检测到${CONTENT_RISK_LEVELS[analysis.level].label}风险内容（${targetType === 'letter' ? '信件' : '回信'}）`,
              operator: 'system',
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        interventionData.interventions.unshift(intervention);
        writeJSON('interventions.json', interventionData);
      }
    }
  }

  return analysis;
}

function createReplyReviewTask(replyId, letterId, riskLevel, userId = null) {
  const reviewData = readJSON('replyReviews.json') || { reviews: [] };
  const existing = reviewData.reviews.find(r => r.replyId === replyId);

  if (!existing) {
    const reviewTask = {
      id: generateId(),
      letterId,
      replyId,
      userId,
      riskLevel,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    reviewData.reviews.unshift(reviewTask);
    writeJSON('replyReviews.json', reviewData);
    return reviewTask;
  }
  return existing;
}

const ANONYMOUS_AVATARS = [
  '🌙 月光旅人', '⭐ 星河漫步者', '🌸 樱落使者', '🌊 深海回响',
  '🍃 风的信使', '✨ 微光收集者', '🌌 银河漂流瓶', '🦋 蝶梦使者',
  '🌠 流星许愿者', '🍂 秋叶低语', '❄️ 雪国来客', '🌈 彩虹桥守望',
  '📮 时光邮差', '🎐 风铃过客', '🌿 青苔漫游人', '🕯️ 烛火守护者'
];

const REPLY_REVIEW_TAGS = {
  positive: ['温暖治愈', '真诚走心', '文笔优美', '感同身受', '鼓励人心', '幽默风趣'],
  negative: ['敷衍了事', '内容空洞', '语气生硬', '答非所问', '过于简短', '负能量']
};

const MATCH_RULES = {
  emotion_match: { weight: 40, label: '情感共鸣' },
  recipient_type_match: { weight: 20, label: '收件类型匹配' },
  content_length: { weight: 15, label: '篇幅适中' },
  freshness: { weight: 15, label: '新鲜度' },
  reply_need: { weight: 10, label: '回复需求' }
};

function getAnonymousIdentity() {
  const avatar = ANONYMOUS_AVATARS[Math.floor(Math.random() * ANONYMOUS_AVATARS.length)];
  const id = 'anon_' + Math.random().toString(36).substr(2, 8);
  return { anonymousId: id, anonymousName: avatar };
}

function calculateMatchScore(letter, userProfile) {
  let score = 0;
  let details = [];

  const userEmotions = userProfile?.preferredEmotions || [];
  const letterEmotions = letter.emotions || [];
  const commonEmotions = letterEmotions.filter(e => userEmotions.includes(e));
  if (commonEmotions.length > 0) {
    const emotionScore = Math.min(commonEmotions.length * 15, MATCH_RULES.emotion_match.weight);
    score += emotionScore;
    details.push({ rule: 'emotion_match', score: emotionScore, reason: `共鸣情感：${commonEmotions.join('、')}` });
  }

  const preferredTypes = userProfile?.preferredTypes || [];
  if (preferredTypes.includes(letter.recipientType)) {
    score += MATCH_RULES.recipient_type_match.weight;
    details.push({ rule: 'recipient_type_match', score: MATCH_RULES.recipient_type_match.weight, reason: '类型偏好匹配' });
  }

  const contentLen = letter.content?.length || 0;
  if (contentLen >= 100 && contentLen <= 800) {
    score += MATCH_RULES.content_length.weight;
    details.push({ rule: 'content_length', score: MATCH_RULES.content_length.weight, reason: '篇幅适中易读' });
  } else if (contentLen > 800) {
    score += Math.round(MATCH_RULES.content_length.weight * 0.5);
    details.push({ rule: 'content_length', score: Math.round(MATCH_RULES.content_length.weight * 0.5), reason: '篇幅较长' });
  }

  const createdAt = new Date(letter.createdAt).getTime();
  const now = Date.now();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);
  if (ageHours < 24) {
    score += MATCH_RULES.freshness.weight;
    details.push({ rule: 'freshness', score: MATCH_RULES.freshness.weight, reason: '24小时内新信件' });
  } else if (ageHours < 72) {
    score += Math.round(MATCH_RULES.freshness.weight * 0.6);
    details.push({ rule: 'freshness', score: Math.round(MATCH_RULES.freshness.weight * 0.6), reason: '3天内信件' });
  }

  const repliesCount = letter.replies?.length || 0;
  if (repliesCount === 0) {
    score += MATCH_RULES.reply_need.weight;
    details.push({ rule: 'reply_need', score: MATCH_RULES.reply_need.weight, reason: '暂无回信，急需回应' });
  } else if (repliesCount < 3) {
    score += Math.round(MATCH_RULES.reply_need.weight * 0.5);
    details.push({ rule: 'reply_need', score: Math.round(MATCH_RULES.reply_need.weight * 0.5), reason: '回信较少' });
  }

  return { score: Math.round(score), details, maxScore: 100 };
}

function getReplyTaskPool(limit = 20, excludeUserId = null, filters = {}) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const replyPoolData = readJSON('replyPool.json') || { tasks: [] };
  
  let letters = letterData.letters.filter(l => {
    if (!l.isPublic) return false;
    if (excludeUserId && l.senderId === excludeUserId) return false;
    if (filters.emotion && !l.emotions?.includes(filters.emotion)) return false;
    if (filters.recipientType && l.recipientType !== filters.recipientType) return false;
    if (filters.needReply && l.replies?.length >= 5) return false;
    return true;
  });

  const userProfile = getUserReplyProfile(excludeUserId);
  
  letters = letters.map(letter => {
    const matchResult = calculateMatchScore(letter, userProfile);
    const taskInfo = replyPoolData.tasks.find(t => t.letterId === letter.id);
    return {
      id: letter.id,
      letterId: letter.id,
      title: letter.title,
      content: letter.content?.substring(0, 150) + (letter.content?.length > 150 ? '...' : ''),
      emotions: letter.emotions || [],
      recipientType: letter.recipientType,
      recipient: letter.recipient,
      senderName: letter.isAnonymous ? '匿名星人' : letter.senderName,
      isAnonymous: letter.isAnonymous,
      repliesCount: letter.replies?.length || 0,
      createdAt: letter.createdAt,
      matchScore: matchResult.score,
      matchDetails: matchResult.details,
      matchMaxScore: matchResult.maxScore,
      replyDeadline: taskInfo?.replyDeadline || null,
      rewardStars: taskInfo?.rewardStars || 10
    };
  });

  letters.sort((a, b) => b.matchScore - a.matchScore);

  return {
    tasks: letters.slice(0, limit),
    total: letters.length,
    matchRules: Object.entries(MATCH_RULES).map(([key, val]) => ({
      key,
      label: val.label,
      weight: val.weight
    }))
  };
}

function getUserReplyProfile(userId) {
  if (!userId) return null;
  const profileData = readJSON('replyProfiles.json') || { profiles: [] };
  return profileData.profiles.find(p => p.userId === userId) || null;
}

function createNotification(userId, type, title, content, relatedId = null) {
  const notifData = readJSON('notifications.json') || { notifications: [] };
  
  const notification = {
    id: generateId(),
    userId,
    type,
    title,
    content,
    relatedId,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifData.notifications.unshift(notification);
  writeJSON('notifications.json', notifData);
  
  return notification;
}

router.get('/pool', (req, res) => {
  const { limit = 20, emotion, recipientType, needReply, userId } = req.query;
  
  const filters = { emotion, recipientType, needReply: needReply === 'true' };
  const result = getReplyTaskPool(parseInt(limit), userId, filters);

  res.json({
    success: true,
    data: result.tasks,
    total: result.total,
    matchRules: result.matchRules
  });
});

router.get('/match-rules', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(MATCH_RULES).map(([key, val]) => ({
      key,
      label: val.label,
      weight: val.weight
    }))
  });
});

router.post('/reply', (req, res) => {
  const { letterId, content, emotion, anonymousName, replierId } = req.body;

  if (!letterId || !content) {
    return res.status(400).json({ success: false, message: '请填写完整的回信内容' });
  }

  if (content.length < 20) {
    return res.status(400).json({ success: false, message: '回信内容太短了，多说几句吧' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === letterId);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  let replyIdentity;
  if (anonymousName) {
    replyIdentity = { anonymousId: 'custom_' + generateId(), anonymousName };
  } else {
    replyIdentity = getAnonymousIdentity();
  }

  const reply = {
    id: generateId(),
    letterId,
    replierId: replierId || null,
    anonymousId: replyIdentity.anonymousId,
    senderName: replyIdentity.anonymousName,
    fromParallel: 'stranger_reply',
    content,
    emotion: emotion || '温暖',
    isStrangerReply: true,
    review: null,
    createdAt: new Date().toISOString()
  };

  letter.replies = letter.replies || [];
  letter.replies.push(reply);
  writeJSON('letters.json', letterData);

  const riskAnalysis = processContentRating(reply.id, 'reply', content, replierId);
  createReplyReviewTask(reply.id, letterId, riskAnalysis.level, replierId);

  if (letter.senderId && letter.senderId !== replierId) {
    createNotification(
      letter.senderId,
      'new_reply',
      '收到一封陌生回信 ✉️',
      `你的信《${letter.title}》收到了来自 ${replyIdentity.anonymousName} 的回信`,
      letterId
    );
  }

  if (replierId) {
    const statsData = readJSON('replyStats.json') || { stats: [] };
    let userStats = statsData.stats.find(s => s.userId === replierId);
    if (!userStats) {
      userStats = { userId: replierId, totalReplies: 0, totalReviews: 0, averageRating: 0, totalStars: 0 };
      statsData.stats.push(userStats);
    }
    userStats.totalReplies++;
    writeJSON('replyStats.json', statsData);
  }

  res.json({
    success: true,
    message: riskAnalysis.level !== 'safe'
      ? '回信已寄出。我们会留意内容安全，如有需要守护员会介入。愿温暖传递 ✨'
      : '回信已寄出，愿温暖传递 ✨',
    data: {
      reply: {
        ...reply,
        riskAnalysis
      },
      anonymousIdentity: replyIdentity
    }
  });
});

router.get('/anonymous-identities', (req, res) => {
  const shuffled = [...ANONYMOUS_AVATARS].sort(() => Math.random() - 0.5);
  res.json({
    success: true,
    data: shuffled.slice(0, 6)
  });
});

router.post('/generate-identity', (req, res) => {
  const identity = getAnonymousIdentity();
  res.json({
    success: true,
    data: identity
  });
});

router.post('/review', (req, res) => {
  const { replyId, rating, tags, comment, reviewerId } = req.body;

  if (!replyId || rating === undefined) {
    return res.status(400).json({ success: false, message: '请选择评分' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: '评分需在1-5星之间' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  let targetReply = null;
  let targetLetter = null;

  for (const letter of letterData.letters) {
    const reply = letter.replies?.find(r => r.id === replyId);
    if (reply) {
      targetReply = reply;
      targetLetter = letter;
      break;
    }
  }

  if (!targetReply) {
    return res.status(404).json({ success: false, message: '回信不存在' });
  }

  if (targetReply.review) {
    return res.status(400).json({ success: false, message: '已经评价过了哦' });
  }

  targetReply.review = {
    rating: parseInt(rating),
    tags: tags || [],
    comment: comment || '',
    reviewerId: reviewerId || null,
    createdAt: new Date().toISOString()
  };

  writeJSON('letters.json', letterData);

  if (targetReply.replierId) {
    const statsData = readJSON('replyStats.json') || { stats: [] };
    let userStats = statsData.stats.find(s => s.userId === targetReply.replierId);
    if (!userStats) {
      userStats = { userId: targetReply.replierId, totalReplies: 0, totalReviews: 0, averageRating: 0, totalStars: 0 };
      statsData.stats.push(userStats);
    }
    userStats.totalReviews++;
    userStats.totalStars += parseInt(rating);
    userStats.averageRating = Math.round((userStats.totalStars / userStats.totalReviews) * 10) / 10;
    writeJSON('replyStats.json', statsData);

    createNotification(
      targetReply.replierId,
      'reply_reviewed',
      '回信收到评价 ⭐',
      `你的回信收到了 ${rating} 星评价`,
      targetLetter?.id
    );
  }

  res.json({
    success: true,
    message: '评价已提交，感谢你的反馈 🌟',
    data: { review: targetReply.review }
  });
});

router.get('/review-tags', (req, res) => {
  res.json({
    success: true,
    data: REPLY_REVIEW_TAGS
  });
});

router.get('/notifications', (req, res) => {
  const { userId, unreadOnly, page = 1, limit = 20 } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const notifData = readJSON('notifications.json') || { notifications: [] };
  let notifications = notifData.notifications.filter(n => n.userId === userId);

  if (unreadOnly === 'true') {
    notifications = notifications.filter(n => !n.read);
  }

  const unreadCount = notifData.notifications.filter(n => n.userId === userId && !n.read).length;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = notifications.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: notifications.length,
    unreadCount,
    page: pageNum,
    limit: limitNum
  });
});

router.post('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notifData = readJSON('notifications.json') || { notifications: [] };
  const notification = notifData.notifications.find(n => n.id === id);

  if (!notification) {
    return res.status(404).json({ success: false, message: '通知不存在' });
  }

  notification.read = true;
  notification.readAt = new Date().toISOString();
  writeJSON('notifications.json', notifData);

  res.json({ success: true, message: '已标记为已读' });
});

router.post('/notifications/read-all', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const notifData = readJSON('notifications.json') || { notifications: [] };
  const now = new Date().toISOString();
  
  notifData.notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      n.readAt = now;
    }
  });

  writeJSON('notifications.json', notifData);

  res.json({ success: true, message: '全部标记为已读' });
});

router.get('/user/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const statsData = readJSON('replyStats.json') || { stats: [] };
  const userStats = statsData.stats.find(s => s.userId === userId);

  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const receivedStrangerReplies = userLetters.reduce((count, letter) => {
    return count + (letter.replies?.filter(r => r.isStrangerReply)?.length || 0);
  }, 0);

  let strangerRepliesMade = 0;
  let reviewsReceived = 0;
  let totalRating = 0;
  for (const letter of letterData.letters) {
    for (const reply of letter.replies || []) {
      if (reply.replierId === userId && reply.isStrangerReply) {
        strangerRepliesMade++;
        if (reply.review) {
          reviewsReceived++;
          totalRating += reply.review.rating;
        }
      }
    }
  }

  res.json({
    success: true,
    data: {
      totalReplies: strangerRepliesMade,
      receivedReplies: receivedStrangerReplies,
      totalReviews: reviewsReceived,
      averageRating: reviewsReceived > 0 ? Math.round((totalRating / reviewsReceived) * 10) / 10 : 0,
      level: calculateReplyLevel(strangerRepliesMade),
      nextLevelProgress: getNextLevelProgress(strangerRepliesMade)
    }
  });
});

function calculateReplyLevel(count) {
  const levels = [
    { min: 0, name: '初心信使', icon: '💌' },
    { min: 3, name: '温暖传声筒', icon: '📣' },
    { min: 10, name: '星光笔友', icon: '⭐' },
    { min: 25, name: '银河回信者', icon: '🌌' },
    { min: 50, name: '时空邮差', icon: '⏰' },
    { min: 100, name: '传奇笔友', icon: '👑' }
  ];
  
  let currentLevel = levels[0];
  for (const level of levels) {
    if (count >= level.min) {
      currentLevel = level;
    }
  }
  return currentLevel;
}

function getNextLevelProgress(count) {
  const levels = [
    { min: 0, max: 3 },
    { min: 3, max: 10 },
    { min: 10, max: 25 },
    { min: 25, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: Infinity }
  ];
  
  for (const level of levels) {
    if (count >= level.min && count < level.max) {
      const progress = ((count - level.min) / (level.max - level.min)) * 100;
      return {
        current: count,
        next: level.max === Infinity ? null : level.max,
        progress: Math.min(Math.round(progress), 100)
      };
    }
  }
  return { current: count, next: null, progress: 100 };
}

router.get('/letter/:letterId/replies', (req, res) => {
  const { letterId } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === letterId);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const strangerReplies = (letter.replies || []).filter(r => r.isStrangerReply);

  res.json({
    success: true,
    data: strangerReplies,
    total: strangerReplies.length
  });
});

router.post('/profile', (req, res) => {
  const { userId, preferredEmotions, preferredTypes, bio } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const profileData = readJSON('replyProfiles.json') || { profiles: [] };
  let profile = profileData.profiles.find(p => p.userId === userId);

  if (!profile) {
    profile = { userId, createdAt: new Date().toISOString() };
    profileData.profiles.push(profile);
  }

  if (preferredEmotions) profile.preferredEmotions = preferredEmotions;
  if (preferredTypes) profile.preferredTypes = preferredTypes;
  if (bio !== undefined) profile.bio = bio;
  profile.updatedAt = new Date().toISOString();

  writeJSON('replyProfiles.json', profileData);

  res.json({
    success: true,
    message: '回信偏好已保存',
    data: profile
  });
});

router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = getUserReplyProfile(userId);

  res.json({
    success: true,
    data: profile || { userId, preferredEmotions: [], preferredTypes: [], bio: '' }
  });
});

module.exports = router;
