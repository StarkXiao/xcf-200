const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const SCHEDULED_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RESENT: 'resent',
};

const REMINDER_TYPES = {
  BEFORE_24H: 'before_24h',
  BEFORE_1H: 'before_1h',
  ON_TIME: 'on_time',
};

function addNotification(userId, type, title, content, relatedId) {
  const notifData = readJSON('notifications.json') || { notifications: [] };
  const notification = {
    id: generateId(),
    userId,
    type,
    title,
    content,
    relatedId: relatedId || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifData.notifications.unshift(notification);
  writeJSON('notifications.json', notifData);
  return notification;
}

function createLetterVersion(letter, versionNote) {
  const versionData = readJSON('letter-versions.json') || { versions: [] };
  const version = {
    id: generateId(),
    letterId: letter.id,
    version: getNextVersionNumber(letter.id),
    title: letter.title,
    content: letter.content,
    recipient: letter.recipient,
    recipientType: letter.recipientType,
    emotions: letter.emotions || [],
    isPublic: letter.isPublic,
    isAnonymous: letter.isAnonymous,
    versionNote: versionNote || '创建版本',
    createdAt: new Date().toISOString(),
    createdBy: letter.senderId,
  };
  versionData.versions.unshift(version);
  writeJSON('letter-versions.json', versionData);
  return version;
}

function getNextVersionNumber(letterId) {
  const versionData = readJSON('letter-versions.json') || { versions: [] };
  const letterVersions = versionData.versions.filter(v => v.letterId === letterId);
  if (letterVersions.length === 0) return 1;
  return Math.max(...letterVersions.map(v => v.version)) + 1;
}

function getScheduledLetterStatus(scheduledLetter) {
  const now = Date.now();
  const deliverTime = new Date(scheduledLetter.scheduledDeliverAt).getTime();
  
  if (scheduledLetter.status === SCHEDULED_STATUS.CANCELLED) {
    return SCHEDULED_STATUS.CANCELLED;
  }
  
  if (scheduledLetter.status === SCHEDULED_STATUS.RESENT) {
    return SCHEDULED_STATUS.RESENT;
  }
  
  if (now >= deliverTime) {
    return SCHEDULED_STATUS.DELIVERED;
  }
  
  return SCHEDULED_STATUS.PENDING;
}

function calculateTimeRemaining(targetDate) {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
}

router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { status = 'all', page = 1, limit = 10 } = req.query;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  
  let scheduledLetters = scheduledData.scheduledLetters.filter(s => s.senderId === userId);
  
  if (status !== 'all') {
    scheduledLetters = scheduledLetters.filter(s => {
      const currentStatus = getScheduledLetterStatus(s);
      return currentStatus === status;
    });
  }
  
  scheduledLetters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = scheduledLetters.slice(start, start + limitNum);
  
  const enrichedLetters = paginated.map(s => ({
    ...s,
    currentStatus: getScheduledLetterStatus(s),
    timeRemaining: calculateTimeRemaining(s.scheduledDeliverAt),
  }));
  
  res.json({
    success: true,
    data: enrichedLetters,
    total: scheduledLetters.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(scheduledLetters.length / limitNum),
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === scheduled.letterId);
  
  const enriched = {
    ...scheduled,
    currentStatus: getScheduledLetterStatus(scheduled),
    timeRemaining: calculateTimeRemaining(scheduled.scheduledDeliverAt),
    letter: letter || null,
  };
  
  res.json({ success: true, data: enriched });
});

