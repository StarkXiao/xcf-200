const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const EMOTION_STYLES = [
  'warm',
  'healing',
  'hope',
  'miss',
  'mystery',
  'happiness',
  'courage',
  'auto',
];

function initSharesData() {
  let data = readJSON('shares.json');
  if (!data) {
    data = { shares: [] };
    writeJSON('shares.json', data);
  }
  return data;
}

function initShareViewsData() {
  let data = readJSON('shareViews.json');
  if (!data) {
    data = { views: [] };
    writeJSON('shareViews.json', data);
  }
  return data;
}

function getLetterTitle(letterId) {
  const lettersData = readJSON('letters.json');
  if (!lettersData || !lettersData.letters) return null;
  const letter = lettersData.letters.find((l) => l.id === letterId);
  return letter ? letter.title : null;
}

router.post('/', (req, res) => {
  try {
    const {
      targetType,
      targetId,
      shareChannel,
      emotionStyle,
      isAnonymous,
      userId,
    } = req.body;

    if (!targetType || !targetId || !shareChannel || !emotionStyle) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    if (!['letter', 'profile'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的分享目标类型',
      });
    }

    if (!EMOTION_STYLES.includes(emotionStyle)) {
      return res.status(400).json({
        success: false,
        message: '无效的情绪样式',
      });
    }

    const data = initSharesData();
    const now = new Date().toISOString();

    const newShare = {
      id: generateId(),
      targetType,
      targetId,
      userId: userId || null,
      shareChannel,
      emotionStyle,
      isAnonymous: !!isAnonymous,
      createdAt: now,
    };

    data.shares.push(newShare);
    writeJSON('shares.json', data);

    let shareUrl = '';
    if (targetType === 'letter') {
      shareUrl = `${req.protocol}://${req.get('host')}/letter/${targetId}?share=${newShare.id}`;
    } else {
      shareUrl = `${req.protocol}://${req.get('host')}/profile?share=${newShare.id}`;
    }

    res.json({
      success: true,
      message: '分享记录已创建',
      data: {
        ...newShare,
        shareUrl,
      },
    });
  } catch (err) {
    console.error('Create share error:', err);
    res.status(500).json({
      success: false,
      message: '创建分享记录失败',
    });
  }
});

router.post('/view', (req, res) => {
  try {
    const { targetType, targetId, shareId, shareUrl, viewerId } = req.body;

    if (!targetType || !targetId || !shareId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    const sharesData = initSharesData();
    const share = sharesData.shares.find((s) => s.id === shareId);

    if (!share) {
      return res.status(404).json({
        success: false,
        message: '分享记录不存在',
      });
    }

    const viewsData = initShareViewsData();
    const now = new Date().toISOString();

    const newView = {
      id: generateId(),
      shareId,
      targetType,
      targetId,
      viewerId: viewerId || null,
      viewerIp: req.ip || req.connection.remoteAddress || null,
      viewedAt: now,
      shareUrl: shareUrl || '',
    };

    viewsData.views.push(newView);
    writeJSON('shareViews.json', viewsData);

    res.json({
      success: true,
      message: '浏览记录已记录',
      data: { success: true },
    });
  } catch (err) {
    console.error('Record share view error:', err);
    res.status(500).json({
      success: false,
      message: '记录浏览失败',
    });
  }
});

router.get('/user/:userId/stats', (req, res) => {
  try {
    const { userId } = req.params;

    const sharesData = initSharesData();
    const viewsData = initShareViewsData();
    const lettersData = readJSON('letters.json');

    const userShares = sharesData.shares.filter((s) => s.userId === userId);
    const userShareIds = userShares.map((s) => s.id);

    const userViews = viewsData.views.filter((v) =>
      userShareIds.includes(v.shareId)
    );

    const uniqueViewers = new Set();
    userViews.forEach((v) => {
      const key = v.viewerId || v.viewerIp || `anon-${v.id}`;
      uniqueViewers.add(key);
    });

    const shareBreakdown = {
      letter: userShares.filter((s) => s.targetType === 'letter').length,
      profile: userShares.filter((s) => s.targetType === 'profile').length,
    };

    const channelBreakdown = {};
    userShares.forEach((s) => {
      channelBreakdown[s.shareChannel] =
        (channelBreakdown[s.shareChannel] || 0) + 1;
    });

    const emotionStyleBreakdown = {};
    EMOTION_STYLES.forEach((style) => {
      emotionStyleBreakdown[style] = userShares.filter(
        (s) => s.emotionStyle === style
      ).length;
    });

    const letterShares = userShares.filter((s) => s.targetType === 'letter');
    const letterShareCounts = {};
    letterShares.forEach((s) => {
      letterShareCounts[s.targetId] = (letterShareCounts[s.targetId] || 0) + 1;
    });

    const topSharedLetters = Object.entries(letterShareCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([letterId, shareCount]) => ({
        letterId,
        title: getLetterTitle(letterId) || '未知信件',
        shareCount,
      }));

    const recentShares = userShares
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    res.json({
      success: true,
      data: {
        totalShares: userShares.length,
        totalViews: userViews.length,
        uniqueViewers: uniqueViewers.size,
        shareBreakdown,
        channelBreakdown,
        emotionStyleBreakdown,
        topSharedLetters,
        recentShares,
      },
    });
  } catch (err) {
    console.error('Get user share stats error:', err);
    res.status(500).json({
      success: false,
      message: '获取分享统计失败',
    });
  }
});

router.get('/:targetType/:targetId/stats', (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!['letter', 'profile'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: '无效的分享目标类型',
      });
    }

    const sharesData = initSharesData();
    const viewsData = initShareViewsData();

    const targetShares = sharesData.shares.filter(
      (s) => s.targetType === targetType && s.targetId === targetId
    );
    const targetShareIds = targetShares.map((s) => s.id);

    const targetViews = viewsData.views.filter((v) =>
      targetShareIds.includes(v.shareId)
    );

    const emotionStyleBreakdown = {};
    EMOTION_STYLES.forEach((style) => {
      emotionStyleBreakdown[style] = targetShares.filter(
        (s) => s.emotionStyle === style
      ).length;
    });

    res.json({
      success: true,
      data: {
        totalShares: targetShares.length,
        totalViews: targetViews.length,
        emotionStyleBreakdown,
      },
    });
  } catch (err) {
    console.error('Get target share stats error:', err);
    res.status(500).json({
      success: false,
      message: '获取分享统计失败',
    });
  }
});

router.get('/user/:userId/recent', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const data = initSharesData();
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const recentShares = data.shares
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limitNum);

    res.json({
      success: true,
      data: recentShares,
    });
  } catch (err) {
    console.error('Get user recent shares error:', err);
    res.status(500).json({
      success: false,
      message: '获取分享记录失败',
    });
  }
});

module.exports = router;
