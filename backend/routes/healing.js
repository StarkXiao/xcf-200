const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

const HEALING_EMOTIONS = ['治愈', '温暖', '希望', '勇气', '幸福'];

router.get('/analysis/:userId', (req, res) => {
  const { userId } = req.params;
  const recordData = readJSON('emotion-records.json') || { records: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const userRecords = recordData.records
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const emotionCountMap = {};
  userRecords.forEach(r => {
    emotionCountMap[r.emotion] = (emotionCountMap[r.emotion] || 0) + 1;
  });

  if (userRecords.length === 0) {
    const letterEmotionMap = {};
    letterData.letters
      .filter(l => l.senderId === userId && l.emotions)
      .forEach(l => {
        l.emotions.forEach(e => {
          letterEmotionMap[e] = (letterEmotionMap[e] || 0) + 1;
        });
      });

    const totalLetters = Object.values(letterEmotionMap).reduce((s, c) => s + c, 0);
    const distribution = Object.entries(letterEmotionMap)
      .map(([name, count]) => {
        const info = emotionData.emotions.find(e => e.name === name);
        return {
          name,
          color: info ? info.color : '#999',
          icon: info ? info.icon : '💫',
          count,
          percentage: totalLetters > 0 ? Math.round((count / totalLetters) * 100) : 0,
          trend: 'stable',
          trendValue: 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    const dominant = distribution.length > 0
      ? { name: distribution[0].name, color: distribution[0].color, icon: distribution[0].icon, percentage: distribution[0].percentage }
      : null;

    return res.json({
      success: true,
      data: {
        dominantEmotion: dominant,
        emotionDistribution: distribution,
        totalRecords: 0,
        recentEmotion: null,
        emotionBalance: 50,
      },
    });
  }

  const totalRecords = userRecords.length;
  const recentEmotion = userRecords.length > 0 ? userRecords[0].emotion : null;

  const distribution = Object.entries(emotionCountMap)
    .map(([name, count]) => {
      const info = emotionData.emotions.find(e => e.name === name);
      const recentCount = userRecords
        .filter(r => new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && r.emotion === name)
        .length;
      const olderCount = userRecords
        .filter(r => new Date(r.createdAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && r.emotion === name)
        .length;

      let trend = 'stable';
      let trendValue = 0;
      if (recentCount > olderCount) { trend = 'up'; trendValue = recentCount - olderCount; }
      else if (recentCount < olderCount) { trend = 'down'; trendValue = olderCount - recentCount; }

      return {
        name,
        color: info ? info.color : '#999',
        icon: info ? info.icon : '💫',
        count,
        percentage: Math.round((count / totalRecords) * 100),
        trend,
        trendValue,
      };
    })
    .sort((a, b) => b.count - a.count);

  const dominantEmotion = distribution.length > 0
    ? { name: distribution[0].name, color: distribution[0].color, icon: distribution[0].icon, percentage: distribution[0].percentage }
    : null;

  const positiveEmotions = ['希望', '勇气', '治愈', '温暖', '幸福', '爱情', '梦想', '好奇'];
  const positiveCount = userRecords.filter(r => positiveEmotions.includes(r.emotion)).length;
  const emotionBalance = totalRecords > 0 ? Math.round((positiveCount / totalRecords) * 100) : 50;

  res.json({
    success: true,
    data: {
      dominantEmotion,
      emotionDistribution: distribution,
      totalRecords,
      recentEmotion,
      emotionBalance,
    },
  });
});

router.get('/recommended-letters', (req, res) => {
  const { emotion, limit = 6 } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };

  let candidateLetters = letterData.letters.filter(l => l.isPublic);

  if (emotion) {
    const decodedEmotion = decodeURIComponent(emotion);

    if (HEALING_EMOTIONS.includes(decodedEmotion)) {
      const sameEmotion = candidateLetters.filter(l => l.emotions && l.emotions.includes(decodedEmotion));
      const otherHealing = candidateLetters.filter(l =>
        l.emotions && l.emotions.some(e => HEALING_EMOTIONS.includes(e)) && !l.emotions.includes(decodedEmotion)
      );
      candidateLetters = [...sameEmotion, ...otherHealing];
    } else {
      const sameEmotion = candidateLetters.filter(l => l.emotions && l.emotions.includes(decodedEmotion));
      const healingLetters = candidateLetters.filter(l =>
        l.emotions && l.emotions.some(e => HEALING_EMOTIONS.includes(e)) && !l.emotions.includes(decodedEmotion)
      );
      candidateLetters = [...sameEmotion, ...healingLetters];
    }
  } else {
    candidateLetters = candidateLetters
      .filter(l => l.emotions && l.emotions.some(e => HEALING_EMOTIONS.includes(e)))
      .sort((a, b) => b.likes - a.likes);
  }

  const recommended = candidateLetters.slice(0, parseInt(limit)).map(l => {
    const matchReason = l.emotions && l.emotions.some(e => HEALING_EMOTIONS.includes(e))
      ? '这是一封温暖治愈的信'
      : '与你当前的情绪产生了共鸣';

    return {
      id: l.id,
      title: l.title,
      content: l.content,
      senderName: l.isAnonymous ? '匿名星人' : l.senderName,
      emotions: l.emotions,
      likes: l.likes,
      repliesCount: l.replies ? l.replies.length : 0,
      createdAt: l.createdAt,
      recipientType: l.recipientType,
      matchReason,
    };
  });

  res.json({ success: true, data: recommended });
});

router.get('/templates', (req, res) => {
  const { emotion } = req.query;
  const templateData = readJSON('healing-templates.json') || { templates: [] };

  let templates = templateData.templates;
  if (emotion) {
    const decodedEmotion = decodeURIComponent(emotion);
    const matched = templates.filter(t => t.emotion === decodedEmotion);
    if (matched.length > 0) {
      templates = matched;
    }
  }

  res.json({ success: true, data: templates });
});

router.get('/templates/:id', (req, res) => {
  const { id } = req.params;
  const templateData = readJSON('healing-templates.json') || { templates: [] };
  const template = templateData.templates.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ success: false, message: '模板未找到' });
  }

  res.json({ success: true, data: template });
});

router.post('/emotion-record', (req, res) => {
  const { userId, emotion, intensity = 5, note = '' } = req.body;

  if (!userId || !emotion) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  if (intensity < 1 || intensity > 10) {
    return res.status(400).json({ success: false, message: '情绪强度应在1-10之间' });
  }

  const recordData = readJSON('emotion-records.json') || { records: [] };
  const newRecord = {
    id: generateId(),
    userId,
    emotion,
    intensity,
    note,
    createdAt: new Date().toISOString(),
  };

  recordData.records.push(newRecord);
  writeJSON('emotion-records.json', recordData);

  res.json({ success: true, data: newRecord, message: '情绪记录已保存' });
});

router.get('/emotion-records/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 30 } = req.query;
  const recordData = readJSON('emotion-records.json') || { records: [] };

  const userRecords = recordData.records
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, parseInt(limit));

  res.json({ success: true, data: userRecords });
});

