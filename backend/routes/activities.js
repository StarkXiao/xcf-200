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

router.get('/', (req, res) => {
  const { page = 1, limit = 10, status, sort = 'latest' } = req.query;
  const activityData = readJSON('activities.json') || { activities: [] };

  let activities = [...activityData.activities];

  if (status) {
    activities = activities.filter(a => {
      const enriched = getActivityStatus(a);
      return enriched.status === status;
    });
  }

  if (sort === 'latest') {
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'popular') {
    activities.sort((a, b) => b.participantCount - a.participantCount);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = activities.slice(start, start + limitNum);

  const enrichedActivities = paginated.map(enrichActivity);

  res.json({
    success: true,
    data: enrichedActivities,
    total: activities.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(activities.length / limitNum)
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const activityData = readJSON('activities.json') || { activities: [] };
  const activity = activityData.activities.find(a => a.id === id);

  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  res.json({
    success: true,
    data: enrichActivity(activity)
  });
});

router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  const activityData = readJSON('activities.json') || { activities: [] };
  const workData = readJSON('works.json') || { works: [] };
  const registrationData = readJSON('registrations.json') || { registrations: [] };
  const likeData = readJSON('work-likes.json') || { workLikes: [] };

  const activity = activityData.activities.find(a => a.id === id);
  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const activityWorks = workData.works.filter(w => w.activityId === id && w.status === 'published');
  const activityRegistrations = registrationData.registrations.filter(r => r.activityId === id && r.status === 'approved');
  const activityLikes = likeData.workLikes.filter(l => {
    return activityWorks.some(w => w.id === l.workId);
  });

  const topWorks = [...activityWorks]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);

  const result = {
    totalParticipants: activityRegistrations.length,
    totalWorks: activityWorks.length,
    totalLikes: activityLikes.length,
    topWorks
  };

  if (userId) {
    result.myWorks = workData.works.filter(w => w.activityId === id && w.userId === userId);
    result.myRegistration = registrationData.registrations.find(r => r.activityId === id && r.userId === userId);
  }

  res.json({
    success: true,
    data: result
  });
});

router.post('/:id/register', (req, res) => {
  const { id } = req.params;
  const { userId, username, userAvatar, applyReason } = req.body;

  if (!userId || !applyReason) {
    return res.status(400).json({ success: false, message: '请填写必要信息' });
  }

  const activityData = readJSON('activities.json') || { activities: [] };
  const activity = activityData.activities.find(a => a.id === id);

  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const { status } = getActivityStatus(activity);
  if (status === 'upcoming') {
    return res.status(400).json({ success: false, message: '活动报名尚未开始' });
  }
  if (status === 'voting' || status === 'settled') {
    return res.status(400).json({ success: false, message: '活动报名已结束' });
  }

  const registrationData = readJSON('registrations.json') || { registrations: [] };
  const existingRegistration = registrationData.registrations.find(r => r.activityId === id && r.userId === userId);

  if (existingRegistration) {
    return res.status(400).json({ success: false, message: '你已经报名过此活动' });
  }

  const newRegistration = {
    id: generateId(),
    activityId: id,
    userId,
    username: username || '匿名星人',
    userAvatar: userAvatar || '⭐',
    status: 'pending',
    applyReason,
    submittedWorks: 0,
    createdAt: new Date().toISOString()
  };

  registrationData.registrations.unshift(newRegistration);
  writeJSON('registrations.json', registrationData);

  activity.participantCount = (activity.participantCount || 0) + 1;
  writeJSON('activities.json', activityData);

  res.json({
    success: true,
    message: '报名申请已提交，等待审核 ✨',
    data: newRegistration
  });
});

router.get('/:id/registrations', (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  const registrationData = readJSON('registrations.json') || { registrations: [] };
  let registrations = registrationData.registrations.filter(r => r.activityId === id);

  if (status) {
    registrations = registrations.filter(r => r.status === status);
  }

  registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = registrations.slice(start, start + limitNum);

  res.json({
    success: true,
    data: paginated,
    total: registrations.length,
    page: pageNum,
    limit: limitNum
  });
});

