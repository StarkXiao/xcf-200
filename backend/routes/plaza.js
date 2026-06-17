const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../utils/db');

function getActivityStatus(activity) {
  const now = new Date();
  const registrationStart = new Date(activity.registrationStart);
  const registrationEnd = new Date(activity.registrationEnd);
  const submissionEnd = new Date(activity.submissionEnd);
  const votingEnd = new Date(activity.votingEnd);

  if (now < registrationStart) return { status: 'upcoming', stage: '即将开始', stageLabel: '报名即将开启' };
  if (now <= registrationEnd) return { status: 'active', stage: 'registration', stageLabel: '报名进行中' };
  if (now <= submissionEnd) return { status: 'active', stage: 'submission', stageLabel: '作品提交中' };
  if (now <= votingEnd) return { status: 'voting', stage: 'voting', stageLabel: '点赞投票中' };
  return { status: 'settled', stage: 'settled', stageLabel: '已结束' };
}

function enrichActivity(activity) {
  const { status, stage, stageLabel } = getActivityStatus(activity);
  return {
    ...activity,
    status,
    currentStage: stage,
    stageLabel
  };
}

function countTopicLetters(topic, letters) {
  if (topic.isDefault) {
    return letters.filter(l => l.isPublic).length;
  }
  if (topic.relatedEmotions && topic.relatedEmotions.length > 0) {
    return letters.filter(l => 
      l.isPublic && 
      l.emotions && 
      topic.relatedEmotions.some(e => l.emotions.includes(e))
    ).length;
  }
  return 0;
}

router.get('/topics', (req, res) => {
  const topicData = readJSON('plaza-topics.json') || { topics: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const topicsWithCount = topicData.topics
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(topic => ({
      ...topic,
      letterCount: countTopicLetters(topic, letterData.letters)
    }));

  res.json({
    success: true,
    data: topicsWithCount,
    total: topicsWithCount.length
  });
});

router.get('/topics/:id', (req, res) => {
  const { id } = req.params;
  const topicData = readJSON('plaza-topics.json') || { topics: [] };
  const letterData = readJSON('letters.json') || { letters: [] };

  const topic = topicData.topics.find(t => t.id === id);
  if (!topic) {
    return res.status(404).json({ success: false, message: '主题不存在' });
  }

  const topicWithCount = {
    ...topic,
    letterCount: countTopicLetters(topic, letterData.letters)
  };

  res.json({
    success: true,
    data: topicWithCount
  });
});

router.get('/featured', (req, res) => {
  const { limit = 5 } = req.query;
  const featuredData = readJSON('plaza-featured.json') || { featured: [] };
  const letterData = readJSON('letters.json') || { letters: [] };
  const activityData = readJSON('activities.json') || { activities: [] };

  const now = new Date();
  const activeFeatured = featuredData.featured
    .filter(f => {
      if (!f.isActive) return false;
      const startTime = new Date(f.startTime);
      const endTime = new Date(f.endTime);
      return now >= startTime && now <= endTime;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, parseInt(limit))
    .map(item => {
      let targetData = null;
      if (item.type === 'letter') {
        targetData = letterData.letters.find(l => l.id === item.targetId);
        if (targetData) {
          targetData = {
            id: targetData.id,
            title: targetData.title,
            content: targetData.content.substring(0, 100) + (targetData.content.length > 100 ? '...' : ''),
            senderName: targetData.isAnonymous ? '匿名星人' : targetData.senderName,
            emotions: targetData.emotions,
            likes: targetData.likes || 0,
            repliesCount: targetData.replies ? targetData.replies.length : 0,
            createdAt: targetData.createdAt
          };
        }
      } else if (item.type === 'activity') {
        const activity = activityData.activities.find(a => a.id === item.targetId);
        if (activity) {
          targetData = enrichActivity(activity);
        }
      }
      return {
        ...item,
        target: targetData
      };
    });

  res.json({
    success: true,
    data: activeFeatured,
    total: activeFeatured.length
  });
});

router.get('/hot-ranking', (req, res) => {
  const { type = 'daily', limit = 10 } = req.query;
  const letterData = readJSON('letters.json') || { letters: [] };

  let letters = [...letterData.letters].filter(l => l.isPublic);

  const now = Date.now();
  let timeRange;
  let label;

  switch (type) {
    case 'daily':
      timeRange = now - 24 * 60 * 60 * 1000;
      label = '今日热榜';
      break;
    case 'weekly':
      timeRange = now - 7 * 24 * 60 * 60 * 1000;
      label = '本周热榜';
      break;
    case 'monthly':
      timeRange = now - 30 * 24 * 60 * 60 * 1000;
      label = '本月热榜';
      break;
    default:
      timeRange = 0;
      label = '总热榜';
  }

  if (type !== 'all') {
    letters = letters.filter(l => new Date(l.createdAt).getTime() >= timeRange);
  }

  letters.sort((a, b) => {
    const scoreA = (a.likes || 0) * 3 + ((a.replies ? a.replies.length : 0)) * 2 + (a.views || 0);
    const scoreB = (b.likes || 0) * 3 + ((b.replies ? b.replies.length : 0)) * 2 + (b.views || 0);
    return scoreB - scoreA;
  });

  const ranking = letters.slice(0, parseInt(limit)).map((letter, index) => ({
    rank: index + 1,
    letterId: letter.id,
    title: letter.title,
    senderName: letter.isAnonymous ? '匿名星人' : letter.senderName,
    emotions: letter.emotions,
    likes: letter.likes || 0,
    repliesCount: letter.replies ? letter.replies.length : 0,
    views: letter.views || 0,
    createdAt: letter.createdAt,
    heatScore: (letter.likes || 0) * 3 + ((letter.replies ? letter.replies.length : 0)) * 2 + (letter.views || 0)
  }));

  res.json({
    success: true,
    data: ranking,
    total: letters.length,
    type,
    label
  });
});

router.get('/active-activities', (req, res) => {
  const { limit = 3 } = req.query;
  const activityData = readJSON('activities.json') || { activities: [] };

  const activeActivities = activityData.activities
    .map(enrichActivity)
    .filter(a => a.status === 'active' || a.status === 'voting')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: activeActivities,
    total: activeActivities.length
  });
});

