const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }

  const userData = readJSON('users.json') || { users: [] };

  const existingEmail = userData.users.find(u => u.email === email);
  if (existingEmail) {
    return res.status(400).json({ success: false, message: '该邮箱已被注册' });
  }

  const existingName = userData.users.find(u => u.username === username);
  if (existingName) {
    return res.status(400).json({ success: false, message: '该昵称已被使用' });
  }

  const avatars = ['🌟', '🌙', '🌊', '🌸', '🌈', '🦋', '🌻', '⭐', '🐱', '🦄'];

  const newUser = {
    id: generateId(),
    username,
    email,
    password,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    bio: '',
    createdAt: new Date().toISOString(),
    sentLetters: 0,
    receivedLetters: 0
  };

  userData.users.push(newUser);
  writeJSON('users.json', userData);

  const { password: _, ...safeUser } = newUser;
  res.json({
    success: true,
    message: '注册成功，欢迎来到星邮局！',
    user: safeUser,
    token: 'token_' + newUser.id
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: '请填写邮箱和密码' });
  }

  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }

  if (user.password !== password) {
    return res.status(401).json({ success: false, message: '密码错误' });
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    message: '登录成功！',
    user: safeUser,
    token: 'token_' + user.id
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已退出登录' });
});

module.exports = router;
