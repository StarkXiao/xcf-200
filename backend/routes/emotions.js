const express = require('express');
const router = express.Router();
const { readJSON, writeJSON } = require('../utils/db');

router.get('/', (req, res) => {
  const emotionData = readJSON('emotions.json') || { emotions: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const emotionCountMap = {};
  letterData.letters.forEach(letter => {
    if (letter.isPublic && letter.emotions) {
      letter.emotions.forEach(e => {
        emotionCountMap[e] = (emotionCountMap[e] || 0) + 1;
      });
    }
  });

  const emotions = emotionData.emotions.map(e => ({
    ...e,
    count: emotionCountMap[e.name] || 0
  })).sort((a, b) => b.count - a.count);

  res.json({ success: true, data: emotions });
});

router.get('/:name/letters', (req, res) => {
  const { name } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };

  const letters = letterData.letters
    .filter(l => l.isPublic && l.emotions && l.emotions.includes(decodeURIComponent(name)))
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

router.get('/trending', (req, res) => {
  const letterData = readJSON('letters.json') || { letters: [] };

  const emotionCountMap = {};
  letterData.letters.forEach(letter => {
    if (letter.isPublic && letter.emotions) {
      letter.emotions.forEach(e => {
        emotionCountMap[e] = (emotionCountMap[e] || 0) + 1;
      });
    }
  });

  const emotionData = readJSON('emotions.json') || { emotions: [] };

  const trending = Object.entries(emotionCountMap)
    .map(([name, count]) => {
      const info = emotionData.emotions.find(e => e.name === name);
      return {
        name,
        count,
        color: info ? info.color : '#999',
        icon: info ? info.icon : '💫'
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  res.json({ success: true, data: trending });
});

module.exports = router;