router.get('/overview', (req, res) => {
  const topicData = readJSON('plaza-topics.json') || { topics: [] };
  const letterData = readJSON('letters.json') || { letters: [] };
  const activityData = readJSON('activities.json') || { activities: [] };
  const featuredData = readJSON('plaza-featured.json') || { featured: [] };

  const publicLetters = letterData.letters.filter(l => l.isPublic);
  const topicsWithCount = topicData.topics
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(topic => ({
      ...topic,
      letterCount: countTopicLetters(topic, letterData.letters)
    }));

  const now = new Date();
  const activeFeatured = featuredData.featured
    .filter(f => {
      if (!f.isActive) return false;
      const startTime = new Date(f.startTime);
      const endTime = new Date(f.endTime);
      return now >= startTime && now <= endTime;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 5);

  const activeActivities = activityData.activities
    .map(enrichActivity)
    .filter(a => a.status === 'active' || a.status === 'voting')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const hotLetters = [...publicLetters]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 10)
    .map((l, i) => ({
      rank: i + 1,
      letterId: l.id,
      title: l.title,
      senderName: l.isAnonymous ? '匿名星人' : l.senderName,
      emotions: l.emotions,
      likes: l.likes || 0,
      repliesCount: l.replies ? l.replies.length : 0,
      heatScore: (l.likes || 0) * 3 + ((l.replies ? l.replies.length : 0)) * 2 + (l.views || 0)
    }));

  res.json({
    success: true,
    data: {
      topics: topicsWithCount,
      featured: activeFeatured,
      activities: activeActivities,
      hotRanking: hotLetters,
      stats: {
        totalLetters: publicLetters.length,
        totalTopics: topicsWithCount.length,
        activeActivities: activeActivities.length,
        featuredCount: activeFeatured.length
      }
    }
  });
});

module.exports = router;
