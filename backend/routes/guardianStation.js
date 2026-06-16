const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const CONTENT_RISK_LEVELS = {
  safe: { level: 0, label: '安全', color: 'green', description: '内容健康积极' },
  mild: { level: 1, label: '轻度关注', color: 'yellow', description: '轻微负面情绪，建议关注' },
  moderate: { level: 2, label: '中度警示', color: 'orange', description: '存在明显负面情绪，需要干预' },
  severe: { level: 3, label: '重度风险', color: 'red', description: '存在自伤或伤害他人风险，需紧急干预' }
};

const RISK_KEYWORDS = {
  self_harm: ['自杀', '自残', '不想活', '结束生命', '割腕', '跳楼', '上吊', '服毒', '安眠药', '离开这个世界', '解脱'],
  harm_others: ['杀人', '报复', '同归于尽', '毁了他', '弄死', '打死', '杀了'],
  depression: ['抑郁', '绝望', '没有希望', '活着没意思', '生无可恋', '行尸走肉', '空虚', '麻木'],
  anxiety: ['焦虑', '恐慌', '害怕', '恐惧', '睡不着', '失眠', '心慌', '喘不过气'],
  abuse: ['家暴', '虐待', '欺凌', '霸凌', '被欺负', '被打', '被骂', '骚扰'],
  addiction: ['吸毒', '酗酒', '赌', '上瘾', '戒不掉']
};

const INTERVENTION_TYPES = {
  system_tip: { label: '系统提示', icon: '🤖', description: '系统自动推送关怀提示' },
  peer_care: { label: '同伴关怀', icon: '💝', description: '守护员发送关怀私信' },
  resource_push: { label: '资源推送', icon: '📚', description: '推送心理健康资源' },
  human_intervention: { label: '人工介入', icon: '👤', description: '专业人员介入干预' },
  emergency: { label: '紧急响应', icon: '🚨', description: '紧急情况升级处理' }
};

const REVIEW_STATUS = {
  pending: '待审核',
  approved: '审核通过',
  rejected: '审核驳回',
  escalated: '已升级'
};

const GUARDIAN_LEVELS = [
  { min: 0, name: '见习守护者', icon: '🌱', requiredReviews: 0 },
  { min: 5, name: '星光守护者', icon: '⭐', requiredReviews: 5 },
  { min: 15, name: '月光守护者', icon: '🌙', requiredReviews: 15 },
  { min: 30, name: '极光守护者', icon: '🌈', requiredReviews: 30 },
  { min: 50, name: '传奇守护者', icon: '👑', requiredReviews: 50 }
];

function analyzeContentRisk(content) {
  if (!content) return { level: 'safe', score: 0, details: [] };

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
      details.push({
        category,
        score: categoryScore,
        keywords: matchedKeywords
      });
      totalScore += categoryScore;
    }
  }

  let level = 'safe';
  if (totalScore >= 80) level = 'severe';
  else if (totalScore >= 40) level = 'moderate';
  else if (totalScore >= 10) level = 'mild';

  return {
    level,
    score: totalScore,
    details,
    categories: matchedCategories
  };
}

function getGuardianProfile(userId) {
  const guardianData = readJSON('guardians.json') || { guardians: [] };
  return guardianData.guardians.find(g => g.userId === userId) || null;
}

function getGuardianLevel(reviewCount) {
  let currentLevel = GUARDIAN_LEVELS[0];
  for (const level of GUARDIAN_LEVELS) {
    if (reviewCount >= level.min) {
      currentLevel = level;
    }
  }
  return currentLevel;
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

router.get('/risk-levels', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(CONTENT_RISK_LEVELS).map(([key, val]) => ({
      key,
      ...val
    }))
  });
});

