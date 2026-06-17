const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const REPORT_TYPES = {
  spam: { label: '垃圾广告', icon: '📧', description: '包含垃圾广告、推广信息' },
  harassment: { label: '骚扰辱骂', icon: '😤', description: '包含辱骂、骚扰、人身攻击' },
  inappropriate: { label: '不当内容', icon: '⚠️', description: '包含色情、低俗、暴力等不当内容' },
  violence: { label: '暴力血腥', icon: '🩸', description: '包含暴力、血腥、恐怖内容' },
  self_harm: { label: '自伤倾向', icon: '💔', description: '包含自残、自杀倾向内容' },
  privacy: { label: '侵犯隐私', icon: '🔒', description: '泄露他人隐私信息' },
  plagiarism: { label: '抄袭盗用', icon: '📝', description: '抄袭、盗用他人内容' },
  other: { label: '其他', icon: '📋', description: '其他违规行为' }
};

const REPORT_STATUS = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已处理',
  rejected: '已驳回'
};

const REPORT_RESULTS = {
  content_removed: '内容已删除',
  content_hidden: '内容已隐藏',
  user_warned: '用户已警告',
  user_banned: '用户已封禁',
  no_violation: '未违规',
  other: '其他处理'
};

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

function getLetterById(letterId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  return letterData.letters.find(l => l.id === letterId);
}

function getReplyById(replyId) {
  const letterData = readJSON('letters.json') || { letters: [] };
  for (const letter of letterData.letters) {
    const reply = letter.replies?.find(r => r.id === replyId);
    if (reply) {
      return { letter, reply };
    }
  }
  return null;
}

router.get('/types', (req, res) => {
  const types = Object.entries(REPORT_TYPES).map(([key, val]) => ({
    key,
    ...val
  }));

  res.json({
    success: true,
    data: types
  });
});

router.get('/stats', (req, res) => {
  const reportData = readJSON('reports.json') || { reports: [] };

  const stats = {
    total: reportData.reports.length,
    pending: reportData.reports.filter(r => r.status === 'pending').length,
    processing: reportData.reports.filter(r => r.status === 'processing').length,
    resolved: reportData.reports.filter(r => r.status === 'resolved').length,
    rejected: reportData.reports.filter(r => r.status === 'rejected').length,
    byType: {},
    byTargetType: {
      letter: reportData.reports.filter(r => r.targetType === 'letter').length,
      reply: reportData.reports.filter(r => r.targetType === 'reply').length
    },
    todayCount: reportData.reports.filter(r => {
      const today = new Date();
      const reportDate = new Date(r.createdAt);
      return reportDate.toDateString() === today.toDateString();
    }).length
  };

  Object.keys(REPORT_TYPES).forEach(type => {
    stats.byType[type] = reportData.reports.filter(r => r.reportType === type).length;
  });

  res.json({
    success: true,
    data: stats
  });
});

router.get('/check-reported/:targetId', (req, res) => {
  const { targetId } = req.params;
  const { targetType = 'letter', userId } = req.query;

  const reportData = readJSON('reports.json') || { reports: [] };
  const targetReports = reportData.reports.filter(
    r => r.targetId === targetId && r.targetType === targetType
  );

  const hasUserReported = userId
    ? targetReports.some(r => r.reporterId === userId)
    : false;

  let reviewStatus = 'normal';
  if (targetReports.length > 0) {
    const latestReport = targetReports.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (latestReport.status === 'resolved') {
      reviewStatus = 'resolved';
    } else if (latestReport.status === 'rejected') {
      reviewStatus = 'rejected';
    } else {
      reviewStatus = 'pending_review';
    }
  }

  res.json({
    success: true,
    data: {
      hasReported: hasUserReported,
      reportCount: targetReports.length,
      reviewStatus,
      targetId,
      targetType
    }
  });
});

