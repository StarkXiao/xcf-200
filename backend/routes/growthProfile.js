const express = require('express');
const router = express.Router();
const { readJSON } = require('../utils/db');

const RECIPIENT_TYPES = [
  { key: 'future', label: '未来', icon: '🔮' },
  { key: 'past', label: '过去', icon: '🕰️' },
  { key: 'parallel', label: '平行世界', icon: '🌌' },
  { key: 'unknown', label: '未知', icon: '✨' },
];

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getHourLabel(hour) {
  if (hour === 0) return '凌晨0点';
  if (hour < 6) return `凌晨${hour}点`;
  if (hour < 12) return `上午${hour}点`;
  if (hour === 12) return '中午12点';
  if (hour < 18) return `下午${hour}点`;
  return `晚上${hour}点`;
}

function getPhaseLabel(letterCount, timeSpanDays) {
  if (letterCount === 0) return { label: '蛰伏期', description: '正在积蓄能量，等待灵感降临' };
  const rate = letterCount / Math.max(timeSpanDays, 1) * 30;
  if (rate >= 8) return { label: '灵感喷涌', description: '创作力爆棚，灵感如星河般奔涌' };
  if (rate >= 4) return { label: '活跃期', description: '笔耕不辍，星际邮路上留下密集足迹' };
  if (rate >= 2) return { label: '稳定期', description: '保持节奏，与星空保持温柔对话' };
  if (rate >= 1) return { label: '沉思期', description: '偶尔执笔，每封信都饱含深意' };
  return { label: '蛰伏期', description: '正在积蓄能量，等待灵感降临' };
}

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const userData = readJSON('users.json') || { users: [] };
  const user = userData.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const letterData = readJSON('letters.json') || { letters: [] };
  const emotionData = readJSON('emotions.json') || { emotions: [] };
  const userLetters = letterData.letters
    .filter(l => l.senderId === userId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (userLetters.length === 0) {
    return res.json({
      success: true,
      data: {
        writingFrequency: {
          monthlyData: [], weeklyData: [], averagePerWeek: 0, averagePerMonth: 0,
          currentStreak: 0, longestStreak: 0, peakMonth: null, totalWritingDays: 0, hourlyDistribution: [],
        },
        emotionProfile: {
          topEmotions: [], emotionTimeline: [], currentDominantEmotion: null,
          emotionBalance: 0, emotionShift: null,
        },
        recipientProfile: { topRecipients: [], typeDistribution: [], recentShift: null },
        stageTrends: { phases: [], currentPhase: null, trendDirection: 'stable', trendDescription: '尚未开始写信' },
        milestones: [],
        joinDate: user.createdAt,
        accountAgeDays: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
      },
    });
  }

  const joinDate = new Date(user.createdAt);
  const accountAgeDays = Math.floor((Date.now() - joinDate.getTime()) / (24 * 60 * 60 * 1000));

  const monthlyMap = {};
  const weeklyMap = {};
  const hourlyMap = {};
  const writingDays = new Set();
  const emotionCounts = {};
  const recipientNameMap = {};
  const recipientTypeMap = {};

  userLetters.forEach(l => {
    const date = new Date(l.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;

    const weekKey = getWeekKey(l.createdAt);
    weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + 1;

    const hour = date.getHours();
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;

    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    writingDays.add(dayKey);

    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    }

    const rKey = `${l.recipientType}:${l.recipient}`;
    if (!recipientNameMap[rKey]) {
      recipientNameMap[rKey] = { name: l.recipient, type: l.recipientType, count: 0, lastWrittenAt: l.createdAt };
    }
    recipientNameMap[rKey].count++;
    if (new Date(l.createdAt) > new Date(recipientNameMap[rKey].lastWrittenAt)) {
      recipientNameMap[rKey].lastWrittenAt = l.createdAt;
    }

    recipientTypeMap[l.recipientType] = (recipientTypeMap[l.recipientType] || 0) + 1;
  });

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const weeklyData = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: getHourLabel(h),
    count: hourlyMap[h] || 0,
  }));

  const totalWeeks = Math.max(Math.ceil(accountAgeDays / 7), 1);
  const totalMonths = Math.max(Math.ceil(accountAgeDays / 30), 1);
  const averagePerWeek = Math.round((userLetters.length / totalWeeks) * 10) / 10;
  const averagePerMonth = Math.round((userLetters.length / totalMonths) * 10) / 10;

  let peakMonth = null;
  let peakCount = 0;
  monthlyData.forEach(m => {
    if (m.count > peakCount) {
      peakCount = m.count;
      peakMonth = { month: m.month, count: m.count };
    }
  });

  const sortedDays = Array.from(writingDays).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (writingDays.has(todayKey)) {
    currentStreak = 1;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (writingDays.has(checkKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const writingFrequency = {
    monthlyData,
    weeklyData,
    averagePerWeek,
    averagePerMonth,
    currentStreak,
    longestStreak,
    peakMonth,
    totalWritingDays: writingDays.size,
    hourlyDistribution,
  };

  const topEmotions = Object.entries(emotionCounts)
    .map(([name, count]) => {
      const info = emotionData.emotions.find(e => e.name === name);
      return {
        name,
        color: info?.color || '#888',
        icon: info?.icon || '✨',
        count,
        percentage: Math.round((count / userLetters.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const halfPoint = Math.floor(userLetters.length / 2);
  const firstHalfEmotions = {};
  const secondHalfEmotions = {};
  userLetters.forEach((l, idx) => {
    const target = idx < halfPoint ? firstHalfEmotions : secondHalfEmotions;
    if (l.emotions) {
      l.emotions.forEach(e => {
        target[e] = (target[e] || 0) + 1;
      });
    }
  });

  const getTopFrom = (map) => Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  const firstTop = getTopFrom(firstHalfEmotions);
  const secondTop = getTopFrom(secondHalfEmotions);

  let emotionShift = null;
  if (firstTop && secondTop && firstTop[0] !== secondTop[0]) {
    const fromInfo = emotionData.emotions.find(e => e.name === firstTop[0]);
    const toInfo = emotionData.emotions.find(e => e.name === secondTop[0]);
    emotionShift = {
      from: firstTop[0],
      to: secondTop[0],
      fromIcon: fromInfo?.icon || '✨',
      toIcon: toInfo?.icon || '✨',
      description: `你的情绪重心从「${firstTop[0]}」转向了「${secondTop[0]}」`,
    };
  }

  const recentMonthCount = Math.min(3, monthlyData.length);
  const recentEmotionMap = {};
  const recentLetters = userLetters.slice(-Math.max(halfPoint, 5));
  recentLetters.forEach(l => {
    if (l.emotions) {
      l.emotions.forEach(e => {
        recentEmotionMap[e] = (recentEmotionMap[e] || 0) + 1;
      });
    }
  });
  const recentTopEntry = Object.entries(recentEmotionMap).sort((a, b) => b[1] - a[1])[0];
  const recentTopInfo = recentTopEntry ? emotionData.emotions.find(e => e.name === recentTopEntry[0]) : null;

  const currentDominantEmotion = recentTopEntry
    ? { name: recentTopEntry[0], color: recentTopInfo?.color || '#888', icon: recentTopInfo?.icon || '✨', percentage: Math.round((recentTopEntry[1] / recentLetters.length) * 100) }
    : null;

  const positiveEmotions = ['希望', '勇气', '爱情', '治愈', '温暖', '幸福', '梦想', '好奇'];
  const negativeEmotions = ['遗憾', '孤独', '告别', '思念', '怀念'];
  let posCount = 0;
  let negCount = 0;
  Object.entries(emotionCounts).forEach(([name, count]) => {
    if (positiveEmotions.includes(name)) posCount += count;
    if (negativeEmotions.includes(name)) negCount += count;
  });
  const totalEmotionMentions = posCount + negCount;
  const emotionBalance = totalEmotionMentions > 0 ? Math.round((posCount / totalEmotionMentions) * 100) : 50;

  const emotionTimelineMap = {};
  userLetters.forEach(l => {
    const date = new Date(l.createdAt);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!emotionTimelineMap[periodKey]) {
      emotionTimelineMap[periodKey] = { period: periodKey, label: periodKey, emotions: {} };
    }
    if (l.emotions) {
      l.emotions.forEach(e => {
        emotionTimelineMap[periodKey].emotions[e] = (emotionTimelineMap[periodKey].emotions[e] || 0) + 1;
      });
    }
  });

  const emotionTimeline = Object.values(emotionTimelineMap)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(p => ({
      period: p.period,
      label: p.period,
      emotions: Object.entries(p.emotions)
        .map(([name, count]) => {
          const info = emotionData.emotions.find(e => e.name === name);
          return { name, color: info?.color || '#888', icon: info?.icon || '✨', count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }));

  const emotionProfile = {
    topEmotions,
    emotionTimeline,
    currentDominantEmotion,
    emotionBalance,
    emotionShift,
  };

  const topRecipients = Object.values(recipientNameMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(r => {
      const typeInfo = RECIPIENT_TYPES.find(t => t.key === r.type) || RECIPIENT_TYPES[3];
      return {
        name: r.name,
        type: r.type,
        typeLabel: typeInfo.label,
        typeIcon: typeInfo.icon,
        count: r.count,
        percentage: Math.round((r.count / userLetters.length) * 100),
        lastWrittenAt: r.lastWrittenAt,
      };
    });

  const typeDistribution = RECIPIENT_TYPES.map(t => ({
    ...t,
    count: recipientTypeMap[t.key] || 0,
    percentage: Math.round(((recipientTypeMap[t.key] || 0) / userLetters.length) * 100),
  })).sort((a, b) => b.count - a.count);

  const last5 = userLetters.slice(-5);
  const last5Types = {};
  last5.forEach(l => {
    last5Types[l.recipientType] = (last5Types[l.recipientType] || 0) + 1;
  });
  const recentTopType = Object.entries(last5Types).sort((a, b) => b[1] - a[1])[0];
  const overallTopType = Object.entries(recipientTypeMap).sort((a, b) => b[1] - a[1])[0];
  let recentShift = null;
  if (recentTopType && overallTopType && recentTopType[0] !== overallTopType[0]) {
    const recentInfo = RECIPIENT_TYPES.find(t => t.key === recentTopType[0]);
    const overallInfo = RECIPIENT_TYPES.find(t => t.key === overallTopType[0]);
    recentShift = `最近开始更多写信给「${recentInfo?.label || recentTopType[0]}」，而之前偏好「${overallInfo?.label || overallTopType[0]}」`;
  }

  const recipientProfile = { topRecipients, typeDistribution, recentShift };

  const phaseSize = Math.max(Math.ceil(userLetters.length / 3), 1);
  const phases = [];
  for (let i = 0; i < userLetters.length; i += phaseSize) {
    const phaseLetters = userLetters.slice(i, i + phaseSize);
    const startDate = phaseLetters[0].createdAt;
    const endDate = phaseLetters[phaseLetters.length - 1].createdAt;
    const spanDays = Math.max(Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)), 1);

    const phaseEmoMap = {};
    const phaseTypeMap = {};
    phaseLetters.forEach(l => {
      if (l.emotions) l.emotions.forEach(e => { phaseEmoMap[e] = (phaseEmoMap[e] || 0) + 1; });
      phaseTypeMap[l.recipientType] = (phaseTypeMap[l.recipientType] || 0) + 1;
    });

    const domEmo = Object.entries(phaseEmoMap).sort((a, b) => b[1] - a[1])[0];
    const domType = Object.entries(phaseTypeMap).sort((a, b) => b[1] - a[1])[0];
    const domEmoInfo = domEmo ? emotionData.emotions.find(e => e.name === domEmo[0]) : null;
    const domTypeInfo = RECIPIENT_TYPES.find(t => t.key === (domType ? domType[0] : '')) || RECIPIENT_TYPES[3];

    const phaseLabel = getPhaseLabel(phaseLetters.length, spanDays);

    phases.push({
      period: `${startDate.substring(0, 10)} ~ ${endDate.substring(0, 10)}`,
      label: phaseLabel.label,
      description: phaseLabel.description,
      letterCount: phaseLetters.length,
      dominantEmotion: domEmo ? domEmo[0] : '未知',
      dominantEmotionIcon: domEmoInfo?.icon || '✨',
      dominantRecipientType: domTypeInfo.label,
      startDate,
      endDate,
    });
  }

  let currentPhase = null;
  if (phases.length > 0) {
    const last = phases[phases.length - 1];
    currentPhase = { label: last.label, description: last.description, since: last.startDate };
  }

  const lastMonth = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 1] : null;
  const prevMonth = monthlyData.length >= 2 ? monthlyData[monthlyData.length - 2] : null;
  let trendDirection = 'stable';
  let trendDescription = '写作节奏保持稳定';
  if (lastMonth && prevMonth) {
    const diff = lastMonth.count - prevMonth.count;
    if (diff > 1) {
      trendDirection = 'rising';
      trendDescription = `写信频率上升中，比上月多了 ${diff} 封`;
    } else if (diff < -1) {
      trendDirection = 'declining';
      trendDescription = `写信频率有所下降，比上月少了 ${Math.abs(diff)} 封`;
    }
  }

  const stageTrends = { phases, currentPhase, trendDirection, trendDescription };

  const milestones = [];
  if (userLetters.length >= 1) {
    milestones.push({ date: userLetters[0].createdAt, type: 'first_letter', description: '寄出了第一封信', icon: '✉️' });
  }
  if (userLetters.length >= 5) {
    const l5 = userLetters[4];
    milestones.push({ date: l5.createdAt, type: '5_letters', description: '累计寄出5封信件', icon: '🌟' });
  }
  if (userLetters.length >= 10) {
    const l10 = userLetters[9];
    milestones.push({ date: l10.createdAt, type: '10_letters', description: '累计寄出10封信件', icon: '💫' });
  }
  if (userLetters.length >= 50) {
    const l50 = userLetters[49];
    milestones.push({ date: l50.createdAt, type: '50_letters', description: '累计寄出50封信件，星际资深写手', icon: '🏆' });
  }
  if (longestStreak >= 3) {
    milestones.push({ date: userLetters[0].createdAt, type: 'streak', description: `最长连续写作 ${longestStreak} 天`, icon: '🔥' });
  }
  const totalLikes = userLetters.reduce((sum, l) => sum + (l.likes || 0), 0);
  if (totalLikes >= 50) {
    milestones.push({ date: new Date().toISOString(), type: 'likes', description: `累计获得 ${totalLikes} 颗星星`, icon: '⭐' });
  }
  const totalReplies = userLetters.reduce((sum, l) => sum + (l.replies ? l.replies.length : 0), 0);
  if (totalReplies >= 20) {
    milestones.push({ date: new Date().toISOString(), type: 'replies', description: `累计收到 ${totalReplies} 封回信`, icon: '💌' });
  }

  res.json({
    success: true,
    data: {
      writingFrequency,
      emotionProfile,
      recipientProfile,
      stageTrends,
      milestones,
      joinDate: user.createdAt,
      accountAgeDays,
    },
  });
});

module.exports = router;