router.post('/:id/registrations/:registrationId/review', (req, res) => {
  const { id, registrationId } = req.params;
  const { status, reviewComment, reviewer } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: '无效的审核状态' });
  }

  const registrationData = readJSON('registrations.json') || { registrations: [] };
  const registration = registrationData.registrations.find(r => r.id === registrationId && r.activityId === id);

  if (!registration) {
    return res.status(404).json({ success: false, message: '报名记录不存在' });
  }

  if (registration.status !== 'pending') {
    return res.status(400).json({ success: false, message: '该报名已处理过' });
  }

  registration.status = status;
  registration.reviewer = reviewer || 'system';
  registration.reviewComment = reviewComment || (status === 'approved' ? '报名已通过，期待你的作品！' : '很抱歉，你的报名未通过审核');
  registration.reviewedAt = new Date().toISOString();

  writeJSON('registrations.json', registrationData);

  res.json({
    success: true,
    message: status === 'approved' ? '已通过审核' : '已拒绝申请',
    data: registration
  });
});

router.post('/:id/works', (req, res) => {
  const { id } = req.params;
  const { userId, username, userAvatar, title, content, emotions, isAnonymous } = req.body;

  if (!userId || !title || !content) {
    return res.status(400).json({ success: false, message: '请填写必要信息' });
  }

  const activityData = readJSON('activities.json') || { activities: [] };
  const activity = activityData.activities.find(a => a.id === id);

  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const { stage } = getActivityStatus(activity);
  if (stage !== 'submission' && stage !== 'registration') {
    return res.status(400).json({ success: false, message: '当前不在作品提交阶段' });
  }

  const registrationData = readJSON('registrations.json') || { registrations: [] };
  const registration = registrationData.registrations.find(r => r.activityId === id && r.userId === userId);

  if (!registration || registration.status !== 'approved') {
    return res.status(400).json({ success: false, message: '请先通过活动报名审核' });
  }

  const workData = readJSON('works.json') || { works: [] };
  const userWorks = workData.works.filter(w => w.activityId === id && w.userId === userId);

  const maxWorks = 3;
  if (userWorks.length >= maxWorks) {
    return res.status(400).json({ success: false, message: `每位参赛者最多提交${maxWorks}篇作品` });
  }

  const newWork = {
    id: generateId(),
    activityId: id,
    registrationId: registration.id,
    userId,
    username: username || '匿名星人',
    userAvatar: userAvatar || '⭐',
    title,
    content,
    emotions: emotions || [],
    wordCount: content.replace(/\s/g, '').length,
    status: 'published',
    likes: 0,
    views: 0,
    rank: null,
    isAnonymous: isAnonymous || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  };

  workData.works.unshift(newWork);
  writeJSON('works.json', workData);

  registration.submittedWorks = (registration.submittedWorks || 0) + 1;
  writeJSON('registrations.json', registrationData);

  activity.workCount = (activity.workCount || 0) + 1;
  writeJSON('activities.json', activityData);

  res.json({
    success: true,
    message: '作品提交成功！✨',
    data: newWork
  });
});

router.get('/:id/works', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sort = 'latest', userId } = req.query;

  const workData = readJSON('works.json') || { works: [] };
  let works = workData.works.filter(w => w.activityId === id && w.status === 'published');

  if (userId) {
    works = workData.works.filter(w => w.activityId === id && w.userId === userId);
  }

  if (sort === 'latest') {
    works.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  } else if (sort === 'popular') {
    works.sort((a, b) => b.likes - a.likes);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = works.slice(start, start + limitNum);

  const displayWorks = paginated.map(w => ({
    ...w,
    username: w.isAnonymous ? '匿名创作者' : w.username,
    userAvatar: w.isAnonymous ? '🎭' : w.userAvatar,
    content: w.content.substring(0, 150) + (w.content.length > 150 ? '...' : '')
  }));

  res.json({
    success: true,
    data: displayWorks,
    total: works.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(works.length / limitNum)
  });
});