router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const reportData = readJSON('reports.json') || { reports: [] };
  let reports = reportData.reports.filter(r => r.reporterId === userId);

  if (status) {
    reports = reports.filter(r => r.status === status);
  }

  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = reports.slice(start, start + limitNum);

  const reportsWithContent = paginated.map(report => {
    let targetTitle = '';
    let targetContent = '';

    if (report.targetType === 'letter') {
      const letter = getLetterById(report.targetId);
      targetTitle = letter?.title || '';
      targetContent = letter?.content?.substring(0, 100) || '';
    } else if (report.targetType === 'reply') {
      const replyInfo = getReplyById(report.targetId);
      if (replyInfo) {
        targetTitle = replyInfo.letter?.title || '';
        targetContent = replyInfo.reply?.content?.substring(0, 100) || '';
      }
    }

    return {
      ...report,
      targetTitle,
      targetContent,
      statusLabel: REPORT_STATUS[report.status]
    };
  });

  res.json({
    success: true,
    data: reportsWithContent,
    total: reports.length,
    page: pageNum,
    limit: limitNum
  });
});

router.post('/', (req, res) => {
  const { targetId, targetType, reportType, reason, reporterId, reporterName } = req.body;

  if (!targetId || !targetType || !reportType) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (!['letter', 'reply'].includes(targetType)) {
    return res.status(400).json({ success: false, message: '无效的举报目标类型' });
  }

  if (!REPORT_TYPES[reportType]) {
    return res.status(400).json({ success: false, message: '无效的举报类型' });
  }

  if (targetType === 'letter') {
    const letter = getLetterById(targetId);
    if (!letter) {
      return res.status(404).json({ success: false, message: '信件不存在' });
    }
  } else if (targetType === 'reply') {
    const replyInfo = getReplyById(targetId);
    if (!replyInfo) {
      return res.status(404).json({ success: false, message: '回复不存在' });
    }
  }

  const reportData = readJSON('reports.json') || { reports: [] };

  if (reporterId) {
    const existingReport = reportData.reports.find(
      r => r.targetId === targetId && r.targetType === targetType && r.reporterId === reporterId
    );
    if (existingReport) {
      return res.status(400).json({ success: false, message: '您已经举报过该内容' });
    }
  }

  const report = {
    id: generateId(),
    targetId,
    targetType,
    reportType,
    reportTypeLabel: REPORT_TYPES[reportType].label,
    reason: reason || '',
    reporterId: reporterId || null,
    reporterName: reporterName || '匿名用户',
    status: 'pending',
    handlerId: null,
    handlerName: null,
    result: null,
    resultType: null,
    handledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  reportData.reports.unshift(report);
  writeJSON('reports.json', reportData);

  if (targetType === 'letter') {
    const letterData = readJSON('letters.json') || { letters: [] };
    const letterIndex = letterData.letters.findIndex(l => l.id === targetId);
    if (letterIndex !== -1) {
      const letter = letterData.letters[letterIndex];
      letter.reportCount = (letter.reportCount || 0) + 1;
      if (!letter.reviewStatus || letter.reviewStatus === 'normal') {
        letter.reviewStatus = 'pending_review';
      }
      letter.updatedAt = new Date().toISOString();
      writeJSON('letters.json', letterData);
    }
  } else if (targetType === 'reply') {
    const letterData = readJSON('letters.json') || { letters: [] };
    for (const letter of letterData.letters) {
      const replyIndex = letter.replies?.findIndex(r => r.id === targetId);
      if (replyIndex !== undefined && replyIndex >= 0) {
        const reply = letter.replies[replyIndex];
        reply.reportCount = (reply.reportCount || 0) + 1;
        if (!reply.reviewStatus || reply.reviewStatus === 'normal') {
          reply.reviewStatus = 'pending_review';
        }
        writeJSON('letters.json', letterData);
        break;
      }
    }
  }

  res.json({
    success: true,
    message: '举报已提交，我们会尽快处理',
    data: report
  });
});

router.get('/', (req, res) => {
  const { status, targetType, reportType, page = 1, limit = 20, sort = 'latest' } = req.query;

  const reportData = readJSON('reports.json') || { reports: [] };
  let reports = reportData.reports;

  if (status) {
    reports = reports.filter(r => r.status === status);
  }
  if (targetType) {
    reports = reports.filter(r => r.targetType === targetType);
  }
  if (reportType) {
    reports = reports.filter(r => r.reportType === reportType);
  }

  if (sort === 'latest') {
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'oldest') {
    reports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = reports.slice(start, start + limitNum);

  const reportsWithContent = paginated.map(report => {
    let targetTitle = '';
    let targetContent = '';
    let targetUserId = null;
    let targetUserName = '';

    if (report.targetType === 'letter') {
      const letter = getLetterById(report.targetId);
      targetTitle = letter?.title || '';
      targetContent = letter?.content || '';
      targetUserId = letter?.senderId || null;
      targetUserName = letter?.isAnonymous ? '匿名星人' : (letter?.senderName || '');
    } else if (report.targetType === 'reply') {
      const replyInfo = getReplyById(report.targetId);
      if (replyInfo) {
        targetTitle = replyInfo.letter?.title || '';
        targetContent = replyInfo.reply?.content || '';
        targetUserId = replyInfo.reply?.replierId || null;
        targetUserName = replyInfo.reply?.senderName || '';
      }
    }

    return {
      ...report,
      targetTitle,
      targetContent,
      targetUserId,
      targetUserName,
      statusLabel: REPORT_STATUS[report.status]
    };
  });

  res.json({
    success: true,
    data: reportsWithContent,
    total: reports.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(reports.length / limitNum)
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const reportData = readJSON('reports.json') || { reports: [] };
  const report = reportData.reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ success: false, message: '举报记录不存在' });
  }

  let targetTitle = '';
  let targetContent = '';
  let targetUserId = null;
  let targetUserName = '';
  let letterId = null;

  if (report.targetType === 'letter') {
    const letter = getLetterById(report.targetId);
    targetTitle = letter?.title || '';
    targetContent = letter?.content || '';
    targetUserId = letter?.senderId || null;
    targetUserName = letter?.isAnonymous ? '匿名星人' : (letter?.senderName || '');
    letterId = report.targetId;
  } else if (report.targetType === 'reply') {
    const replyInfo = getReplyById(report.targetId);
    if (replyInfo) {
      targetTitle = replyInfo.letter?.title || '';
      targetContent = replyInfo.reply?.content || '';
      targetUserId = replyInfo.reply?.replierId || null;
      targetUserName = replyInfo.reply?.senderName || '';
      letterId = replyInfo.letter?.id || null;
    }
  }

  const reportDetail = {
    ...report,
    targetTitle,
    targetContent,
    targetUserId,
    targetUserName,
    letterId,
    statusLabel: REPORT_STATUS[report.status],
    resultLabel: report.resultType ? REPORT_RESULTS[report.resultType] : null
  };

  res.json({
    success: true,
    data: reportDetail
  });
});

router.post('/:id/handle', (req, res) => {
  const { id } = req.params;
  const { resultType, result, handlerId, handlerName, action } = req.body;

  if (!id || !handlerId) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (!['warning', 'hide', 'remove', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: '无效的处理动作' });
  }

  const reportData = readJSON('reports.json') || { reports: [] };
  const reportIndex = reportData.reports.findIndex(r => r.id === id);

  if (reportIndex === -1) {
    return res.status(404).json({ success: false, message: '举报记录不存在' });
  }

  const report = reportData.reports[reportIndex];

  if (report.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该举报已被处理' });
  }

  report.status = action === 'reject' ? 'rejected' : 'resolved';
  report.handlerId = handlerId;
  report.handlerName = handlerName || '管理员';
  report.resultType = resultType || (action === 'reject' ? 'no_violation' : 'other');
  report.result = result || '';
  report.handledAt = new Date().toISOString();
  report.updatedAt = new Date().toISOString();

  reportData.reports[reportIndex] = report;
  writeJSON('reports.json', reportData);

  if (report.targetType === 'letter') {
    const letterData = readJSON('letters.json') || { letters: [] };
    const letterIndex = letterData.letters.findIndex(l => l.id === report.targetId);
    if (letterIndex !== -1) {
      const letter = letterData.letters[letterIndex];

      if (action === 'hide') {
        letter.isHidden = true;
        letter.hiddenReason = result || '内容违规';
        letter.hiddenAt = new Date().toISOString();
        letter.hiddenBy = handlerId;
        letter.reviewStatus = 'hidden';
      } else if (action === 'remove') {
        letter.isRemoved = true;
        letter.removedReason = result || '内容违规';
        letter.removedAt = new Date().toISOString();
        letter.removedBy = handlerId;
        letter.reviewStatus = 'removed';
      } else if (action === 'warning') {
        letter.reviewStatus = 'warned';
        if (!letter.warnings) letter.warnings = [];
        letter.warnings.push({
          id: generateId(),
          reason: result || '内容警告',
          warnedBy: handlerId,
          warnedAt: new Date().toISOString()
        });
      } else if (action === 'reject') {
        letter.reviewStatus = 'normal';
      }

      letter.updatedAt = new Date().toISOString();
      writeJSON('letters.json', letterData);

      if (letter.senderId) {
        const actionLabels = {
          warning: '内容警告',
          hide: '内容已隐藏',
          remove: '内容已删除',
          reject: '举报驳回'
        };
        const messages = {
          warning: `您的信件《${letter.title}》收到了一次内容警告，请遵守社区规范。`,
          hide: `您的信件《${letter.title}》因内容违规已被隐藏。`,
          remove: `您的信件《${letter.title}》因内容违规已被删除。`,
          reject: `关于您的信件《${letter.title}》的举报已被驳回，内容未违规。`
        };

        createNotification(
          letter.senderId,
          'report_result',
          actionLabels[action] + '通知',
          messages[action],
          report.targetId
        );
      }
    }
  } else if (report.targetType === 'reply') {
    const letterData = readJSON('letters.json') || { letters: [] };
    for (const letter of letterData.letters) {
      const replyIndex = letter.replies?.findIndex(r => r.id === report.targetId);
      if (replyIndex !== undefined && replyIndex >= 0) {
        const reply = letter.replies[replyIndex];

        if (action === 'hide') {
          reply.isHidden = true;
          reply.hiddenReason = result || '内容违规';
          reply.hiddenAt = new Date().toISOString();
          reply.hiddenBy = handlerId;
          reply.reviewStatus = 'hidden';
        } else if (action === 'remove') {
          reply.isRemoved = true;
          reply.removedReason = result || '内容违规';
          reply.removedAt = new Date().toISOString();
          reply.removedBy = handlerId;
          reply.reviewStatus = 'removed';
        } else if (action === 'warning') {
          reply.reviewStatus = 'warned';
          if (!reply.warnings) reply.warnings = [];
          reply.warnings.push({
            id: generateId(),
            reason: result || '内容警告',
            warnedBy: handlerId,
            warnedAt: new Date().toISOString()
          });
        } else if (action === 'reject') {
          reply.reviewStatus = 'normal';
        }

        writeJSON('letters.json', letterData);

        if (reply.replierId) {
          const actionLabels = {
            warning: '内容警告',
            hide: '回复已隐藏',
            remove: '回复已删除',
            reject: '举报驳回'
          };
          const messages = {
            warning: `您在《${letter.title}》中的回复收到了一次内容警告，请遵守社区规范。`,
            hide: `您在《${letter.title}》中的回复因内容违规已被隐藏。`,
            remove: `您在《${letter.title}》中的回复因内容违规已被删除。`,
            reject: `关于您在《${letter.title}》中回复的举报已被驳回，内容未违规。`
          };

          createNotification(
            reply.replierId,
            'report_result',
            actionLabels[action] + '通知',
            messages[action],
            report.targetId
          );
        }
        break;
      }
    }
  }

  if (report.reporterId) {
    const reporterMessages = {
      warning: `您举报的内容已收到警告处理，感谢您的监督。`,
      hide: `您举报的内容已被隐藏，感谢您的监督。`,
      remove: `您举报的内容已被删除，感谢您的监督。`,
      reject: `您举报的内容经核查未发现违规，感谢您的监督。`
    };

    createNotification(
      report.reporterId,
      'report_result',
      '举报处理结果',
      reporterMessages[action],
      report.targetId
    );
  }

  res.json({
    success: true,
    message: '处理完成',
    data: report
  });
});

module.exports = router;
