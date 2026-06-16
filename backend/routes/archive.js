const express = require('express');
const router = express.Router();
const { readJSON } = require('../utils/db');

const RECIPIENT_TYPES = [
  { key: 'future', label: '未来', icon: '🔮' },
  { key: 'past', label: '过去', icon: '🕰️' },
  { key: 'parallel', label: '平行世界', icon: '🌌' },
  { key: 'unknown', label: '未知', icon: '✨' },
];

function getTimePeriod(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { key: 'today', label: '今天', order: 0 };
  if (diffDays === 1) return { key: 'yesterday', label: '昨天', order: 1 };
  if (diffDays < 7) return { key: 'this_week', label: '本周', order: 2 };
  if (diffDays < 30) return { key: 'this_month', label: '本月', order: 3 };

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const nowYear = now.getFullYear();

  if (year === nowYear) {
    return { key: `${year}_${month}`, label: `${month}月`, order: 10 + (12 - month) };
  }
  return { key: `${year}`, label: `${year}年`, order: 100 + (nowYear - year) };
}

function getSimpleLetter(l) {
  return {
    id: l.id,
    senderName: l.isAnonymous ? '匿名星人' : l.senderName,
    senderId: l.senderId,
    recipient: l.recipient,
    recipientType: l.recipientType,
    title: l.title,
    content: l.content.substring(0, 100) + (l.content.length > 100 ? '...' : ''),
    emotions: l.emotions,
    likes: l.likes,
    repliesCount: l.replies ? l.replies.length : 0,
    createdAt: l.createdAt,
    isPublic: l.isPublic,
  };
}

router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 12,
    emotion,
    recipientType,
    timePeriod,
    keyword,
    sort = 'latest',
    scope = 'public',
    userId,
  } = req.query;

  const letterData = readJSON('letters.json') || { letters: [] };
  let letters = [...letterData.letters];

  if (scope === 'public') {
    letters = letters.filter(l => l.isPublic);
  } else if (scope === 'user' && userId) {
    letters = letters.filter(l => l.senderId === userId);
  } else if (scope === 'favorites' && userId) {
    const favData = readJSON('favorites.json') || { favorites: [] };
    const userFavIds = favData.favorites
      .filter(f => f.userId === userId)
      .map(f => f.letterId);
    letters = letters.filter(l => userFavIds.includes(l.id));
  }

  if (emotion) {
    const emotionList = Array.isArray(emotion) ? emotion : [emotion];
    letters = letters.filter(l => emotionList.some(e => l.emotions.includes(e)));
  }

  if (recipientType) {
    const typeList = Array.isArray(recipientType) ? recipientType : [recipientType];
    letters = letters.filter(l => typeList.includes(l.recipientType));
  }

  if (timePeriod) {
    letters = letters.filter(l => getTimePeriod(l.createdAt).key === timePeriod);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    letters = letters.filter(l =>
      l.title.toLowerCase().includes(kw) ||
      l.content.toLowerCase().includes(kw) ||
      l.recipient.toLowerCase().includes(kw)
    );
  }

  if (sort === 'latest') {
    letters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'popular') {
    letters.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'oldest') {
    letters.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const total = letters.length;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = letters.slice(start, start + limitNum);

  const simpleLetters = paginated.map(getSimpleLetter);

  res.json({
    success: true,
    data: simpleLetters,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.get('/timeline', (req, res) => {
  const { scope = 'public', userId, emotion, recipientType } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };
  let letters = [...letterData.letters];

  if (scope === 'public') {
    letters = letters.filter(l => l.isPublic);
  } else if (scope === 'user' && userId) {
    letters = letters.filter(l => l.senderId === userId);
  } else if (scope === 'favorites' && userId) {
    const favData = readJSON('favorites.json') || { favorites: [] };
    const userFavIds = favData.favorites
      .filter(f => f.userId === userId)
      .map(f => f.letterId);
    letters = letters.filter(l => userFavIds.includes(l.id));
  }

  if (emotion) {
    const emotionList = Array.isArray(emotion) ? emotion : [emotion];
    letters = letters.filter(l => emotionList.some(e => l.emotions.includes(e)));
  }

  if (recipientType) {
    const typeList = Array.isArray(recipientType) ? recipientType : [recipientType];
    letters = letters.filter(l => typeList.includes(l.recipientType));
  }

  const timelineMap = {};
  letters.forEach(l => {
    const period = getTimePeriod(l.createdAt);
    if (!timelineMap[period.key]) {
      timelineMap[period.key] = {
        key: period.key,
        label: period.label,
        order: period.order,
        count: 0,
        letters: [],
      };
    }
    timelineMap[period.key].count++;
    timelineMap[period.key].letters.push(getSimpleLetter(l));
  });

  const timeline = Object.values(timelineMap)
    .sort((a, b) => a.order - b.order)
    .map(t => ({
      ...t,
      letters: t.letters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    }));

  res.json({
    success: true,
    data: timeline,
    total: letters.length,
    totalPeriods: timeline.length,
  });
});

router.get('/filters', (req, res) => {
  const { scope = 'public', userId } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };
  let letters = [...letterData.letters];

  if (scope === 'public') {
    letters = letters.filter(l => l.isPublic);
  } else if (scope === 'user' && userId) {
    letters = letters.filter(l => l.senderId === userId);
  } else if (scope === 'favorites' && userId) {
    const favData = readJSON('favorites.json') || { favorites: [] };
    const userFavIds = favData.favorites
      .filter(f => f.userId === userId)
      .map(f => f.letterId);
    letters = letters.filter(l => userFavIds.includes(l.id));
  }

  const emotionCounts = {};
  const recipientCounts = {};
  const periodSet = new Set();

  letters.forEach(l => {
    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    }
    recipientCounts[l.recipientType] = (recipientCounts[l.recipientType] || 0) + 1;
    periodSet.add(getTimePeriod(l.createdAt).key);
  });

  const emotions = emotionData.emotions
    .filter(e => emotionCounts[e.name])
    .map(e => ({
      ...e,
      archiveCount: emotionCounts[e.name] || 0,
    }))
    .sort((a, b) => b.archiveCount - a.archiveCount);

  const recipientTypes = RECIPIENT_TYPES
    .filter(t => recipientCounts[t.key])
    .map(t => ({
      ...t,
      count: recipientCounts[t.key] || 0,
    }));

  res.json({
    success: true,
    data: {
      emotions,
      recipientTypes,
      timePeriods: Array.from(periodSet),
      totalLetters: letters.length,
    },
  });
});

