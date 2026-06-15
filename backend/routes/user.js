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
  const favData = readJSON('favorites.json') || { favorites: [] };

  const existing = favData.favorites.find(f => f.userId === userId && f.letterId === letterId);
  if (existing) {
    return res.status(400).json({ success: false, message: '该信件已收藏' });
  }

  favData.favorites.push({
    id: generateId(),
    userId,
    letterId,
    createdAt: new Date().toISOString()
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

module.exports = router;