router.post('/analyze', (req, res) => {
  const { content, contentType = 'letter', targetId = null } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: '缺少分析内容' });
  }

  const analysisResult = analyzeContentRisk(content);

  if (targetId && analysisResult.level !== 'safe') {
    const ratingData = readJSON('contentRatings.json') || { ratings: [] };
    const existingRating = ratingData.ratings.find(r => r.targetId === targetId && r.targetType === contentType);

    const ratingRecord = {
      id: existingRating?.id || generateId(),
      targetId,
      targetType: contentType,
      riskLevel: analysisResult.level,
      riskScore: analysisResult.score,
      riskCategories: analysisResult.categories,
      details: analysisResult.details,
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

    if (analysisResult.level === 'severe' || analysisResult.level === 'moderate') {
      const interventionData = readJSON('interventions.json') || { interventions: [] };
      const existingIntervention = interventionData.interventions.find(
        i => i.targetId === targetId && i.targetType === contentType && i.status !== 'closed'
      );

      if (!existingIntervention) {
        const intervention = {
          id: generateId(),
          targetId,
          targetType: contentType,
          riskLevel: analysisResult.level,
          riskScore: analysisResult.score,
          type: analysisResult.level === 'severe' ? 'emergency' : 'system_tip',
          status: 'pending',
          priority: analysisResult.level === 'severe' ? 'high' : 'medium',
          records: [
            {
              id: generateId(),
              type: 'system_detection',
              content: `系统检测到${CONTENT_RISK_LEVELS[analysisResult.level].label}风险内容`,
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

  res.json({
    success: true,
    data: {
      ...analysisResult,
      levelInfo: CONTENT_RISK_LEVELS[analysisResult.level]
    }
  });
});

router.get('/ratings', (req, res) => {
  const { riskLevel, targetType, page = 1, limit = 20 } = req.query;
  
  const ratingData = readJSON('contentRatings.json') || { ratings: [] };
  let ratings = ratingData.ratings;

  if (riskLevel) {
    ratings = ratings.filter(r => r.riskLevel === riskLevel);
  }
  if (targetType) {
    ratings = ratings.filter(r => r.targetType === targetType);
  }

  ratings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = ratings.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: ratings.length,
    page: pageNum,
    limit: limitNum
  });
});

router.get('/rating/:targetId', (req, res) => {
  const { targetId } = req.params;
  const { targetType = 'letter' } = req.query;
  
  const ratingData = readJSON('contentRatings.json') || { ratings: [] };
  const rating = ratingData.ratings.find(r => r.targetId === targetId && r.targetType === targetType);

  res.json({
    success: true,
    data: rating || null
  });
});

router.get('/review/tasks', (req, res) => {
  const { status, riskLevel, limit = 20, page = 1 } = req.query;
  
  const reviewData = readJSON('replyReviews.json') || { reviews: [] };
  let reviews = reviewData.reviews;

  if (status) {
    reviews = reviews.filter(r => r.status === status);
  }
  if (riskLevel) {
    reviews = reviews.filter(r => r.riskLevel === riskLevel);
  }

  reviews.sort((a, b) => {
    const priorityOrder = { severe: 0, moderate: 1, mild: 2, safe: 3 };
    const prioDiff = priorityOrder[a.riskLevel] - priorityOrder[b.riskLevel];
    if (prioDiff !== 0) return prioDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = reviews.slice(start, start + limitNum);

  const letterData = readJSON('letters.json') || { letters: [] };
  const tasksWithContent = paginated.map(review => {
    const letter = letterData.letters.find(l => l.id === review.letterId);
    const reply = letter?.replies?.find(r => r.id === review.replyId);
    return {
      ...review,
      letterTitle: letter?.title || '',
      replyContent: reply?.content || '',
      replyEmotion: reply?.emotion || ''
    };
  });

  res.json({
    success: true,
    data: tasksWithContent,
    total: reviews.length,
    page: pageNum,
    limit: limitNum
  });
});

router.post('/review/submit', (req, res) => {
  const { reviewId, decision, reason, reviewerId } = req.body;

  if (!reviewId || !decision || !reviewerId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (!['approved', 'rejected', 'escalated'].includes(decision)) {
    return res.status(400).json({ success: false, message: '无效的审核决定' });
  }

  const reviewData = readJSON('replyReviews.json') || { reviews: [] };
  const review = reviewData.reviews.find(r => r.id === reviewId);

  if (!review) {
    return res.status(404).json({ success: false, message: '审核记录不存在' });
  }

  if (review.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该记录已被审核' });
  }

  review.status = decision;
  review.reviewerId = reviewerId;
  review.reviewReason = reason || '';
  review.reviewedAt = new Date().toISOString();

  writeJSON('replyReviews.json', reviewData);

  const guardianData = readJSON('guardians.json') || { guardians: [] };
  let guardian = guardianData.guardians.find(g => g.userId === reviewerId);
  
  if (!guardian) {
    guardian = {
      userId: reviewerId,
      totalReviews: 0,
      approvedCount: 0,
      rejectedCount: 0,
      escalatedCount: 0,
      totalInterventions: 0,
      joinedAt: new Date().toISOString()
    };
    guardianData.guardians.push(guardian);
  }

  guardian.totalReviews++;
  if (decision === 'approved') guardian.approvedCount++;
  if (decision === 'rejected') guardian.rejectedCount++;
  if (decision === 'escalated') guardian.escalatedCount++;
  guardian.lastActiveAt = new Date().toISOString();

  const level = getGuardianLevel(guardian.totalReviews);
  guardian.level = level.name;
  guardian.levelIcon = level.icon;

  writeJSON('guardians.json', guardianData);

  if (decision === 'rejected') {
    const letterData = readJSON('letters.json') || { letters: [] };
    for (const letter of letterData.letters) {
      const replyIndex = letter.replies?.findIndex(r => r.id === review.replyId);
      if (replyIndex !== undefined && replyIndex >= 0) {
        letter.replies[replyIndex].isHidden = true;
        letter.replies[replyIndex].hiddenReason = reason || '内容审核不通过';
        letter.replies[replyIndex].hiddenAt = new Date().toISOString();
        break;
      }
    }
    writeJSON('letters.json', letterData);
  }

  if (decision === 'escalated') {
    const interventionData = readJSON('interventions.json') || { interventions: [] };
    const intervention = {
      id: generateId(),
      targetId: review.replyId,
      targetType: 'reply',
      letterId: review.letterId,
      riskLevel: review.riskLevel,
      type: 'human_intervention',
      status: 'pending',
      priority: 'high',
      source: 'guardian_escalation',
      escalatedBy: reviewerId,
      records: [
        {
          id: generateId(),
          type: 'guardian_escalation',
          content: `守护员升级处理：${reason || '无原因'}`,
          operator: reviewerId,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    interventionData.interventions.unshift(intervention);
    writeJSON('interventions.json', interventionData);
  }

  res.json({
    success: true,
    message: '审核已提交',
    data: review
  });
});

router.get('/interventions', (req, res) => {
  const { status, priority, type, page = 1, limit = 20 } = req.query;
  
  const interventionData = readJSON('interventions.json') || { interventions: [] };
  let interventions = interventionData.interventions;

  if (status) {
    interventions = interventions.filter(i => i.status === status);
  }
  if (priority) {
    interventions = interventions.filter(i => i.priority === priority);
  }
  if (type) {
    interventions = interventions.filter(i => i.type === type);
  }

  interventions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (prioDiff !== 0) return prioDiff;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = interventions.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: interventions.length,
    page: pageNum,
    limit: limitNum
  });
});

router.get('/interventions/:id', (req, res) => {
  const { id } = req.params;
  
  const interventionData = readJSON('interventions.json') || { interventions: [] };
  const intervention = interventionData.interventions.find(i => i.id === id);

  if (!intervention) {
    return res.status(404).json({ success: false, message: '干预记录不存在' });
  }

  res.json({
    success: true,
    data: intervention
  });
});

router.post('/interventions/:id/record', (req, res) => {
  const { id } = req.params;
  const { type, content, operatorId, status, newType } = req.body;

  if (!type || !content || !operatorId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  const interventionData = readJSON('interventions.json') || { interventions: [] };
  const intervention = interventionData.interventions.find(i => i.id === id);

  if (!intervention) {
    return res.status(404).json({ success: false, message: '干预记录不存在' });
  }

  const record = {
    id: generateId(),
    type,
    content,
    operator: operatorId,
    createdAt: new Date().toISOString()
  };

  intervention.records.push(record);
  intervention.updatedAt = new Date().toISOString();

  if (status) {
    intervention.status = status;
    if (status === 'closed') {
      intervention.closedAt = new Date().toISOString();
    }
  }

  if (newType) {
    intervention.type = newType;
  }

  writeJSON('interventions.json', interventionData);

  const guardianData = readJSON('guardians.json') || { guardians: [] };
  let guardian = guardianData.guardians.find(g => g.userId === operatorId);
  
  if (!guardian) {
    guardian = {
      userId: operatorId,
      totalReviews: 0,
      approvedCount: 0,
      rejectedCount: 0,
      escalatedCount: 0,
      totalInterventions: 0,
      joinedAt: new Date().toISOString()
    };
    guardianData.guardians.push(guardian);
  }

  guardian.totalInterventions++;
  guardian.lastActiveAt = new Date().toISOString();
  writeJSON('guardians.json', guardianData);

  res.json({
    success: true,
    message: '干预记录已添加',
    data: intervention
  });
});

router.post('/interventions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, operatorId } = req.body;

  if (!status || !operatorId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  const interventionData = readJSON('interventions.json') || { interventions: [] };
  const intervention = interventionData.interventions.find(i => i.id === id);

  if (!intervention) {
    return res.status(404).json({ success: false, message: '干预记录不存在' });
  }

  const statusLabels = {
    pending: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  };

  const record = {
    id: generateId(),
    type: 'status_change',
    content: `状态变更为：${statusLabels[status] || status}`,
    operator: operatorId,
    createdAt: new Date().toISOString()
  };

  intervention.records.push(record);
  intervention.status = status;
  intervention.updatedAt = new Date().toISOString();

  if (status === 'closed') {
    intervention.closedAt = new Date().toISOString();
  }

  writeJSON('interventions.json', interventionData);

  res.json({
    success: true,
    message: '状态已更新',
    data: intervention
  });
});

router.get('/guardian/:userId', (req, res) => {
  const { userId } = req.params;
  const guardian = getGuardianProfile(userId);

  const level = getGuardianLevel(guardian?.totalReviews || 0);

  res.json({
    success: true,
    data: guardian ? {
      ...guardian,
      level: level.name,
      levelIcon: level.icon,
      nextLevelMin: GUARDIAN_LEVELS.find(l => l.min > (guardian.totalReviews || 0))?.min || null,
      levelProgress: guardian.totalReviews || 0
    } : {
      userId,
      totalReviews: 0,
      approvedCount: 0,
      rejectedCount: 0,
      escalatedCount: 0,
      totalInterventions: 0,
      level: level.name,
      levelIcon: level.icon,
      joinedAt: null,
      isGuardian: false
    }
  });
});

router.get('/guardians/ranking', (req, res) => {
  const { limit = 20 } = req.query;
  
  const guardianData = readJSON('guardians.json') || { guardians: [] };
  const guardians = [...guardianData.guardians];

  guardians.sort((a, b) => {
    const scoreDiff = (b.totalReviews * 2 + b.totalInterventions * 5) - (a.totalReviews * 2 + a.totalInterventions * 5);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.joinedAt) - new Date(a.joinedAt);
  });

  const userData = readJSON('users.json') || { users: [] };
  const ranking = guardians.slice(0, parseInt(limit)).map((g, index) => {
    const user = userData.users?.find(u => u.id === g.userId);
    const level = getGuardianLevel(g.totalReviews);
    return {
      rank: index + 1,
      userId: g.userId,
      username: user?.username || '匿名用户',
      avatar: user?.avatar || '',
      totalReviews: g.totalReviews,
      totalInterventions: g.totalInterventions,
      level: level.name,
      levelIcon: level.icon,
      score: g.totalReviews * 2 + g.totalInterventions * 5
    };
  });

  res.json({
    success: true,
    data: ranking,
    total: guardians.length
  });
});

router.get('/stats', (req, res) => {
  const ratingData = readJSON('contentRatings.json') || { ratings: [] };
  const reviewData = readJSON('replyReviews.json') || { reviews: [] };
  const interventionData = readJSON('interventions.json') || { interventions: [] };
  const guardianData = readJSON('guardians.json') || { guardians: [] };

  const stats = {
    contentRatings: {
      total: ratingData.ratings.length,
      byLevel: {
        safe: ratingData.ratings.filter(r => r.riskLevel === 'safe').length,
        mild: ratingData.ratings.filter(r => r.riskLevel === 'mild').length,
        moderate: ratingData.ratings.filter(r => r.riskLevel === 'moderate').length,
        severe: ratingData.ratings.filter(r => r.riskLevel === 'severe').length
      }
    },
    reviews: {
      total: reviewData.reviews.length,
      pending: reviewData.reviews.filter(r => r.status === 'pending').length,
      approved: reviewData.reviews.filter(r => r.status === 'approved').length,
      rejected: reviewData.reviews.filter(r => r.status === 'rejected').length,
      escalated: reviewData.reviews.filter(r => r.status === 'escalated').length
    },
    interventions: {
      total: interventionData.interventions.length,
      pending: interventionData.interventions.filter(i => i.status === 'pending').length,
      in_progress: interventionData.interventions.filter(i => i.status === 'in_progress').length,
      resolved: interventionData.interventions.filter(i => i.status === 'resolved').length,
      closed: interventionData.interventions.filter(i => i.status === 'closed').length,
      highPriority: interventionData.interventions.filter(i => i.priority === 'high').length
    },
    guardians: {
      total: guardianData.guardians.length,
      activeToday: guardianData.guardians.filter(g => {
        if (!g.lastActiveAt) return false;
        const lastActive = new Date(g.lastActiveAt);
        const today = new Date();
        return lastActive.toDateString() === today.toDateString();
      }).length
    }
  };

  res.json({
    success: true,
    data: stats
  });
});

router.get('/intervention-types', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(INTERVENTION_TYPES).map(([key, val]) => ({
      key,
      ...val
    }))
  });
});

router.post('/apply-guardian', (req, res) => {
  const { userId, reason } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const guardianData = readJSON('guardians.json') || { guardians: [] };
  const existing = guardianData.guardians.find(g => g.userId === userId);

  if (existing) {
    return res.status(400).json({ success: false, message: '您已经是守护员了' });
  }

  const applicationData = readJSON('guardianApplications.json') || { applications: [] };
  const existingApp = applicationData.applications.find(a => a.userId === userId && a.status === 'pending');

  if (existingApp) {
    return res.status(400).json({ success: false, message: '您的申请正在审核中' });
  }

  const application = {
    id: generateId(),
    userId,
    reason: reason || '',
    status: 'approved',
    appliedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString()
  };

  applicationData.applications.push(application);
  writeJSON('guardianApplications.json', applicationData);

  const guardian = {
    userId,
    totalReviews: 0,
    approvedCount: 0,
    rejectedCount: 0,
    escalatedCount: 0,
    totalInterventions: 0,
    level: '见习守护者',
    levelIcon: '🌱',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  guardianData.guardians.push(guardian);
  writeJSON('guardians.json', guardianData);

  createNotification(
    userId,
    'guardian_approved',
    '欢迎加入守护站 💫',
    '恭喜您成为星邮局守护站的一员，一起守护每一颗柔软的心。',
    null
  );

  res.json({
    success: true,
    message: '欢迎加入守护站！',
    data: guardian
  });
});

module.exports = router;