router.get('/:id/works/:workId', (req, res) => {
  const { id, workId } = req.params;

  const workData = readJSON('works.json') || { works: [] };
  const work = workData.works.find(w => w.id === workId && w.activityId === id);

  if (!work) {
    return res.status(404).json({ success: false, message: '作品不存在' });
  }

  if (work.status !== 'published') {
    return res.status(403).json({ success: false, message: '作品暂未公开' });
  }

  work.views = (work.views || 0) + 1;
  writeJSON('works.json', workData);

  const displayWork = {
    ...work,
    username: work.isAnonymous ? '匿名创作者' : work.username,
    userAvatar: work.isAnonymous ? '🎭' : work.userAvatar
  };

  res.json({
    success: true,
    data: displayWork
  });
});

router.post('/:id/works/:workId/like', (req, res) => {
  const { id, workId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '请先登录' });
  }

  const workData = readJSON('works.json') || { works: [] };
  const work = workData.works.find(w => w.id === workId && w.activityId === id);

  if (!work) {
    return res.status(404).json({ success: false, message: '作品不存在' });
  }

  const likeData = readJSON('work-likes.json') || { workLikes: [] };
  const existingLike = likeData.workLikes.find(l => l.workId === workId && l.userId === userId);

  if (existingLike) {
    return res.status(400).json({ success: false, message: '你已经为这篇作品送过小星星了' });
  }

  const newLike = {
    id: generateId(),
    workId,
    userId,
    createdAt: new Date().toISOString()
  };

  likeData.workLikes.push(newLike);
  writeJSON('work-likes.json', likeData);

  work.likes = (work.likes || 0) + 1;
  writeJSON('works.json', workData);

  const activityData = readJSON('activities.json') || { activities: [] };
  const activity = activityData.activities.find(a => a.id === id);
  if (activity) {
    activity.totalLikes = (activity.totalLikes || 0) + 1;
    writeJSON('activities.json', activityData);
  }

  res.json({
    success: true,
    likes: work.likes,
    message: '已送上一颗小星星 ✨'
  });
});

router.delete('/:id/works/:workId/like', (req, res) => {
  const { id, workId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '请先登录' });
  }

  const likeData = readJSON('work-likes.json') || { workLikes: [] };
  const likeIndex = likeData.workLikes.findIndex(l => l.workId === workId && l.userId === userId);

  if (likeIndex === -1) {
    return res.status(400).json({ success: false, message: '你还没有为这篇作品点赞' });
  }

  likeData.workLikes.splice(likeIndex, 1);
  writeJSON('work-likes.json', likeData);

  const workData = readJSON('works.json') || { works: [] };
  const work = workData.works.find(w => w.id === workId && w.activityId === id);
  if (work) {
    work.likes = Math.max(0, (work.likes || 0) - 1);
    writeJSON('works.json', workData);
  }

  res.json({
    success: true,
    likes: work ? work.likes : 0,
    message: '已取消点赞'
  });
});

router.get('/:id/works/:workId/like-status', (req, res) => {
  const { id, workId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.json({ success: true, data: { liked: false, likes: 0 } });
  }

  const likeData = readJSON('work-likes.json') || { workLikes: [] };
  const workData = readJSON('works.json') || { works: [] };

  const liked = likeData.workLikes.some(l => l.workId === workId && l.userId === userId);
  const work = workData.works.find(w => w.id === workId);

  res.json({
    success: true,
    data: {
      liked,
      likes: work ? work.likes : 0
    }
  });
});

router.get('/:id/ranking', (req, res) => {
  const { id } = req.params;
  const { limit = 100 } = req.query;

  const workData = readJSON('works.json') || { works: [] };
  let works = workData.works.filter(w => w.activityId === id && w.status === 'published');

  works.sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const ranking = works.map((work, index) => ({
    rank: index + 1,
    workId: work.id,
    title: work.title,
    username: work.isAnonymous ? '匿名创作者' : work.username,
    userAvatar: work.isAnonymous ? '🎭' : work.userAvatar,
    likes: work.likes,
    views: work.views,
    isAnonymous: work.isAnonymous
  })).slice(0, parseInt(limit));

  works.forEach((work, index) => {
    work.rank = index + 1;
  });
  writeJSON('works.json', workData);

  res.json({
    success: true,
    data: ranking,
    total: works.length
  });
});

