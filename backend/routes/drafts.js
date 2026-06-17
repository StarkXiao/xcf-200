const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const RISK_KEYWORDS = {
  self_harm: ['自杀', '自残', '不想活', '结束生命', '割腕', '跳楼', '上吊', '服毒', '安眠药', '离开这个世界', '解脱'],
  harm_others: ['杀人', '报复', '同归于尽', '毁了他', '弄死', '打死', '杀了'],
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

function createDraftVersion(draft, note) {
  const versionData = readJSON('draft-versions.json') || { versions: [] };
  const existingVersions = versionData.versions.filter(v => v.draftId === draft.id);
  const nextVersion = existingVersions.length === 0 ? 1 : Math.max(...existingVersions.map(v => v.version)) + 1;
  const version = {
    id: generateId(),
    draftId: draft.id,
    version: nextVersion,
    snapshot: {
      recipient: draft.recipient,
      recipientType: draft.recipientType,
      title: draft.title,
      content: draft.content,
      emotions: draft.emotions,
      isPublic: draft.isPublic,
      isAnonymous: draft.isAnonymous,
      deliverySpeed: draft.deliverySpeed,
      scheduledDelivery: draft.scheduledDelivery,
      scheduledDate: draft.scheduledDate,
      scheduledTime: draft.scheduledTime,
    },
    note: note || '自动保存版本',
    createdBy: draft.senderId,
    createdAt: new Date().toISOString(),
  };
  versionData.versions.unshift(version);
  writeJSON('draft-versions.json', versionData);
  return version;
}

function generateAutoReply(letter) {
  const replies = [
    { fromParallel: 'star_messenger_' + Math.floor(Math.random() * 100), senderName: '星光信使', content: `你的信已被银河邮局收录，编号 #${Math.floor(Math.random() * 999999)}。它将穿越时空，安全送达收件人手中。`, emotion: '神秘' },
    { fromParallel: 'echo_world_' + Math.floor(Math.random() * 100), senderName: '世界回声', content: `在某个平行时空里，有人收到了你的心意，并回以同样的温暖。思念永远不会被辜负。`, emotion: '温暖' },
    { fromParallel: 'time_traveler_' + Math.floor(Math.random() * 100), senderName: '时光旅人', content: `我是穿梭在时间长河里的旅者，偶然遇见了你的信。我会把它小心护送到目的地，放心。`, emotion: '希望' },
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, sort = 'updated', search } = req.query;
  const draftData = readJSON('drafts.json') || { drafts: [] };
  let drafts = draftData.drafts.filter(d => d.senderId === userId);

  if (search) {
    const kw = String(search).toLowerCase();
    drafts = drafts.filter(d =>
      (d.title || '').toLowerCase().includes(kw) ||
      (d.content || '').toLowerCase().includes(kw) ||
      (d.recipient || '').toLowerCase().includes(kw)
    );
  }

  if (sort === 'updated') {
    drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (sort === 'created') {
    drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'wordcount') {
    drafts.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = drafts.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: drafts.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(drafts.length / limitNum),
  });
});

router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const draftData = readJSON('drafts.json') || { drafts: [] };
  const drafts = draftData.drafts.filter(d => d.senderId === userId);

  let autoSaved = 0;
  let scheduled = 0;
  let wordTotal = 0;
  let versionsTotal = 0;
  let lastDraftAt = null;

  drafts.forEach(d => {
    if (d.autoSavedAt) autoSaved++;
    if (d.scheduledDelivery && d.scheduledDate) scheduled++;
    wordTotal += d.wordCount || 0;
    versionsTotal += d.versionCount || 0;
    if (!lastDraftAt || new Date(d.updatedAt) > new Date(lastDraftAt)) {
      lastDraftAt = d.updatedAt;
    }
  });

  res.json({
    success: true,
    data: {
      total: drafts.length,
      autoSaved,
      scheduled,
      wordTotal,
      versionsTotal,
      lastDraftAt,
    },
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draft = draftData.drafts.find(d => d.id === id);

  if (!draft) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  draft.lastOpenedAt = new Date().toISOString();
  writeJSON('drafts.json', draftData);

  res.json({ success: true, data: draft });
});