router.post('/schedule', (req, res) => {
  const {
    senderId, senderName, recipient, recipientType,
    title, content, emotions, isPublic, isAnonymous,
    scheduledDeliverAt, reminderSettings, versionNote,
  } = req.body;
  
  if (!senderId || !title || !content || !recipient || !scheduledDeliverAt) {
    return res.status(400).json({ success: false, message: '请填写必要信息' });
  }
  
  const deliverTime = new Date(scheduledDeliverAt).getTime();
  if (deliverTime <= Date.now()) {
    return res.status(400).json({ success: false, message: '预约送达时间必须晚于当前时间' });
  }
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  
  const newLetter = {
    id: generateId(),
    senderId,
    senderName: senderName || '无名旅人',
    recipient,
    recipientType: recipientType || 'future',
    title,
    content,
    emotions: emotions || [],
    isPublic: isPublic !== undefined ? isPublic : false,
    isAnonymous: isAnonymous !== undefined ? isAnonymous : false,
    likes: 0,
    createdAt: new Date().toISOString(),
    deliverAt: scheduledDeliverAt,
    isScheduled: true,
    replies: [],
  };
  
  const scheduledLetter = {
    id: generateId(),
    letterId: newLetter.id,
    senderId,
    title,
    recipient,
    recipientType: recipientType || 'future',
    scheduledDeliverAt,
    originalDeliverAt: scheduledDeliverAt,
    status: SCHEDULED_STATUS.PENDING,
    reminderSettings: reminderSettings || {
      before24h: true,
      before1h: true,
      onTime: true,
    },
    resentCount: 0,
    versionCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  letterData.letters.unshift(newLetter);
  writeJSON('letters.json', letterData);
  
  scheduledData.scheduledLetters.unshift(scheduledLetter);
  writeJSON('scheduled-letters.json', scheduledData);
  
  createLetterVersion(newLetter, versionNote || '初始版本');
  
  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === senderId);
  if (user) {
    user.sentLetters = (user.sentLetters || 0) + 1;
    writeJSON('users.json', userData);
  }
  
  addNotification(
    senderId,
    'scheduled_created',
    '预约信件已创建 ✉️',
    `你的信《${title}》已预约将于 ${new Date(scheduledDeliverAt).toLocaleString('zh-CN')} 送达`,
    scheduledLetter.id
  );
  
  res.json({
    success: true,
    message: '预约信件已创建，它会在时光邮局中静静等待送达的那一刻',
    data: {
      scheduledLetter: {
        ...scheduledLetter,
        currentStatus: SCHEDULED_STATUS.PENDING,
        timeRemaining: calculateTimeRemaining(scheduledDeliverAt),
      },
      letter: newLetter,
    },
  });
});

router.post('/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const currentStatus = getScheduledLetterStatus(scheduled);
  if (currentStatus === SCHEDULED_STATUS.DELIVERED) {
    return res.status(400).json({ success: false, message: '信件已送达，无法撤回' });
  }
  
  if (currentStatus === SCHEDULED_STATUS.CANCELLED) {
    return res.status(400).json({ success: false, message: '信件已撤回' });
  }
  
  scheduled.status = SCHEDULED_STATUS.CANCELLED;
  scheduled.cancelledAt = new Date().toISOString();
  scheduled.cancelReason = reason || '';
  scheduled.updatedAt = new Date().toISOString();
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === scheduled.letterId);
  if (letter) {
    letter.isCancelled = true;
    letter.cancelledAt = new Date().toISOString();
    writeJSON('letters.json', letterData);
  }
  
  writeJSON('scheduled-letters.json', scheduledData);
  
  addNotification(
    scheduled.senderId,
    'scheduled_cancelled',
    '预约信件已撤回 📭',
    `你撤回了预约信件《${scheduled.title}》`,
    scheduled.id
  );
  
  res.json({
    success: true,
    message: '预约信件已成功撤回',
    data: {
      ...scheduled,
      currentStatus: SCHEDULED_STATUS.CANCELLED,
    },
  });
});

