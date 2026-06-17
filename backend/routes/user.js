const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const favData = readJSON('favorites.json') || { favorites: [] };

  const sentLetters = letterData.letters.filter(l => l.senderId === userId);
  const favorites = favData.favorites.filter(f => f.userId === userId);

  const { password: _, ...safeUser } = user;

  res.json({
    success: true,
    data: {
      ...safeUser,
      sentLetters: sentLetters.length,
      receivedReplies: sentLetters.reduce((sum, l) => sum + (l.replies ? l.replies.length : 0), 0),
      favoritesCount: favorites.length,
      letters: sentLetters.slice(0, 5),
      favorites: favorites.slice(0, 5)
    }
  });
});

router.put('/:userId', (req, res) => {
  const { userId } = req.params;
  const { username, bio, avatar } = req.body;

  const userData = readJSON('users.json') || { users: [] };
  const userIndex = userData.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  if (username) {
    const existingName = userData.users.find(u => u.username === username && u.id !== userId);
    if (existingName) {
      return res.status(400).json({ success: false, message: '该昵称已被使用' });
    }
    userData.users[userIndex].username = username;
  }
  if (bio !== undefined) userData.users[userIndex].bio = bio;
  if (avatar) userData.users[userIndex].avatar = avatar;

  writeJSON('users.json', userData);

  const { password: _, ...safeUser } = userData.users[userIndex];
  res.json({
    success: true,
    message: '个人资料已更新',
    data: safeUser
  });
});

router.get('/:userId/letters', (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };

  const letters = letterData.letters
    .filter(l => l.senderId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = letters.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: letters.length,
    page: pageNum,
    totalPages: Math.ceil(letters.length / limitNum)
  });
});

router.get('/:userId/favorites', (req, res) => {
  const { userId } = req.params;
  const favData = readJSON('favorites.json') || { favorites: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const userFavs = favData.favorites.filter(f => f.userId === userId);
  const favLetters = userFavs.map(fav => {
    const letter = letterData.letters.find(l => l.id === fav.letterId);
    return letter ? { ...letter, favoritedAt: fav.createdAt } : null;
  }).filter(Boolean);

  res.json({
    success: true,
    data: favLetters,
    total: favLetters.length
  });
});

router.post('/:userId/favorites/:letterId', (req, res) => {
  const { userId, letterId } = req.params;
  const { groupId } = req.body || {};
  const favData = readJSON('favorites.json') || { favorites: [] };

  const existing = favData.favorites.find(f => f.userId === userId && f.letterId === letterId);
  if (existing) {
    return res.status(400).json({ success: false, message: '该信件已收藏' });
  }

  const now = new Date().toISOString();
  favData.favorites.push({
    id: generateId(),
    userId,
    letterId,
    groupId: groupId || null,
    createdAt: now,
    favoritedAt: now
  });

  writeJSON('favorites.json', favData);

  res.json({
    success: true,
    message: '已收藏到星之集邮册 💌'
  });
});

router.delete('/:userId/favorites/:letterId', (req, res) => {
  const { userId, letterId } = req.params;
  const favData = readJSON('favorites.json') || { favorites: [] };

  favData.favorites = favData.favorites.filter(f => !(f.userId === userId && f.letterId === letterId));
  writeJSON('favorites.json', favData);

  res.json({
    success: true,
    message: '已取消收藏'
  });
});

router.get('/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const favData = readJSON('favorites.json') || { favorites: [] };

  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const totalLikes = userLetters.reduce((sum, l) => sum + (l.likes || 0), 0);
  const totalReplies = userLetters.reduce((sum, l) => sum + (l.replies ? l.replies.length : 0), 0);
  const emotionStats = {};

  userLetters.forEach(l => {
    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionStats[e] = (emotionStats[e] || 0) + 1;
      });
    }
  });

  res.json({
    success: true,
    data: {
      totalLetters: userLetters.length,
      totalLikes,
      totalReplies,
      totalFavorites: favData.favorites.filter(f => f.userId === userId).length,
      emotionStats
    }
  });
});