router.get('/user/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const favData = readJSON('favorites.json') || { favorites: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };

  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const publicLetters = userLetters.filter(l => l.isPublic);
  const privateLetters = userLetters.filter(l => !l.isPublic);

  const userFavIds = favData.favorites.filter(f => f.userId === userId).map(f => f.letterId);
  const favoriteLetters = letterData.letters.filter(l => userFavIds.includes(l.id));

  const emotionStats = {};
  const recipientStats = {};
  const monthlyStats = {};
  const timePeriodStats = {};

  userLetters.forEach(l => {
    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionStats[e] = (emotionStats[e] || 0) + 1;
      });
    }
    recipientStats[l.recipientType] = (recipientStats[l.recipientType] || 0) + 1;

    const date = new Date(l.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;

    const period = getTimePeriod(l.createdAt);
    timePeriodStats[period.key] = (timePeriodStats[period.key] || 0) + 1;
  });

  const topEmotions = Object.entries(emotionStats)
    .map(([name, count]) => {
      const emoInfo = emotionData.emotions.find(e => e.name === name);
      return {
        name,
        count,
        color: emoInfo?.color || '#888',
        icon: emoInfo?.icon || '✨',
        percentage: userLetters.length > 0 ? Math.round((count / userLetters.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalLikes = userLetters.reduce((sum, l) => sum + (l.likes || 0), 0);
  const totalReplies = userLetters.reduce((sum, l) => sum + (l.replies ? l.replies.length : 0), 0);

  const avgEmotionsPerLetter = userLetters.length > 0
    ? Math.round((userLetters.reduce((sum, l) => sum + (l.emotions?.length || 0), 0) / userLetters.length) * 10) / 10
    : 0;

  const lettersWithReplies = userLetters.filter(l => l.replies && l.replies.length > 0).length;
  const replyRate = userLetters.length > 0 ? Math.round((lettersWithReplies / userLetters.length) * 100) : 0;

  const sortedMonths = Object.entries(monthlyStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  const mostUsedRecipientType = Object.entries(recipientStats)
    .sort((a, b) => b[1] - a[1])[0];

  const personaTags = [];
  if (userLetters.length >= 5) personaTags.push({ icon: '✍️', label: '勤奋笔友', desc: '已寄出5封以上信件' });
  if (emotionStats['治愈'] >= 3 || emotionStats['温暖'] >= 3) personaTags.push({ icon: '🌿', label: '治愈系星人', desc: '常寄出温暖治愈的信件' });
  if (recipientStats['future'] && recipientStats['future'] >= userLetters.length * 0.5) personaTags.push({ icon: '🔮', label: '未来探索者', desc: '偏爱给未来写信' });
  if (recipientStats['past'] && recipientStats['past'] >= userLetters.length * 0.5) personaTags.push({ icon: '🕰️', label: '时光拾荒者', desc: '常回望过去的时光' });
  if (recipientStats['parallel'] && recipientStats['parallel'] >= userLetters.length * 0.5) personaTags.push({ icon: '🌌', label: '平行旅人', desc: '心系多元宇宙' });
  if (totalLikes >= 100) personaTags.push({ icon: '⭐', label: '人气作者', desc: '累计获得100+星星' });
  if (replyRate >= 50) personaTags.push({ icon: '💌', label: '回音体质', desc: '超过半数信件收到回信' });
  if (favoriteLetters.length >= 5) personaTags.push({ icon: '📚', label: '集邮爱好者', desc: '收藏了5封以上信件' });

  res.json({
    success: true,
    data: {
      overview: {
        totalLetters: userLetters.length,
        publicLetters: publicLetters.length,
        privateLetters: privateLetters.length,
        favoriteLetters: favoriteLetters.length,
        totalLikes,
        totalReplies,
        avgEmotionsPerLetter,
        replyRate,
        lettersWithReplies,
      },
      topEmotions,
      emotionStats,
      recipientStats: RECIPIENT_TYPES.map(t => ({
        ...t,
        count: recipientStats[t.key] || 0,
        percentage: userLetters.length > 0 ? Math.round(((recipientStats[t.key] || 0) / userLetters.length) * 100) : 0,
      })).sort((a, b) => b.count - a.count),
      monthlyTimeline: sortedMonths,
      timePeriodStats,
      mostUsedRecipientType: mostUsedRecipientType
        ? { key: mostUsedRecipientType[0], count: mostUsedRecipientType[1] }
        : null,
      personaTags,
      joinDate: user.createdAt,
    },
  });
});

router.get('/letter/:letterId/traceback', (req, res) => {
  const { letterId } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };

  const letter = letterData.letters.find(l => l.id === letterId);
  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const sameEmotionLetters = letterData.letters
    .filter(l => l.id !== letterId && l.isPublic && l.emotions && l.emotions.some(e => letter.emotions.includes(e)))
    .map(l => {
      const sharedCount = l.emotions.filter(e => letter.emotions.includes(e)).length;
      return { ...getSimpleLetter(l), sharedEmotions: sharedCount };
    })
    .sort((a, b) => b.sharedEmotions - a.sharedEmotions || b.likes - a.likes)
    .slice(0, 8);

  const sameRecipientLetters = letterData.letters
    .filter(l => l.id !== letterId && l.isPublic && l.recipientType === letter.recipientType)
    .map(getSimpleLetter)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 6);

  const sameSenderLetters = letterData.letters
    .filter(l => l.id !== letterId && l.senderId === letter.senderId && l.isPublic)
    .map(getSimpleLetter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const letterPeriod = getTimePeriod(letter.createdAt);
  const samePeriodLetters = letterData.letters
    .filter(l => l.id !== letterId && l.isPublic && getTimePeriod(l.createdAt).key === letterPeriod.key)
    .map(getSimpleLetter)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 6);

  const emotionDetail = (letter.emotions || []).map(name => {
    const info = emotionData.emotions.find(e => e.name === name);
    return {
      name,
      color: info?.color || '#888',
      icon: info?.icon || '✨',
      relatedCount: letterData.letters.filter(l => l.isPublic && l.emotions?.includes(name)).length,
    };
  });

  const recipientInfo = RECIPIENT_TYPES.find(t => t.key === letter.recipientType) || RECIPIENT_TYPES[3];
  const sameRecipientCount = letterData.letters.filter(l => l.isPublic && l.recipientType === letter.recipientType).length;

  res.json({
    success: true,
    data: {
      currentLetter: getSimpleLetter(letter),
      emotionDetail,
      sameEmotionLetters,
      sameRecipientLetters,
      sameSenderLetters,
      samePeriodLetters,
      periodInfo: { ...letterPeriod, count: samePeriodLetters.length },
      recipientInfo: { ...recipientInfo, totalCount: sameRecipientCount },
    },
  });
});

module.exports = router;
