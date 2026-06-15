const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

function generateAutoReply(letter) {
  const replies = [
    {
      fromParallel: 'star_messenger_' + Math.floor(Math.random() * 100),
      senderName: '星光信使',
      content: `你的信已被银河邮局收录，编号 #${Math.floor(Math.random() * 999999)}。它将穿越时空，安全送达收件人手中。`,
      emotion: '神秘'
    },
    {
      fromParallel: 'echo_world_' + Math.floor(Math.random() * 100),
      senderName: '世界回声',
      content: `在某个平行时空里，有人收到了你的心意，并回以同样的温暖。思念永远不会被辜负。`,
      emotion: '温暖'
    },
    {
      fromParallel: 'time_traveler_' + Math.floor(Math.random() * 100),
      senderName: '时光旅人',
      content: `我是穿梭在时间长河里的旅者，偶然遇见了你的信。我会把它小心护送到目的地，放心。`,
      emotion: '希望'
    }
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

router.get('/', (req, res) => {
  const { page = 1, limit = 10, emotion, keyword, sort = 'latest' } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };

  let letters = [...letterData.letters].filter(l => l.isPublic);

  if (emotion) {
    letters = letters.filter(l => l.emotions.includes(emotion));
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
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = letters.slice(start, start + limitNum);

  const simpleLetters = paginated.map(l => ({
    id: l.id,
    senderName: l.isAnonymous ? '匿名星人' : l.senderName,
    recipient: l.recipient,
    recipientType: l.recipientType,
    title: l.title,
    content: l.content.substring(0, 100) + (l.content.length > 100 ? '...' : ''),
    emotions: l.emotions,
    likes: l.likes,
    repliesCount: l.replies ? l.replies.length : 0,
    createdAt: l.createdAt
  }));

  res.json({
    success: true,
    data: simpleLetters,
    total: letters.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(letters.length / limitNum)
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const displayLetter = {
    ...letter,
    senderName: letter.isAnonymous ? '匿名星人' : letter.senderName
  };

  res.json({ success: true, data: displayLetter });
});

router.post('/', (req, res) => {
  const {
    senderId, senderName, recipient, recipientType,
    title, content, emotions, isPublic, isAnonymous, deliverAt
  } = req.body;

  if (!senderId || !title || !content || !recipient) {
    return res.status(400).json({ success: false, message: '请填写必要信息' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };

  const newLetter = {
    id: generateId(),
    senderId,
    senderName: senderName || '无名旅人',
    recipient,
    recipientType: recipientType || 'future',
    title,
    content,
    emotions: emotions || [],
    isPublic: isPublic !== undefined ? isPublic : true,
    isAnonymous: isAnonymous !== undefined ? isAnonymous : false,
    likes: 0,
    createdAt: new Date().toISOString(),
    deliverAt: deliverAt || new Date().toISOString(),
    replies: []
  };

  if (Math.random() > 0.4) {
    const autoReply = generateAutoReply(newLetter);
    newLetter.replies.push({
      id: generateId(),
      letterId: newLetter.id,
      ...autoReply,
      createdAt: new Date(Date.now() + Math.random() * 3600000).toISOString()
    });
  }

  letterData.letters.unshift(newLetter);
  writeJSON('letters.json', letterData);

  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === senderId);
  if (user) {
    user.sentLetters = (user.sentLetters || 0) + 1;
    writeJSON('users.json', userData);
  }

  res.json({
    success: true,
    message: '信件已寄出，愿星光指引它到达',
    data: newLetter
  });
});

router.post('/:id/like', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  letter.likes = (letter.likes || 0) + 1;
  writeJSON('letters.json', letterData);

  res.json({ success: true, likes: letter.likes, message: '已送上一颗小星星 ✨' });
});

router.post('/:id/reply', (req, res) => {
  const { id } = req.params;
  const { fromParallel, senderName, content, emotion } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: '回信内容不能为空' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const reply = {
    id: generateId(),
    letterId: id,
    fromParallel: fromParallel || ('world_' + Math.floor(Math.random() * 1000)),
    senderName: senderName || '来自平行世界的回音',
    content,
    emotion: emotion || '温暖',
    createdAt: new Date().toISOString()
  };

  letter.replies = letter.replies || [];
  letter.replies.push(reply);
  writeJSON('letters.json', letterData);

  res.json({
    success: true,
    message: '回信已送达',
    data: reply
  });
});

router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { type = 'sent' } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };

  let letters;
  if (type === 'sent') {
    letters = letterData.letters.filter(l => l.senderId === userId);
  } else if (type === 'replies') {
    letters = letterData.letters.filter(l =>
      l.replies && l.replies.some(r => r.letterId)
    ).map(l => ({
      ...l,
      replies: l.replies
    }));
  }

  res.json({
    success: true,
    data: letters,
    total: letters.length
  });
});

module.exports = router;