router.get('/:userId/interactions', (req, res) => {
  const { userId } = req.params;
  const { type, timeRange, emotion, sort = 'latest' } = req.query;

  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const favData = readJSON('favorites.json') || { favorites: [] };
  const viewData = readJSON('letterViews.json') || { views: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };

  const userLetters = letterData.letters.filter(l => l.senderId === userId);
  const userLetterIds = new Set(userLetters.map(l => l.id));

  const now = Date.now();
  let startTime = null;
  switch (timeRange) {
    case 'today':
      startTime = new Date();
      startTime.setHours(0, 0, 0, 0);
      startTime = startTime.getTime();
      break;
    case 'week':
      startTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      startTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    case 'year':
      startTime = now - 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      startTime = null;
  }

  const interactions = [];

  if (!type || type === 'like') {
    userLetters.forEach(letter => {
      if (letter.likes > 0) {
        for (let i = 0; i < Math.min(letter.likes, 3); i++) {
          const likeTime = new Date(new Date(letter.createdAt).getTime() + (i + 1) * 3600000).toISOString();
          if (!startTime || new Date(likeTime).getTime() >= startTime) {
            if (!emotion || (letter.emotions && letter.emotions.includes(emotion))) {
              interactions.push({
                id: `like_${letter.id}_${i}`,
                type: 'like',
                letterId: letter.id,
                letterTitle: letter.title,
                letterEmotions: letter.emotions || [],
                count: letter.likes,
                createdAt: likeTime,
                icon: '⭐',
                description: `你的信《${letter.title}》收到了 ${letter.likes} 颗星星`
              });
            }
          }
        }
      }
    });
  }

  if (!type || type === 'reply') {
    userLetters.forEach(letter => {
      if (letter.replies && letter.replies.length > 0) {
        letter.replies.forEach(reply => {
          if (!startTime || new Date(reply.createdAt).getTime() >= startTime) {
            if (!emotion || reply.emotion === emotion || (letter.emotions && letter.emotions.includes(emotion))) {
              interactions.push({
                id: `reply_${reply.id}`,
                type: 'reply',
                letterId: letter.id,
                letterTitle: letter.title,
                letterEmotions: letter.emotions || [],
                replyId: reply.id,
                replyContent: reply.content.substring(0, 80),
                replySender: reply.senderName,
                replyEmotion: reply.emotion,
                createdAt: reply.createdAt,
                icon: '💌',
                description: `${reply.senderName} 给你的信《${letter.title}》回信了`
              });
            }
          }
        });
      }
    });
  }

  if (!type || type === 'favorite') {
    const userFavorites = favData.favorites.filter(f => f.userId === userId);
    userFavorites.forEach(fav => {
      const letter = letterData.letters.find(l => l.id === fav.letterId);
      if (letter) {
        if (!startTime || new Date(fav.createdAt).getTime() >= startTime) {
          if (!emotion || (letter.emotions && letter.emotions.includes(emotion))) {
            interactions.push({
              id: `fav_${fav.id}`,
              type: 'favorite',
              letterId: letter.id,
              letterTitle: letter.title,
              letterEmotions: letter.emotions || [],
              favoriteId: fav.id,
              createdAt: fav.createdAt,
              icon: '📌',
              description: `你收藏了《${letter.title}》`
            });
          }
        }
      }
    });
  }

  if (!type || type === 'view') {
    const letterViews = viewData.views.filter(v => v.letterOwnerId === userId);
    const viewCountMap = {};
    letterViews.forEach(view => {
      if (!startTime || new Date(view.createdAt).getTime() >= startTime) {
        const letter = letterData.letters.find(l => l.id === view.letterId);
        if (letter) {
          if (!emotion || (letter.emotions && letter.emotions.includes(emotion))) {
            if (!viewCountMap[view.letterId]) {
              viewCountMap[view.letterId] = {
                letter,
                count: 0,
                lastViewAt: view.createdAt
              };
            }
            viewCountMap[view.letterId].count++;
            if (new Date(view.createdAt).getTime() > new Date(viewCountMap[view.letterId].lastViewAt).getTime()) {
              viewCountMap[view.letterId].lastViewAt = view.createdAt;
            }
          }
        }
      }
    });

    Object.entries(viewCountMap).forEach(([letterId, info]) => {
      interactions.push({
        id: `view_${letterId}`,
        type: 'view',
        letterId,
        letterTitle: info.letter.title,
        letterEmotions: info.letter.emotions || [],
        viewCount: info.count,
        totalViews: info.letter.views || info.count,
        createdAt: info.lastViewAt,
        icon: '👁️',
        description: `你的信《${info.letter.title}》被浏览了 ${info.count} 次`
      });
    });

    userLetters.forEach(letter => {
      if ((letter.views || 0) > 0 && !viewCountMap[letter.id]) {
        if (!emotion || (letter.emotions && letter.emotions.includes(emotion))) {
          if (!startTime || new Date(letter.createdAt).getTime() >= startTime) {
            interactions.push({
              id: `view_${letter.id}`,
              type: 'view',
              letterId: letter.id,
              letterTitle: letter.title,
              letterEmotions: letter.emotions || [],
              viewCount: letter.views,
              totalViews: letter.views,
              createdAt: letter.createdAt,
              icon: '👁️',
              description: `你的信《${letter.title}》被浏览了 ${letter.views} 次`
            });
          }
        }
      }
    });
  }

  if (sort === 'latest') {
    interactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'oldest') {
    interactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const typeStats = {
    total: interactions.length,
    like: interactions.filter(i => i.type === 'like').length,
    reply: interactions.filter(i => i.type === 'reply').length,
    favorite: interactions.filter(i => i.type === 'favorite').length,
    view: interactions.filter(i => i.type === 'view').length,
  };

  const emotionStats = {};
  interactions.forEach(i => {
    (i.letterEmotions || []).forEach(e => {
      emotionStats[e] = (emotionStats[e] || 0) + 1;
    });
  });

  const availableEmotions = emotionData.emotions
    .filter(e => emotionStats[e.name])
    .map(e => ({
      ...e,
      count: emotionStats[e.name]
    }))
    .sort((a, b) => b.count - a.count);

  res.json({
    success: true,
    data: interactions,
    stats: typeStats,
    emotionStats: availableEmotions,
    total: interactions.length
  });
});

module.exports = router;
