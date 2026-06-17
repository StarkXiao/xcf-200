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

const DELIVERY_STAGES = [
  { stage: 'created', duration: 0, label: '信件诞生' },
  { stage: 'star_port', duration: 60000, label: '抵达星际邮局' },
  { stage: 'time_tunnel', duration: 120000, label: '穿越时间隧道' },
  { stage: 'parallel_gateway', duration: 90000, label: '平行世界关口' },
  { stage: 'delivering', duration: 60000, label: '最后一公里投递' },
  { stage: 'delivered', duration: 0, label: '已送达' },
];

const STAGE_MESSAGES = {
  created: ['你的信件刚刚完成，正在等待送往星际邮局...'],
  star_port: [
    '信件已抵达阿尔法星港，正在办理时空穿梭手续',
    '星港工作人员正在检查信件内容',
    '时空通行证已签发，准备进入时间隧道',
  ],
  time_tunnel: [
    '信件正在穿越2024-2035年的时光长河',
    '途中经过了一场流星雨，信件被祝福包裹',
    '时光旅者正在护送你的信件',
  ],
  parallel_gateway: [
    '正在扫描平行宇宙坐标...',
    '已定位到目标时空，等待关口开放',
    '正在进行维度转换，请勿关闭时空通道',
  ],
  delivering: [
    '时空信使已接管信件，正在飞往目的地',
    '距离收件人还有3.2光年',
    '即将抵达，准备降落...',
  ],
  delivered: [
    '信件已成功送达！收件人正在阅读...',
    '收件人露出了温暖的微笑 ✨',
    '心意已传达，任务完成！',
  ],
};

const EXCEPTION_TYPES = [
  { type: 'time_anomaly', label: '时间异常', message: '时空流出现波动，信件暂时偏离航道' },
  { type: 'cosmic_storm', label: '宇宙风暴', message: '遭遇小型宇宙风暴，需要减速航行' },
  { type: 'recipient_lost', label: '收件人失联', message: '暂时无法定位收件人的时空坐标' },
  { type: 'unknown', label: '未知异常', message: '遇到了未知的时空异常，正在紧急排查' },
];

const REPLY_CANDIDATE_TIMEOUT = 5 * 60 * 1000;

function generateReplyCandidates(letter) {
  const emotion = letter.emotions?.[0] || '温暖';
  const title = letter.title || '';
  const contentSnippet = letter.content?.substring(0, 50) || '';

  const candidateTemplates = [
    {
      fromParallel: 'star_messenger',
      senderName: '星光信使',
      content: `你的信《${title}》已被银河邮局收录，编号 #${Math.floor(Math.random() * 999999)}。它将穿越时空，安全送达收件人手中。愿这份心意在星河里闪耀 ✨`,
      emotion: '神秘',
      qualityScore: 85
    },
    {
      fromParallel: 'echo_world',
      senderName: '世界回声',
      content: `在某个平行时空里，有人正阅读着你的文字——"${contentSnippet}..."，并回以同样的温暖。思念永远不会被辜负，你并不孤单 🌙`,
      emotion: '温暖',
      qualityScore: 90
    },
    {
      fromParallel: 'time_traveler',
      senderName: '时光旅人',
      content: `我是穿梭在时间长河里的旅者，偶然遇见了你的信。字里行间的${emotion}让我驻足。我会把它小心护送到目的地，请放心。`,
      emotion: '希望',
      qualityScore: 88
    },
    {
      fromParallel: 'cosmic_witness',
      senderName: '宇宙见证者',
      content: `星河里每一粒尘埃都在倾听你的心事。关于《${title}》，宇宙说："一切都会好起来的。"这不是安慰，是预言 🌟`,
      emotion: '治愈',
      qualityScore: 92
    },
    {
      fromParallel: 'parallel_friend',
      senderName: '平行世界的朋友',
      content: `嘿，另一个时空的你好吗？读着你的信，仿佛看到了另一个自己。无论你正在经历什么，请相信：在某个平行世界里，我们都过得很好 💫`,
      emotion: '思念',
      qualityScore: 87
    }
  ];

  return candidateTemplates.map((tpl, idx) => ({
    id: generateId(),
    letterId: letter.id,
    candidateIndex: idx,
    fromParallel: `${tpl.fromParallel}_${Math.floor(Math.random() * 1000)}`,
    senderName: tpl.senderName,
    content: tpl.content,
    emotion: tpl.emotion,
    qualityScore: tpl.qualityScore,
    status: 'pending',
    source: 'ai_generated',
    createdAt: new Date().toISOString()
  }));
}