router.post('/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { newDeliverAt, reason } = req.body;
  
  if (!newDeliverAt) {
    return res.status(400).json({ success: false, message: '请提供新的送达时间' });
  }
  
  const deliverTime = new Date(newDeliverAt).getTime();
  if (deliverTime <= Date.now()) {
    return res.status(400).json({ success: false, message: '新的送达时间必须晚于当前时间' });
  }
  
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const currentStatus = getScheduledLetterStatus(scheduled);
  if (currentStatus === SCHEDULED_STATUS.DELIVERED) {
    return res.status(400).json({ success: false, message: '信件已送达，无法修改送达时间' });
  }
  
  if (currentStatus === SCHEDULED_STATUS.CANCELLED) {
    return res.status(400).json({ success: false, message: '信件已撤回，无法修改送达时间' });
  }
  
  const oldDeliverAt = scheduled.scheduledDeliverAt;
  scheduled.scheduledDeliverAt = newDeliverAt;
  scheduled.updatedAt = new Date().toISOString();
  scheduled.rescheduleCount = (scheduled.rescheduleCount || 0) + 1;
  
  if (!scheduled.rescheduleHistory) {
    scheduled.rescheduleHistory = [];
  }
  scheduled.rescheduleHistory.push({
    from: oldDeliverAt,
    to: newDeliverAt,
    reason: reason || '',
    changedAt: new Date().toISOString(),
  });
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === scheduled.letterId);
  if (letter) {
    letter.deliverAt = newDeliverAt;
    writeJSON('letters.json', letterData);
  }
  
  writeJSON('scheduled-letters.json', scheduledData);
  
  addNotification(
    scheduled.senderId,
    'scheduled_rescheduled',
    '送达时间已修改 ⏰',
    `《${scheduled.title}》的送达时间已修改为 ${new Date(newDeliverAt).toLocaleString('zh-CN')}`,
    scheduled.id
  );
  
  res.json({
    success: true,
    message: '送达时间已更新',
    data: {
      ...scheduled,
      currentStatus: getScheduledLetterStatus(scheduled),
      timeRemaining: calculateTimeRemaining(newDeliverAt),
    },
  });
});

router.post('/:id/resent', (req, res) => {
  const { id } = req.params;
  const { newDeliverAt, updateContent } = req.body;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const originalScheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!originalScheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const originalLetter = letterData.letters.find(l => l.id === originalScheduled.letterId);
  
  if (!originalLetter) {
    return res.status(404).json({ success: false, message: '原信件不存在' });
  }
  
  let deliverAt = newDeliverAt;
  if (!deliverAt) {
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    deliverAt = defaultDate.toISOString();
  }
  
  const deliverTime = new Date(deliverAt).getTime();
  if (deliverTime <= Date.now()) {
    return res.status(400).json({ success: false, message: '送达时间必须晚于当前时间' });
  }
  
  const newLetter = {
    ...originalLetter,
    id: generateId(),
    createdAt: new Date().toISOString(),
    deliverAt,
    isScheduled: true,
    likes: 0,
    replies: [],
    originalLetterId: originalLetter.id,
    resentFrom: id,
  };
  
  if (updateContent) {
    if (updateContent.title) newLetter.title = updateContent.title;
    if (updateContent.content) newLetter.content = updateContent.content;
    if (updateContent.emotions) newLetter.emotions = updateContent.emotions;
    if (updateContent.recipient) newLetter.recipient = updateContent.recipient;
  }
  
  const newScheduled = {
    id: generateId(),
    letterId: newLetter.id,
    senderId: originalScheduled.senderId,
    title: newLetter.title,
    recipient: newLetter.recipient,
    recipientType: newLetter.recipientType,
    scheduledDeliverAt: deliverAt,
    originalDeliverAt: deliverAt,
    status: SCHEDULED_STATUS.PENDING,
    reminderSettings: originalScheduled.reminderSettings || {
      before24h: true,
      before1h: true,
      onTime: true,
    },
    resentFrom: id,
    resentCount: 0,
    versionCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  letterData.letters.unshift(newLetter);
  writeJSON('letters.json', letterData);
  
  scheduledData.scheduledLetters.unshift(newScheduled);
  
  originalScheduled.status = SCHEDULED_STATUS.RESENT;
  originalScheduled.resentTo = newScheduled.id;
  originalScheduled.updatedAt = new Date().toISOString();
  originalScheduled.resentCount = (originalScheduled.resentCount || 0) + 1;
  
  writeJSON('scheduled-letters.json', scheduledData);
  
  createLetterVersion(newLetter, '二次寄送版本');
  
  addNotification(
    originalScheduled.senderId,
    'scheduled_resent',
    '信件已二次寄送 📬',
    `《${newLetter.title}》已重新预约，将于 ${new Date(deliverAt).toLocaleString('zh-CN')} 送达`,
    newScheduled.id
  );
  
  res.json({
    success: true,
    message: '信件已重新预约寄送',
    data: {
      scheduledLetter: {
        ...newScheduled,
        currentStatus: SCHEDULED_STATUS.PENDING,
        timeRemaining: calculateTimeRemaining(deliverAt),
      },
      letter: newLetter,
    },
  });
});

router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const versionData = readJSON('letter-versions.json') || { versions: [] };
  const versions = versionData.versions
    .filter(v => v.letterId === scheduled.letterId)
    .sort((a, b) => b.version - a.version);
  
  res.json({
    success: true,
    data: versions,
    total: versions.length,
  });
});