router.post('/:id/settle', (req, res) => {
  const { id } = req.params;

  const activityData = readJSON('activities.json') || { activities: [] };
  const activity = activityData.activities.find(a => a.id === id);

  if (!activity) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  const { status } = getActivityStatus(activity);
  if (status !== 'settled') {
    return res.status(400).json({ success: false, message: '活动尚未结束，无法结算' });
  }

  const workData = readJSON('works.json') || { works: [] };
  const registrationData = readJSON('registrations.json') || { registrations: [] };
  const honorData = readJSON('honors.json') || { honors: [] };
  const userData = readJSON('users.json') || { users: [] };

  let works = workData.works.filter(w => w.activityId === id && w.status === 'published');
  works.sort((a, b) => b.likes - a.likes);

  const newHonors = [];

  works.forEach((work, index) => {
    const rank = index + 1;
    let prize = null;

    for (const p of activity.prizes) {
      if (rank <= p.rank) {
        prize = p;
        break;
      }
    }

    if (prize) {
      const honor = {
        id: generateId(),
        userId: work.userId,
        activityId: id,
        activityTitle: activity.title,
        honorTitle: prize.honor,
        rank,
        rankTitle: prize.title,
        workId: work.id,
        workTitle: work.title,
        description: `在"${activity.title}"中获得第${rank}名`,
        badge: rank === 1 ? '🏆' : rank <= 3 ? '🥇' : '⭐',
        awardedAt: new Date().toISOString()
      };

      const existingHonor = honorData.honors.find(h => h.activityId === id && h.userId === work.userId && h.rank === rank);
      if (!existingHonor) {
        newHonors.push(honor);
        honorData.honors.unshift(honor);
      }
    }

    work.rank = rank;
  });

  const approvedRegistrations = registrationData.registrations.filter(r => r.activityId === id && r.status === 'approved');
  approvedRegistrations.forEach(reg => {
    const hasHonor = newHonors.some(h => h.userId === reg.userId) ||
      honorData.honors.some(h => h.activityId === id && h.userId === reg.userId);

    if (!hasHonor) {
      const participationHonor = {
        id: generateId(),
        userId: reg.userId,
        activityId: id,
        activityTitle: activity.title,
        honorTitle: '参与奖',
        rank: null,
        rankTitle: '参赛纪念',
        workId: null,
        workTitle: null,
        description: `参与"${activity.title}"活动`,
        badge: '🎖️',
        awardedAt: new Date().toISOString()
      };

      newHonors.push(participationHonor);
      honorData.honors.unshift(participationHonor);
    }
  });

  writeJSON('honors.json', honorData);
  writeJSON('works.json', workData);

  res.json({
    success: true,
    message: `活动结算完成，共生成${newHonors.length}个荣誉`,
    data: {
      totalWorks: works.length,
      honorsGenerated: newHonors.length,
      top3: works.slice(0, 3).map((w, i) => ({
        rank: i + 1,
        workId: w.id,
        title: w.title,
        username: w.isAnonymous ? '匿名创作者' : w.username,
        likes: w.likes
      }))
    }
  });
});

router.get('/user/:userId/registrations', (req, res) => {
  const { userId } = req.params;
  const { status, activityId } = req.query;

  const registrationData = readJSON('registrations.json') || { registrations: [] };
  let registrations = registrationData.registrations.filter(r => r.userId === userId);

  if (status) {
    registrations = registrations.filter(r => r.status === status);
  }

  if (activityId) {
    registrations = registrations.filter(r => r.activityId === activityId);
  }

  registrations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: registrations,
    total: registrations.length
  });
});

router.get('/user/:userId/works', (req, res) => {
  const { userId } = req.params;
  const { activityId, status } = req.query;

  const workData = readJSON('works.json') || { works: [] };
  let works = workData.works.filter(w => w.userId === userId);

  if (activityId) {
    works = works.filter(w => w.activityId === activityId);
  }

  if (status) {
    works = works.filter(w => w.status === status);
  }

  works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: works,
    total: works.length
  });
});

router.get('/user/:userId/honors', (req, res) => {
  const { userId } = req.params;

  const honorData = readJSON('honors.json') || { honors: [] };
  const honors = honorData.honors.filter(h => h.userId === userId);

  honors.sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));

  res.json({
    success: true,
    data: honors,
    total: honors.length
  });
});

module.exports = router;