router.post('/', (req, res) => {
  const {
    senderId, recipient, recipientType, title, content, emotions,
    isPublic, isAnonymous, deliverySpeed, scheduledDelivery, scheduledDate, scheduledTime,
  } = req.body;

  if (!senderId) {
    return res.status(400).json({ success: false, message: '用户ID缺失' });
  }

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const now = new Date().toISOString();

  const newDraft = {
    id: generateId(),
    senderId,
    recipient: recipient || '',
    recipientType: recipientType || 'future',
    title: title || '',
    content: content || '',
    emotions: emotions || [],
    isPublic: isPublic !== undefined ? isPublic : true,
    isAnonymous: isAnonymous !== undefined ? isAnonymous : false,
    deliverySpeed: deliverySpeed || 'standard',
    scheduledDelivery: scheduledDelivery || false,
    scheduledDate: scheduledDate || '',
    scheduledTime: scheduledTime || '',
    autoSavedAt: null,
    versionCount: 0,
    wordCount: (content || '').length,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  draftData.drafts.unshift(newDraft);
  writeJSON('drafts.json', draftData);

  res.json({
    success: true,
    message: '草稿已创建',
    data: newDraft,
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { autoSave = false, note = '' } = updateData;

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draftIndex = draftData.drafts.findIndex(d => d.id === id);

  if (draftIndex === -1) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const draft = draftData.drafts[draftIndex];

  if (updateData.recipient !== undefined) draft.recipient = updateData.recipient;
  if (updateData.recipientType !== undefined) draft.recipientType = updateData.recipientType;
  if (updateData.title !== undefined) draft.title = updateData.title;
  if (updateData.content !== undefined) draft.content = updateData.content;
  if (updateData.emotions !== undefined) draft.emotions = updateData.emotions;
  if (updateData.isPublic !== undefined) draft.isPublic = updateData.isPublic;
  if (updateData.isAnonymous !== undefined) draft.isAnonymous = updateData.isAnonymous;
  if (updateData.deliverySpeed !== undefined) draft.deliverySpeed = updateData.deliverySpeed;
  if (updateData.scheduledDelivery !== undefined) draft.scheduledDelivery = updateData.scheduledDelivery;
  if (updateData.scheduledDate !== undefined) draft.scheduledDate = updateData.scheduledDate;
  if (updateData.scheduledTime !== undefined) draft.scheduledTime = updateData.scheduledTime;

  draft.wordCount = (draft.content || '').length;
  draft.updatedAt = new Date().toISOString();

  if (autoSave) {
    draft.autoSavedAt = draft.updatedAt;
  }

  const contentChanged = updateData.content !== undefined && updateData.content !== null;
  if (!autoSave || contentChanged) {
    const shouldCreateVersion = !autoSave || (draft.wordCount > 100 && draft.versionCount < 50);
    if (shouldCreateVersion) {
      const versionNote = autoSave ? '自动保存' : (note || '手动保存');
      createDraftVersion(draft, versionNote);
      draft.versionCount = (draft.versionCount || 0) + 1;
    }
  }

  draftData.drafts[draftIndex] = draft;
  writeJSON('drafts.json', draftData);

  res.json({
    success: true,
    message: autoSave ? '已自动保存' : '草稿已更新',
    data: draft,
  });
});

router.post('/:id/save-version', (req, res) => {
  const { id } = req.params;
  const { note = '' } = req.body;

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draft = draftData.drafts.find(d => d.id === id);

  if (!draft) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const version = createDraftVersion(draft, note || '手动保存版本');
  draft.versionCount = (draft.versionCount || 0) + 1;
  draft.updatedAt = new Date().toISOString();
  writeJSON('drafts.json', draftData);

  res.json({
    success: true,
    message: '版本已保存',
    data: {
      version,
      versionCount: draft.versionCount,
    },
  });
});

router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  const versionData = readJSON('draft-versions.json') || { versions: [] };
  const versions = versionData.versions
    .filter(v => v.draftId === id)
    .sort((a, b) => b.version - a.version);

  res.json({
    success: true,
    data: versions,
    total: versions.length,
  });
});

router.get('/versions/:versionId', (req, res) => {
  const { versionId } = req.params;
  const versionData = readJSON('draft-versions.json') || { versions: [] };
  const version = versionData.versions.find(v => v.id === versionId);

  if (!version) {
    return res.status(404).json({ success: false, message: '版本不存在' });
  }

  res.json({ success: true, data: version });
});

router.post('/:id/restore-version/:versionId', (req, res) => {
  const { id, versionId } = req.params;

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draft = draftData.drafts.find(d => d.id === id);

  if (!draft) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const versionData = readJSON('draft-versions.json') || { versions: [] };
  const version = versionData.versions.find(v => v.id === versionId);

  if (!version) {
    return res.status(404).json({ success: false, message: '版本不存在' });
  }

  if (version.draftId !== id) {
    return res.status(400).json({ success: false, message: '版本不属于此草稿' });
  }

  createDraftVersion(draft, '恢复前版本');

  const snapshot = version.snapshot;
  draft.recipient = snapshot.recipient;
  draft.recipientType = snapshot.recipientType;
  draft.title = snapshot.title;
  draft.content = snapshot.content;
  draft.emotions = snapshot.emotions;
  draft.isPublic = snapshot.isPublic;
  draft.isAnonymous = snapshot.isAnonymous;
  draft.deliverySpeed = snapshot.deliverySpeed;
  draft.scheduledDelivery = snapshot.scheduledDelivery;
  draft.scheduledDate = snapshot.scheduledDate;
  draft.scheduledTime = snapshot.scheduledTime;
  draft.wordCount = (snapshot.content || '').length;
  draft.versionCount = (draft.versionCount || 0) + 1;
  draft.updatedAt = new Date().toISOString();

  writeJSON('drafts.json', draftData);

  const restoredVersion = createDraftVersion(draft, `恢复自 v${version.version} 版本`);

  res.json({
    success: true,
    message: `已恢复到第 ${version.version} 版本`,
    data: {
      draft,
      version: restoredVersion,
      versionCount: draft.versionCount,
    },
  });
});

router.post('/:id/validate-submit', (req, res) => {
  const { id } = req.params;

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draft = draftData.drafts.find(d => d.id === id);

  if (!draft) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const errors = {};
  const warnings = [];

  if (!draft.recipient.trim()) errors.recipient = '请填写收件人';
  if (!draft.title.trim()) errors.title = '请填写信件标题';
  if (!draft.content.trim()) errors.content = '信件内容不能为空';
  else if (draft.content.trim().length < 20) errors.content = '信件内容至少20个字';
  if (!draft.emotions || draft.emotions.length === 0) errors.emotions = '请至少选择一个情绪标签';

  const combinedContent = draft.title + '\n' + draft.content;
  const riskAnalysis = analyzeContentRisk(combinedContent);
  if (riskAnalysis.level === 'severe') {
    warnings.push('内容中可能涉及严重风险词汇，建议修改后再发送');
  } else if (riskAnalysis.level === 'moderate') {
    warnings.push('内容中可能包含敏感表达，请注意措辞');
  }

  let scheduledCheck = null;
  if (draft.scheduledDelivery && draft.scheduledDate && draft.scheduledTime) {
    const scheduledTs = new Date(`${draft.scheduledDate}T${draft.scheduledTime}`).getTime();
    const now = Date.now();
    const isPast = scheduledTs <= now;
    if (isPast) {
      errors.scheduled = '定时时间已过，请重新设置';
      const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
      scheduledCheck = {
        isPast: true,
        needsAdjustment: true,
        suggestedDate: tomorrow.toISOString().split('T')[0],
        suggestedTime: draft.scheduledTime || '09:00',
      };
    } else if (scheduledTs - now < 5 * 60 * 1000) {
      warnings.push('定时时间距现在不足5分钟，建议适当延后');
      scheduledCheck = {
        isPast: false,
        needsAdjustment: true,
      };
    } else {
      scheduledCheck = { isPast: false, needsAdjustment: false };
    }
  } else if (draft.scheduledDelivery && (!draft.scheduledDate || !draft.scheduledTime)) {
    errors.scheduled = '请设置完整的定时日期和时间';
  }

  if (draft.wordCount && draft.wordCount > 4500 && draft.wordCount < 5000) {
    warnings.push('信件内容已接近字数上限（5000字），请注意精简');
  }

  res.json({
    success: true,
    data: {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
      scheduledCheck,
      riskAnalysis,
    },
  });
});

router.post('/:id/submit', (req, res) => {
  const { id } = req.params;
  const { senderName, scheduledDeliveryAt } = req.body;

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draftIndex = draftData.drafts.findIndex(d => d.id === id);

  if (draftIndex === -1) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const draft = draftData.drafts[draftIndex];

  if (!draft.recipient.trim() || !draft.title.trim() || !draft.content.trim() || draft.content.trim().length < 20) {
    return res.status(400).json({ success: false, message: '信件内容不完整，请先完善' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const now = new Date().toISOString();

  let finalDeliverAt;
  let isScheduled = false;

  if (scheduledDeliveryAt) {
    finalDeliverAt = scheduledDeliveryAt;
    isScheduled = true;
  } else if (draft.scheduledDelivery && draft.scheduledDate && draft.scheduledTime) {
    const scheduledTs = new Date(`${draft.scheduledDate}T${draft.scheduledTime}`).getTime();
    if (scheduledTs > Date.now()) {
      finalDeliverAt = new Date(scheduledTs).toISOString();
      isScheduled = true;
    } else {
      finalDeliverAt = now;
    }
  } else {
    finalDeliverAt = now;
  }

  const newLetter = {
    id: generateId(),
    senderId: draft.senderId,
    senderName: senderName || '无名旅人',
    recipient: draft.recipient,
    recipientType: draft.recipientType,
    title: draft.title,
    content: draft.content,
    emotions: draft.emotions,
    isPublic: draft.isPublic,
    isAnonymous: draft.isAnonymous,
    likes: 0,
    createdAt: now,
    deliverAt: finalDeliverAt,
    isScheduled,
    deliverySpeed: draft.deliverySpeed,
    replies: [],
  };

  if (Math.random() > 0.4) {
    const autoReply = generateAutoReply(newLetter);
    newLetter.replies.push({
      id: generateId(),
      letterId: newLetter.id,
      ...autoReply,
      createdAt: new Date(Date.now() + Math.random() * 3600000).toISOString(),
    });
  }

  letterData.letters.unshift(newLetter);
  writeJSON('letters.json', letterData);

  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === draft.senderId);
  if (user) {
    user.sentLetters = (user.sentLetters || 0) + 1;
    writeJSON('users.json', userData);
  }

  if (isScheduled) {
    const scheduledData = readJSON('scheduled-letters.json') || { scheduledLetters: [] };
    const scheduledLetter = {
      id: generateId(),
      letterId: newLetter.id,
      senderId: draft.senderId,
      title: draft.title,
      recipient: draft.recipient,
      recipientType: draft.recipientType,
      scheduledDeliverAt: finalDeliverAt,
      originalDeliverAt: finalDeliverAt,
      status: 'pending',
      reminderSettings: { before24h: true, before1h: true, onTime: true },
      resentCount: 0,
      versionCount: draft.versionCount || 1,
      createdAt: now,
      updatedAt: now,
    };
    scheduledData.scheduledLetters.unshift(scheduledLetter);
    writeJSON('scheduled-letters.json', scheduledData);

    const notifData = readJSON('notifications.json') || { notifications: [] };
    notifData.notifications.unshift({
      id: generateId(),
      userId: draft.senderId,
      type: 'scheduled_created',
      title: '预约信件已创建 ✉️',
      content: `你的信《${draft.title}》已预约将于 ${new Date(finalDeliverAt).toLocaleString('zh-CN')} 送达`,
      relatedId: scheduledLetter.id,
      read: false,
      createdAt: now,
    });
    writeJSON('notifications.json', notifData);
  }

  draftData.drafts.splice(draftIndex, 1);
  writeJSON('drafts.json', draftData);

  res.json({
    success: true,
    message: isScheduled ? '信件已预约送达时间' : '信件已成功寄出',
    data: {
      letter: newLetter,
      isScheduled,
      scheduledDeliverAt: finalDeliverAt,
    },
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const draftData = readJSON('drafts.json') || { drafts: [] };
  const draftIndex = draftData.drafts.findIndex(d => d.id === id);

  if (draftIndex === -1) {
    return res.status(404).json({ success: false, message: '草稿不存在' });
  }

  const deletedDraft = draftData.drafts[draftIndex];
  draftData.drafts.splice(draftIndex, 1);
  writeJSON('drafts.json', draftData);

  const versionData = readJSON('draft-versions.json') || { versions: [] };
  versionData.versions = versionData.versions.filter(v => v.draftId !== id);
  writeJSON('draft-versions.json', versionData);

  res.json({
    success: true,
    message: '草稿已删除',
    data: { id: deletedDraft.id, title: deletedDraft.title },
  });
});

router.delete('/batch', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: '请提供要删除的草稿ID列表' });
  }

  const draftData = readJSON('drafts.json') || { drafts: [] };
  const beforeCount = draftData.drafts.length;
  draftData.drafts = draftData.drafts.filter(d => !ids.includes(d.id));
  const deletedCount = beforeCount - draftData.drafts.length;
  writeJSON('drafts.json', draftData);

  const versionData = readJSON('draft-versions.json') || { versions: [] };
  versionData.versions = versionData.versions.filter(v => !ids.includes(v.draftId));
  writeJSON('draft-versions.json', versionData);

  res.json({
    success: true,
    message: `已删除 ${deletedCount} 个草稿`,
    data: { deletedCount },
  });
});

module.exports = router;