router.get('/versions/:versionId', (req, res) => {
  const { versionId } = req.params;
  const versionData = readJSON('letter-versions.json') || { versions: [] };
  const version = versionData.versions.find(v => v.id === versionId);
  
  if (!version) {
    return res.status(404).json({ success: false, message: '版本不存在' });
  }
  
  res.json({ success: true, data: version });
});

router.post('/:id/save-version', (req, res) => {
  const { id } = req.params;
  const { title, content, emotions, recipient, versionNote } = req.body;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const currentStatus = getScheduledLetterStatus(scheduled);
  if (currentStatus === SCHEDULED_STATUS.DELIVERED) {
    return res.status(400).json({ success: false, message: '信件已送达，无法保存新版本' });
  }
  
  if (currentStatus === SCHEDULED_STATUS.CANCELLED) {
    return res.status(400).json({ success: false, message: '信件已撤回，无法保存新版本' });
  }
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === scheduled.letterId);
  
  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }
  
  createLetterVersion(letter, versionNote || '保存版本');
  
  if (title !== undefined) letter.title = title;
  if (content !== undefined) letter.content = content;
  if (emotions !== undefined) letter.emotions = emotions;
  if (recipient !== undefined) letter.recipient = recipient;
  letter.updatedAt = new Date().toISOString();
  
  if (title) scheduled.title = title;
  if (recipient) scheduled.recipient = recipient;
  scheduled.versionCount = (scheduled.versionCount || 1) + 1;
  scheduled.updatedAt = new Date().toISOString();
  
  writeJSON('letters.json', letterData);
  writeJSON('scheduled-letters.json', scheduledData);
  
  const newVersion = createLetterVersion(letter, versionNote || '修改后版本');
  
  res.json({
    success: true,
    message: '版本已保存',
    data: {
      version: newVersion,
      versionCount: scheduled.versionCount,
    },
  });
});

router.post('/:id/restore-version/:versionId', (req, res) => {
  const { id, versionId } = req.params;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const scheduled = scheduledData.scheduledLetters.find(s => s.id === id);
  
  if (!scheduled) {
    return res.status(404).json({ success: false, message: '预约信件不存在' });
  }
  
  const currentStatus = getScheduledLetterStatus(scheduled);
  if (currentStatus === SCHEDULED_STATUS.DELIVERED) {
    return res.status(400).json({ success: false, message: '信件已送达，无法恢复版本' });
  }
  
  if (currentStatus === SCHEDULED_STATUS.CANCELLED) {
    return res.status(400).json({ success: false, message: '信件已撤回，无法恢复版本' });
  }
  
  const versionData = readJSON('letter-versions.json') || { versions: [] };
  const version = versionData.versions.find(v => v.id === versionId);
  
  if (!version) {
    return res.status(404).json({ success: false, message: '版本不存在' });
  }
  
  if (version.letterId !== scheduled.letterId) {
    return res.status(400).json({ success: false, message: '版本不属于此信件' });
  }
  
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === scheduled.letterId);
  
  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }
  
  createLetterVersion(letter, '恢复前版本');
  
  letter.title = version.title;
  letter.content = version.content;
  letter.recipient = version.recipient;
  letter.recipientType = version.recipientType;
  letter.emotions = version.emotions;
  letter.isPublic = version.isPublic;
  letter.isAnonymous = version.isAnonymous;
  letter.updatedAt = new Date().toISOString();
  
  scheduled.title = version.title;
  scheduled.recipient = version.recipient;
  scheduled.versionCount = (scheduled.versionCount || 1) + 1;
  scheduled.updatedAt = new Date().toISOString();
  
  writeJSON('letters.json', letterData);
  writeJSON('scheduled-letters.json', scheduledData);
  
  const restoredVersion = createLetterVersion(letter, `恢复自 v${version.version} 版本`);
  
  addNotification(
    scheduled.senderId,
    'version_restored',
    '版本已恢复 🔄',
    `《${letter.title}》已恢复到第 ${version.version} 版本`,
    scheduled.id
  );
  
  res.json({
    success: true,
    message: `已恢复到第 ${version.version} 版本`,
    data: {
      letter,
      version: restoredVersion,
      versionCount: scheduled.versionCount,
    },
  });
});