router.get('/emotion-timeline/:userId', (req, res) => {
  const { userId } = req.params;
  const recordData = readJSON('emotion-records.json') || { records: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };

  const userRecords = recordData.records
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (userRecords.length === 0) {
    return res.json({
      success: true,
      data: { phases: [], totalRecords: 0, currentPhase: null },
    });
  }

  const phases = [];
  const phaseSize = Math.max(3, Math.ceil(userRecords.length / Math.min(6, userRecords.length)));

  for (let i = 0; i < userRecords.length; i += phaseSize) {
    const phaseRecords = userRecords.slice(i, i + phaseSize);
    const emotionCountMap = {};
    phaseRecords.forEach(r => {
      emotionCountMap[r.emotion] = (emotionCountMap[r.emotion] || 0) + 1;
    });

    const dominantEntry = Object.entries(emotionCountMap).sort((a, b) => b[1] - a[1])[0];
    const dominantName = dominantEntry ? dominantEntry[0] : '未知';
    const dominantInfo = emotionData.emotions.find(e => e.name === dominantName);

    const distribution = Object.entries(emotionCountMap)
      .map(([name, count]) => {
        const info = emotionData.emotions.find(e => e.name === name);
        return { name, color: info ? info.color : '#999', icon: info ? info.icon : '💫', count };
      })
      .sort((a, b) => b.count - a.count);

    const avgIntensity = phaseRecords.reduce((s, r) => s + r.intensity, 0) / phaseRecords.length;
    const phaseIndex = Math.floor(i / phaseSize) + 1;

    phases.push({
      period: `phase_${phaseIndex}`,
      label: `第${phaseIndex}阶段`,
      startDate: phaseRecords[0].createdAt,
      endDate: phaseRecords[phaseRecords.length - 1].createdAt,
      dominantEmotion: dominantName,
      dominantEmotionColor: dominantInfo ? dominantInfo.color : '#999',
      dominantEmotionIcon: dominantInfo ? dominantInfo.icon : '💫',
      recordCount: phaseRecords.length,
      emotionDistribution: distribution,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
    });
  }

  const currentPhase = phases.length > 0 ? phases[phases.length - 1] : null;

  res.json({
    success: true,
    data: { phases, totalRecords: userRecords.length, currentPhase },
  });
});

module.exports = router;