function initializeReplyCandidates(letter) {
  const candidates = generateReplyCandidates(letter);
  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };
  candidateData.candidates.push(...candidates);
  writeJSON('replyCandidates.json', candidateData);

  const poolData = readJSON('replyCandidatePools.json') || { pools: [] };
  const pool = {
    id: generateId(),
    letterId: letter.id,
    timeoutAt: new Date(Date.now() + REPLY_CANDIDATE_TIMEOUT).toISOString(),
    status: 'waiting_human',
    selectedCandidateId: null,
    createdAt: new Date().toISOString()
  };
  poolData.pools.push(pool);
  writeJSON('replyCandidatePools.json', poolData);

  return { candidates, pool };
}

function getReplyCandidatePool(letterId) {
  const poolData = readJSON('replyCandidatePools.json') || { pools: [] };
  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };

  const pool = poolData.pools.find(p => p.letterId === letterId);
  if (!pool) return null;

  const candidates = candidateData.candidates.filter(c => c.letterId === letterId);
  return { pool, candidates };
}

function getReplyCandidatePoolData(letterId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === letterId);
  if (!letter) return null;

  checkAndApplyTimeoutFallback(letter);

  const poolInfo = getReplyCandidatePool(letterId);
  if (!poolInfo) return null;

  const { pool, candidates } = poolInfo;
  const hasHumanReply = letter.replies?.some(r => r.source === 'human' || r.isStrangerReply);
  const remainingTime = Math.max(0, new Date(pool.timeoutAt).getTime() - Date.now());

  return {
    pool,
    candidates,
    remainingTime,
    hasHumanReply
  };
}

function checkAndApplyTimeoutFallback(letter) {
  const poolInfo = getReplyCandidatePool(letter.id);
  if (!poolInfo) return false;

  const { pool, candidates } = poolInfo;

  if (pool.status !== 'waiting_human') return false;

  const hasHumanReply = letter.replies?.some(r => r.source === 'human' || r.isStrangerReply);
  if (hasHumanReply) {
    pool.status = 'human_replied';
    const poolData = readJSON('replyCandidatePools.json') || { pools: [] };
    const idx = poolData.pools.findIndex(p => p.id === pool.id);
    if (idx !== -1) {
      poolData.pools[idx] = { ...pool, updatedAt: new Date().toISOString() };
      writeJSON('replyCandidatePools.json', poolData);
    }
    return false;
  }

  const now = Date.now();
  const timeoutTime = new Date(pool.timeoutAt).getTime();

  if (now < timeoutTime) return false;

  const pendingCandidates = candidates.filter(c => c.status === 'pending');
  if (pendingCandidates.length === 0) return false;

  pendingCandidates.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  const selected = pendingCandidates[0];

  selected.status = 'selected';
  selected.selectedAt = new Date().toISOString();

  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };
  const cIdx = candidateData.candidates.findIndex(c => c.id === selected.id);
  if (cIdx !== -1) {
    candidateData.candidates[cIdx] = selected;
    writeJSON('replyCandidates.json', candidateData);
  }

  pool.status = 'timeout_fallback';
  pool.selectedCandidateId = selected.id;
  pool.fallbackAt = new Date().toISOString();

  const poolData = readJSON('replyCandidatePools.json') || { pools: [] };
  const pIdx = poolData.pools.findIndex(p => p.id === pool.id);
  if (pIdx !== -1) {
    poolData.pools[pIdx] = { ...pool, updatedAt: new Date().toISOString() };
    writeJSON('replyCandidatePools.json', poolData);
  }

  const autoReply = {
    id: generateId(),
    letterId: letter.id,
    fromParallel: selected.fromParallel,
    senderName: selected.senderName,
    content: selected.content,
    emotion: selected.emotion,
    source: 'ai_fallback',
    candidateId: selected.id,
    qualityScore: selected.qualityScore,
    createdAt: new Date().toISOString()
  };

  if (!letter.replies) letter.replies = [];
  letter.replies.push(autoReply);

  return true;
}

function getSpeedMultiplier(speed) {
  switch (speed) {
    case 'express': return 0.5;
    case 'instant': return 0.1;
    default: return 1;
  }
}

function calculateStageTimestamps(createdAt, speed = 'standard') {
  const multiplier = getSpeedMultiplier(speed);
  const created = new Date(createdAt).getTime();
  const timestamps = {};
  let cumulative = 0;

  DELIVERY_STAGES.forEach((stage) => {
    timestamps[stage.stage] = new Date(created + cumulative).toISOString();
    cumulative += stage.duration * multiplier;
  });

  return timestamps;
}