router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const userScheduled = scheduledData.scheduledLetters.filter(s => s.senderId === userId);
  
  let pendingCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let resentCount = 0;
  let totalVersions = 0;
  
  userScheduled.forEach(s => {
    const status = getScheduledLetterStatus(s);
    switch (status) {
      case SCHEDULED_STATUS.PENDING:
        pendingCount++;
        break;
      case SCHEDULED_STATUS.DELIVERED:
        deliveredCount++;
        break;
      case SCHEDULED_STATUS.CANCELLED:
        cancelledCount++;
        break;
      case SCHEDULED_STATUS.RESENT:
        resentCount++;
        break;
    }
    totalVersions += s.versionCount || 1;
  });
  
  const upcoming = userScheduled
    .filter(s => getScheduledLetterStatus(s) === SCHEDULED_STATUS.PENDING)
    .sort((a, b) => new Date(a.scheduledDeliverAt) - new Date(b.scheduledDeliverAt))
    .slice(0, 3)
    .map(s => ({
      id: s.id,
      title: s.title,
      recipient: s.recipient,
      scheduledDeliverAt: s.scheduledDeliverAt,
      timeRemaining: calculateTimeRemaining(s.scheduledDeliverAt),
    }));
  
  res.json({
    success: true,
    data: {
      total: userScheduled.length,
      pending: pendingCount,
      delivered: deliveredCount,
      cancelled: cancelledCount,
      resent: resentCount,
      totalVersions,
      upcoming,
    },
  });
});

router.get('/reminders/check', (req, res) => {
  const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const twentyFourHours = 24 * oneHour;
  
  const remindersToSend = [];
  
  scheduledData.scheduledLetters.forEach(s => {
    if (s.status !== SCHEDULED_STATUS.PENDING) return;
    
    const deliverTime = new Date(s.scheduledDeliverAt).getTime();
    const timeUntilDelivery = deliverTime - now;
    
    if (!s.reminderSent24h && timeUntilDelivery <= twentyFourHours && timeUntilDelivery > oneHour) {
      remindersToSend.push({
        scheduledId: s.id,
        type: REMINDER_TYPES.BEFORE_24H,
        letter: s,
      });
      s.reminderSent24h = true;
    }
    
    if (!s.reminderSent1h && timeUntilDelivery <= oneHour && timeUntilDelivery > 0) {
      remindersToSend.push({
        scheduledId: s.id,
        type: REMINDER_TYPES.BEFORE_1H,
        letter: s,
      });
      s.reminderSent1h = true;
    }
    
    if (!s.reminderSentOnTime && timeUntilDelivery <= 0) {
      remindersToSend.push({
        scheduledId: s.id,
        type: REMINDER_TYPES.ON_TIME,
        letter: s,
      });
      s.reminderSentOnTime = true;
    }
  });
  
  remindersToSend.forEach(r => {
    let title, content;
    switch (r.type) {
      case REMINDER_TYPES.BEFORE_24H:
        title = '信件将在24小时后送达 ⏰';
        content = `《${r.letter.title}》将在24小时后送达 ${r.letter.recipient}，你还有时间撤回或修改内容。`;
        break;
      case REMINDER_TYPES.BEFORE_1H:
        title = '信件将在1小时后送达 📬';
        content = `《${r.letter.title}》即将送达 ${r.letter.recipient}，请做好准备！`;
        break;
      case REMINDER_TYPES.ON_TIME:
        title = '信件已送达！✨';
        content = `《${r.letter.title}》已准时送达 ${r.letter.recipient} 的手中，愿这份心意温暖Ta。`;
        break;
    }
    addNotification(r.letter.senderId, `reminder_${r.type}`, title, content, r.scheduledId);
  });
  
  writeJSON('scheduled-letters.json', scheduledData);
  
  res.json({
    success: true,
    data: {
      checked: scheduledData.scheduledLetters.length,
      remindersSent: remindersToSend.length,
      reminders: remindersToSend.map(r => ({
        scheduledId: r.scheduledId,
        type: r.type,
        title: r.letter.title,
      })),
    },
  });
});

module.exports = router;