function determineCurrentStage(createdAt, speed = 'standard') {
  const timestamps = calculateStageTimestamps(createdAt, speed);
  const now = Date.now();
  let hasException = false;

  for (let i = DELIVERY_STAGES.length - 1; i >= 0; i--) {
    const stage = DELIVERY_STAGES[i].stage;
    if (now >= new Date(timestamps[stage]).getTime()) {
      if (Math.random() < 0.08 && stage !== 'delivered' && stage !== 'created') {
        hasException = true;
        return { stage: 'exception', actualStage: stage, hasException };
      }
      return { stage, actualStage: stage, hasException };
    }
  }

  return { stage: 'created', actualStage: 'created', hasException };
}

function calculateProgress(currentStage) {
  if (currentStage === 'exception') return 50;
  const idx = DELIVERY_STAGES.findIndex((s) => s.stage === currentStage);
  if (idx === -1) return 0;
  return Math.round((idx / (DELIVERY_STAGES.length - 1)) * 100);
}

function generateDeliveryLogs(letter) {
  const speed = letter.deliverySpeed || 'standard';
  const timestamps = calculateStageTimestamps(letter.createdAt, speed);
  const logs = [];
  const { stage: currentStage, actualStage, hasException } = determineCurrentStage(letter.createdAt, speed);

  DELIVERY_STAGES.forEach((stage, idx) => {
    if (new Date(timestamps[stage.stage]).getTime() <= Date.now() || stage.stage === 'created') {
      const messages = STAGE_MESSAGES[stage.stage] || ['状态更新'];
      logs.push({
        id: generateId(),
        stage: stage.stage,
        timestamp: timestamps[stage.stage],
        message: messages[Math.floor(Math.random() * messages.length)],
        location: getStageLocation(stage.stage),
      });
    }
  });

  if (hasException) {
    const exceptionType = EXCEPTION_TYPES[Math.floor(Math.random() * EXCEPTION_TYPES.length)];
    logs.push({
      id: generateId(),
      stage: 'exception',
      timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      message: exceptionType.message,
      location: getStageLocation(actualStage),
      isException: true,
    });
  }

  return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getStageLocation(stage) {
  const locations = {
    created: '你的书桌旁',
    star_port: '阿尔法星际邮局 · 星港中心',
    time_tunnel: '时空隧道 · 第42号航道',
    parallel_gateway: '平行宇宙关口 · 维度转换站',
    delivering: '目标时空附近 · 投递中',
    delivered: '收件人手中',
    exception: '时空异常区域',
  };
  return locations[stage] || '未知地点';
}

function generateExceptions(letter) {
  const { stage: currentStage, actualStage, hasException } = determineCurrentStage(letter.createdAt, letter.deliverySpeed || 'standard');

  if (!hasException) return [];

  const exceptionType = EXCEPTION_TYPES[Math.floor(Math.random() * EXCEPTION_TYPES.length)];
  return [
    {
      id: generateId(),
      type: exceptionType.type,
      stage: actualStage,
      message: exceptionType.message,
      detectedAt: new Date(Date.now() - Math.random() * 120000).toISOString(),
      resolved: false,
      availableCompensations: ['accelerate', 'reroute', 'resend', 'compensate_letter'],
    },
  ];
}

function buildTrackingInfo(letter) {
  const speed = letter.deliverySpeed || 'standard';
  const { stage: currentStage, hasException } = determineCurrentStage(letter.createdAt, speed);
  const timestamps = calculateStageTimestamps(letter.createdAt, speed);
  const logs = generateDeliveryLogs(letter);
  const exceptions = generateExceptions(letter);
  const activeExceptions = exceptions.filter((e) => !e.resolved);

  const estimatedArrival = letter.scheduledDeliveryAt || timestamps.delivered;
  const isDelayed = currentStage !== 'delivered' && Date.now() > new Date(estimatedArrival).getTime() + 300000;

  return {
    letterId: letter.id,
    currentStage: currentStage,
    estimatedArrival,
    createdAt: letter.createdAt,
    deliveredAt: currentStage === 'delivered' ? new Date().toISOString() : undefined,
    isDelayed,
    progress: calculateProgress(currentStage === 'exception' ? 'delivering' : currentStage),
    logs,
    exceptions,
    hasActiveException: activeExceptions.length > 0,
  };
}

router.get('/', (req, res) => {
  const { page = 1, limit = 10, emotion, keyword, sort = 'latest', minLikes, timeRange, recipientType, replyStatus } = req.query;
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

  if (minLikes !== undefined) {
    const min = parseInt(minLikes);
    if (!isNaN(min)) {
      letters = letters.filter(l => (l.likes || 0) >= min);
    }
  }

  if (timeRange) {
    const now = Date.now();
    let startTime;
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
    if (startTime) {
      letters = letters.filter(l => new Date(l.createdAt).getTime() >= startTime);
    }
  }

  if (recipientType) {
    const types = Array.isArray(recipientType) ? recipientType : [recipientType];
    letters = letters.filter(l => types.includes(l.recipientType));
  }

  if (replyStatus) {
    if (replyStatus === 'has_reply') {
      letters = letters.filter(l => l.replies && l.replies.length > 0);
    } else if (replyStatus === 'no_reply') {
      letters = letters.filter(l => !l.replies || l.replies.length === 0);
    }
  }

  if (sort === 'latest') {
    letters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'popular') {
    letters.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (sort === 'most_replied') {
    letters.sort((a, b) => ((b.replies ? b.replies.length : 0) - (a.replies ? a.replies.length : 0)));
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
    likes: l.likes || 0,
    views: l.views || 0,
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
  const { viewerId } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letterIndex = letterData.letters.findIndex(l => l.id === id);

  if (letterIndex === -1) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const letter = letterData.letters[letterIndex];
  letter.views = (letter.views || 0) + 1;
  writeJSON('letters.json', letterData);

  if (viewerId && letter.senderId !== viewerId) {
    const viewData = readJSON('letterViews.json') || { views: [] };
    viewData.views.push({
      id: generateId(),
      letterId: id,
      viewerId,
      letterOwnerId: letter.senderId,
      createdAt: new Date().toISOString()
    });
    writeJSON('letterViews.json', viewData);
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

  initializeReplyCandidates(newLetter);

  letterData.letters.unshift(newLetter);
  writeJSON('letters.json', letterData);

  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === senderId);
  if (user) {
    user.sentLetters = (user.sentLetters || 0) + 1;
    writeJSON('users.json', userData);
  }

  const riskAnalysis = processContentRating(newLetter.id, 'letter', title + '\n' + content, senderId);

  res.json({
    success: true,
    message: riskAnalysis.level !== 'safe'
      ? '信件已寄出。我们注意到内容中可能包含需要关注的情绪，愿你被温柔以待。'
      : '信件已寄出，正在等待来自陌生人的温暖回应 ✨',
    data: {
      ...newLetter,
      riskAnalysis,
      replyCandidatePool: {
        timeoutAt: new Date(Date.now() + REPLY_CANDIDATE_TIMEOUT).toISOString(),
        status: 'waiting_human',
        candidateCount: 5
      }
    }
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
  const { fromParallel, senderName, content, emotion, replierId } = req.body;

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
    source: 'human',
    createdAt: new Date().toISOString()
  };

  letter.replies = letter.replies || [];
  letter.replies.push(reply);
  writeJSON('letters.json', letterData);

  const riskAnalysis = processContentRating(reply.id, 'reply', content, replierId);
  createReplyReviewTask(reply.id, id, riskAnalysis.level, replierId);

  res.json({
    success: true,
    message: riskAnalysis.level !== 'safe'
      ? '回信已送达。我们会留意内容安全，如有需要守护员会介入。'
      : '回信已送达',
    data: {
      ...reply,
      riskAnalysis
    }
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

router.get('/:id/tracking', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const tracking = buildTrackingInfo(letter);
  res.json({ success: true, data: tracking });
});

router.get('/:id/tracking/live', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const tracking = buildTrackingInfo(letter);
  const { stage, actualStage } = determineCurrentStage(letter.createdAt, letter.deliverySpeed || 'standard');

  res.json({
    success: true,
    data: {
      currentStage: stage,
      actualStage,
      progress: tracking.progress,
      estimatedArrival: tracking.estimatedArrival,
      hasActiveException: tracking.hasActiveException,
      isDelayed: tracking.isDelayed,
      serverTime: new Date().toISOString(),
    }
  });
});

router.post('/:id/compensate', (req, res) => {
  const { id } = req.params;
  const { compensationType, userId } = req.body;

  if (!compensationType) {
    return res.status(400).json({ success: false, message: '请选择补偿方式' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  let resultMessage = '';
  let modifiedLetter = { ...letter };

  switch (compensationType) {
    case 'accelerate':
      letter.deliverySpeed = 'instant';
      resultMessage = '已注入星尘能量，信件传送速度提升！预计送达时间将大大缩短。';
      break;

    case 'reroute':
      resultMessage = '已切换至备用时空航线，正在绕过异常区域。信件将安全抵达。';
      break;

    case 'resend': {
      const newLetter = {
        ...letter,
        id: generateId(),
        createdAt: new Date().toISOString(),
        deliverySpeed: 'express',
        replies: [],
        likes: 0,
      };
      letterData.letters.unshift(newLetter);
      modifiedLetter = newLetter;
      resultMessage = '已创建信件副本并重新发送。新信件将使用加急模式传送。';
      break;
    }

    case 'compensate_letter': {
      const comfortReply = {
        id: generateId(),
        letterId: letter.id,
        fromParallel: 'star_messenger_support',
        senderName: '星光邮局客服中心',
        content: `亲爱的寄信人：\n\n我们很抱歉你的信件在传送过程中遇到了一些小波折。请放心，我们的时空工程师正在全力处理。\n\n每一封信都承载着珍贵的心意，我们绝不会让它迷失在时空中。稍等片刻，它一定会到达那个人的手中。\n\n愿星光永远照耀你的旅程 ✨\n\n—— 星光邮局 敬上`,
        emotion: '温暖',
        createdAt: new Date().toISOString(),
      };
      if (!letter.replies) letter.replies = [];
      letter.replies.push(comfortReply);
      resultMessage = '已收到来自星光邮局的安慰信，请在回信区查看。不要担心，你的信件很快就会送达！';
      break;
    }

    default:
      return res.status(400).json({ success: false, message: '未知的补偿方式' });
  }

  writeJSON('letters.json', letterData);

  const tracking = buildTrackingInfo(letter);
  tracking.exceptions = tracking.exceptions.map(e => ({
    ...e,
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolution: resultMessage,
  }));
  tracking.hasActiveException = false;

  res.json({
    success: true,
    message: resultMessage,
    data: {
      tracking,
      letterId: compensationType === 'resend' ? modifiedLetter.id : letter.id,
    }
  });
});

router.post('/:id/advance-stage', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const timestamps = calculateStageTimestamps(letter.createdAt, letter.deliverySpeed || 'standard');
  const { stage: currentStage } = determineCurrentStage(letter.createdAt, letter.deliverySpeed || 'standard');

  const currentIdx = DELIVERY_STAGES.findIndex(s => s.stage === (currentStage === 'exception' ? 'delivering' : currentStage));
  const nextIdx = Math.min(currentIdx + 1, DELIVERY_STAGES.length - 1);
  const nextStage = DELIVERY_STAGES[nextIdx];

  const now = new Date();
  letter.createdAt = new Date(now.getTime() - new Date(timestamps[nextStage.stage]).getTime() + new Date(timestamps.created).getTime() - 1000).toISOString();

  writeJSON('letters.json', letterData);
  const tracking = buildTrackingInfo(letter);

  res.json({
    success: true,
    message: `信件已推进至下一阶段：${nextStage.label}`,
    data: tracking,
  });
});

router.get('/user/:userId/mail-route-stats', (req, res) => {
  const { userId } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);

  const stageDistribution = {};
  DELIVERY_STAGES.forEach(s => { stageDistribution[s.stage] = 0; });
  stageDistribution.exception = 0;

  let totalInTransit = 0;
  let totalDelivered = 0;
  let totalExceptions = 0;
  let totalDelayed = 0;
  let totalDeliveryTime = 0;
  let deliveredCount = 0;

  userLetters.forEach(letter => {
    const tracking = buildTrackingInfo(letter);

    if (tracking.currentStage === 'delivered') {
      totalDelivered++;
      stageDistribution.delivered++;
      deliveredCount++;
      totalDeliveryTime += new Date(tracking.deliveredAt || letter.createdAt).getTime() - new Date(letter.createdAt).getTime();
    } else if (tracking.currentStage === 'exception') {
      totalInTransit++;
      totalExceptions++;
      stageDistribution.exception++;
    } else {
      totalInTransit++;
      if (tracking.isDelayed) totalDelayed++;
      if (stageDistribution[tracking.currentStage] !== undefined) {
        stageDistribution[tracking.currentStage]++;
      }
    }
  });

  res.json({
    success: true,
    data: {
      totalInTransit,
      totalDelivered,
      totalExceptions,
      totalDelayed,
      averageDeliveryTime: deliveredCount > 0 ? Math.round(totalDeliveryTime / deliveredCount) : 0,
      stageDistribution,
      totalLetters: userLetters.length,
    }
  });
});

router.get('/user/:userId/exceptions', (req, res) => {
  const { userId } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const userLetters = letterData.letters.filter(l => l.senderId === userId);

  const exceptionLetters = [];

  userLetters.forEach(letter => {
    const tracking = buildTrackingInfo(letter);
    if (tracking.hasActiveException || tracking.exceptions.length > 0) {
      exceptionLetters.push({
        letterId: letter.id,
        title: letter.title,
        recipient: letter.recipient,
        recipientType: letter.recipientType,
        createdAt: letter.createdAt,
        tracking: {
          currentStage: tracking.currentStage,
          exceptions: tracking.exceptions,
          hasActiveException: tracking.hasActiveException,
          isDelayed: tracking.isDelayed,
          estimatedArrival: tracking.estimatedArrival,
        },
      });
    }
  });

  res.json({
    success: true,
    data: exceptionLetters,
    total: exceptionLetters.length,
  });
});

function buildReplyTree(replies) {
  const replyMap = {};
  const rootReplies = [];

  replies.forEach(reply => {
    replyMap[reply.id] = { ...reply, subReplies: [] };
  });

  replies.forEach(reply => {
    if (reply.parentReplyId && replyMap[reply.parentReplyId]) {
      replyMap[reply.parentReplyId].subReplies.push(replyMap[reply.id]);
    } else {
      rootReplies.push(replyMap[reply.id]);
    }
  });

  const sortReplies = (list) => {
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    list.forEach(r => {
      if (r.subReplies && r.subReplies.length > 0) {
        sortReplies(r.subReplies);
      }
    });
  };
  sortReplies(rootReplies);

  return rootReplies;
}

function getEmotionChainForReply(replyId, allReplies) {
  const chain = [];
  let currentId = replyId;
  const replyMap = {};
  allReplies.forEach(r => { replyMap[r.id] = r; });

  while (currentId && replyMap[currentId]) {
    const r = replyMap[currentId];
    chain.unshift({
      replyId: r.id,
      senderName: r.senderName,
      emotion: r.emotion,
      createdAt: r.createdAt,
      order: chain.length
    });
    currentId = r.parentReplyId;
  }

  return chain;
}

function createNotification(userId, type, title, content, relatedId) {
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

router.post('/:id/reply-relay', (req, res) => {
  const { id } = req.params;
  const { parentReplyId, senderName, content, emotion, replierId } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: '回信内容不能为空' });
  }
  if (!parentReplyId) {
    return res.status(400).json({ success: false, message: '缺少父回复ID' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  letter.replies = letter.replies || [];
  const parentReply = letter.replies.find(r => r.id === parentReplyId);
  if (!parentReply) {
    return res.status(404).json({ success: false, message: '父回复不存在' });
  }

  const chain = getEmotionChainForReply(parentReplyId, letter.replies);
  const emotionChain = chain.map(c => c.emotion);
  if (emotion) emotionChain.push(emotion);

  const reply = {
    id: generateId(),
    letterId: id,
    parentReplyId,
    fromParallel: 'relay_' + Math.floor(Math.random() * 1000),
    senderName: senderName || '接力回信者',
    content,
    emotion: emotion || parentReply.emotion || '温暖',
    createdAt: new Date().toISOString(),
    replierId: replierId || null,
    likes: 0,
    isFeatured: false,
    chainOrder: chain.length,
    emotionChain
  };

  letter.replies.push(reply);
  writeJSON('letters.json', letterData);

  const riskAnalysis = processContentRating(reply.id, 'reply', content, replierId);
  createReplyReviewTask(reply.id, id, riskAnalysis.level, replierId);

  if (letter.senderId && letter.senderId !== replierId) {
    createNotification(
      letter.senderId,
      'relay_reply',
      '接力回信更新 ✨',
      `你的信《${letter.title}》收到了来自 ${reply.senderName} 的接力回信`,
      id
    );
  }
  if (parentReply.replierId && parentReply.replierId !== replierId) {
    createNotification(
      parentReply.replierId,
      'relay_reply',
      '你的回复被接力了 🌟',
      `${reply.senderName} 回应了你的回复："${content.substring(0, 30)}..."`,
      id
    );
  }

  const replyTree = buildReplyTree(letter.replies);

  res.json({
    success: true,
    message: '接力回信已送达，情绪继续传递 ✨',
    data: {
      reply,
      replyTree,
      emotionChain
    }
  });
});

router.post('/:letterId/replies/:replyId/like', (req, res) => {
  const { letterId, replyId } = req.params;
  const { userId } = req.body;

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === letterId);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  letter.replies = letter.replies || [];
  const reply = letter.replies.find(r => r.id === replyId);
  if (!reply) {
    return res.status(404).json({ success: false, message: '回复不存在' });
  }

  reply.likes = (reply.likes || 0) + 1;
  writeJSON('letters.json', letterData);

  if (reply.replierId && reply.replierId !== userId) {
    createNotification(
      reply.replierId,
      'reply_like',
      '你的回复被点赞了 💫',
      `有人为你的回复送上了一颗小星星`,
      letterId
    );
  }

  res.json({
    success: true,
    likes: reply.likes,
    message: '已送上一颗小星星 ✨'
  });
});

router.post('/:letterId/replies/:replyId/feature', (req, res) => {
  const { letterId, replyId } = req.params;
  const { featured, userId } = req.body;

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === letterId);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  letter.replies = letter.replies || [];
  const reply = letter.replies.find(r => r.id === replyId);
  if (!reply) {
    return res.status(404).json({ success: false, message: '回复不存在' });
  }

  reply.isFeatured = featured !== false;
  reply.featuredAt = reply.isFeatured ? new Date().toISOString() : null;
  reply.featuredBy = userId || null;
  writeJSON('letters.json', letterData);

  if (reply.isFeatured && reply.replierId && reply.replierId !== userId) {
    createNotification(
      reply.replierId,
      'reply_featured',
      '你的回复被选为精选 🏆',
      `你的回复在《${letter.title}》中被选为精选回复！`,
      letterId
    );
  }

  res.json({
    success: true,
    message: reply.isFeatured ? '已标记为精选回复' : '已取消精选标记',
    data: reply
  });
});

router.get('/:id/collaboration', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const replies = letter.replies || [];
  const replyTree = buildReplyTree(replies);

  const emotionDistribution = {};
  const uniqueSenders = new Set();
  let totalRelayReplies = 0;

  replies.forEach(r => {
    if (r.parentReplyId) totalRelayReplies++;
    uniqueSenders.add(r.senderName);
    if (r.emotion) {
      emotionDistribution[r.emotion] = (emotionDistribution[r.emotion] || 0) + 1;
    }
  });

  const rootReplies = replies.filter(r => !r.parentReplyId);
  const emotionChains = rootReplies.map(root => {
    const chain = getEmotionChainForReply(root.id, replies);
    const chainEmotions = chain.map(c => c.emotion);
    const emotionCount = {};
    chainEmotions.forEach(e => { emotionCount[e] = (emotionCount[e] || 0) + 1; });
    let dominantEmotion = chainEmotions[0] || '温暖';
    let maxCount = 0;
    Object.entries(emotionCount).forEach(([e, c]) => {
      if (c > maxCount) { maxCount = c; dominantEmotion = e; }
    });
    return {
      chainId: 'chain_' + root.id,
      letterId: id,
      rootReplyId: root.id,
      emotions: chain,
      dominantEmotion,
      totalLength: chain.length
    };
  });

  const longestChain = emotionChains.reduce((max, c) => Math.max(max, c.totalLength), 0);

  const featuredReplies = replies
    .filter(r => r.isFeatured)
    .sort((a, b) => new Date(b.featuredAt || b.createdAt) - new Date(a.featuredAt || a.createdAt));

  res.json({
    success: true,
    data: {
      replyTree,
      stats: {
        totalReplies: replies.length,
        totalRelayReplies,
        featuredReplies: featuredReplies.length,
        uniqueParticipants: uniqueSenders.size,
        longestEmotionChain: longestChain,
        emotionDistribution
      },
      emotionChains,
      featuredReplies
    }
  });
});

router.get('/:id/replies/tree', (req, res) => {
  const { id } = req.params;
  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const replyTree = buildReplyTree(letter.replies || []);
  res.json({ success: true, data: replyTree });
});

router.get('/:id/reply-candidates', (req, res) => {
  const { id } = req.params;

  const poolData = getReplyCandidatePoolData(id);
  if (!poolData) {
    return res.status(404).json({ success: false, message: '候选池不存在' });
  }

  res.json({ success: true, data: poolData });
});

router.post('/:id/select-candidate', (req, res) => {
  const { id } = req.params;
  const { candidateId, userId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ success: false, message: '缺少候选ID' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const poolInfo = getReplyCandidatePool(id);
  if (!poolInfo) {
    return res.status(404).json({ success: false, message: '候选池不存在' });
  }

  const { pool, candidates } = poolInfo;

  if (pool.status === 'human_replied' || pool.status === 'timeout_fallback') {
    return res.status(400).json({ success: false, message: '候选池已关闭' });
  }

  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ success: false, message: '候选不存在' });
  }

  candidate.status = 'selected';
  candidate.selectedAt = new Date().toISOString();

  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };
  const cIdx = candidateData.candidates.findIndex(c => c.id === candidateId);
  if (cIdx !== -1) {
    candidateData.candidates[cIdx] = candidate;
    writeJSON('replyCandidates.json', candidateData);
  }

  candidates.forEach(c => {
    if (c.id !== candidateId) {
      c.status = 'rejected';
      const idx = candidateData.candidates.findIndex(cc => cc.id === c.id);
      if (idx !== -1) {
        candidateData.candidates[idx] = c;
      }
    }
  });
  writeJSON('replyCandidates.json', candidateData);

  pool.status = 'human_replied';
  pool.selectedCandidateId = candidateId;

  const poolData = readJSON('replyCandidatePools.json') || { pools: [] };
  const pIdx = poolData.pools.findIndex(p => p.id === pool.id);
  if (pIdx !== -1) {
    poolData.pools[pIdx] = { ...pool, updatedAt: new Date().toISOString() };
    writeJSON('replyCandidatePools.json', poolData);
  }

  const reply = {
    id: generateId(),
    letterId: id,
    fromParallel: candidate.fromParallel,
    senderName: candidate.senderName,
    content: candidate.content,
    emotion: candidate.emotion,
    source: 'ai_generated',
    candidateId: candidate.id,
    qualityScore: candidate.qualityScore,
    createdAt: new Date().toISOString()
  };

  letter.replies = letter.replies || [];
  letter.replies.push(reply);
  writeJSON('letters.json', letterData);

  if (letter.senderId && letter.senderId !== userId) {
    createNotification(
      letter.senderId,
      'new_reply',
      '收到一封AI回信 ✨',
      `你的信《${letter.title}》收到了来自 ${candidate.senderName} 的AI回信`,
      id
    );
  }

  res.json({
    success: true,
    message: '已选择AI回复并发送',
    data: { reply, pool }
  });
});

router.post('/:id/check-timeout', (req, res) => {
  const { id } = req.params;

  const letterData = readJSON('letters.json') || { letters: [] };
  const letter = letterData.letters.find(l => l.id === id);

  if (!letter) {
    return res.status(404).json({ success: false, message: '信件不存在' });
  }

  const hasFallback = checkAndApplyTimeoutFallback(letter);

  if (hasFallback) {
    writeJSON('letters.json', letterData);
    const poolData = getReplyCandidatePoolData(id);
    return res.json({
      success: true,
      message: '超时补位已触发',
      data: { hasFallback: true, poolData }
    });
  }

  const poolData = getReplyCandidatePoolData(id);
  res.json({
    success: true,
    data: { hasFallback: false, poolData }
  });
});

router.post('/replies/:replyId/feedback', (req, res) => {
  const { replyId } = req.params;
  const { rating, helpful, tags, comment, userId } = req.body;

  if (rating === undefined || helpful === undefined) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: '评分需在1-5之间' });
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
    return res.status(404).json({ success: false, message: '回复不存在' });
  }

  if (targetReply.feedback) {
    return res.status(400).json({ success: false, message: '已经反馈过了' });
  }

  targetReply.feedback = {
    rating: parseInt(rating),
    helpful: helpful === true,
    tags: tags || [],
    comment: comment || '',
    userId: userId || null,
    createdAt: new Date().toISOString()
  };

  writeJSON('letters.json', letterData);

  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };
  if (targetReply.candidateId) {
    const candidate = candidateData.candidates.find(c => c.id === targetReply.candidateId);
    if (candidate) {
      candidate.feedbackCount = (candidate.feedbackCount || 0) + 1;
      candidate.totalRating = (candidate.totalRating || 0) + parseInt(rating);
      candidate.averageRating = Math.round((candidate.totalRating / candidate.feedbackCount) * 10) / 10;
      const cIdx = candidateData.candidates.findIndex(c => c.id === candidate.id);
      if (cIdx !== -1) {
        candidateData.candidates[cIdx] = candidate;
        writeJSON('replyCandidates.json', candidateData);
      }
    }
  }

  res.json({
    success: true,
    message: '感谢你的反馈 🌟',
    data: { feedback: targetReply.feedback }
  });
});

module.exports = router;
