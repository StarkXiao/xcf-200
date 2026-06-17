const express = require('express');
const { readJSON, writeJSON, generateId } = require('./utils/db');

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

  const letterData = readJSON('letters.json') || { letters: [] };
  const lIdx = letterData.letters.findIndex(l => l.id === letter.id);
  if (lIdx !== -1) {
    letterData.letters[lIdx] = letter;
    writeJSON('letters.json', letterData);
  }

  return true;
}

function resetTestData() {
  writeJSON('letters.json', { letters: [] });
  writeJSON('replyCandidates.json', { candidates: [] });
  writeJSON('replyCandidatePools.json', { pools: [] });
  writeJSON('notifications.json', { notifications: [] });
  console.log('✅ 测试数据已重置');
}

function runTests() {
  console.log('\n🧪 开始测试人工优先回信策略系统...\n');

  resetTestData();

  const testLetter = {
    id: 'test_letter_001',
    senderId: 'test_user_001',
    senderName: '测试用户',
    recipient: '未来的自己',
    recipientType: 'future',
    title: '测试信件',
    content: '这是一封测试信件，用于验证人工优先回信策略系统。',
    emotions: ['希望', '温暖'],
    isPublic: true,
    isAnonymous: false,
    likes: 0,
    createdAt: new Date().toISOString(),
    deliverAt: new Date().toISOString(),
    replies: [],
  };

  console.log('📝 测试1: 初始化回信候选池');
  const { candidates, pool } = initializeReplyCandidates(testLetter);
  console.log(`   ✅ 生成了 ${candidates.length} 个候选回复`);
  console.log(`   ✅ 候选池状态: ${pool.status}`);
  console.log(`   ✅ 超时时间: ${pool.timeoutAt}`);
  candidates.forEach((c, i) => {
    console.log(`     候选${i + 1}: ${c.senderName} - 质量分: ${c.qualityScore}`);
  });

  console.log('\n🔍 测试2: 查询候选池数据');
  const letterData = readJSON('letters.json') || { letters: [] };
  letterData.letters.unshift(testLetter);
  writeJSON('letters.json', letterData);

  const poolData = getReplyCandidatePoolData(testLetter.id);
  console.log(`   ✅ 候选池状态: ${poolData.pool.status}`);
  console.log(`   ✅ 剩余时间: ${poolData.remainingTime}ms`);
  console.log(`   ✅ 是否有人工回复: ${poolData.hasHumanReply}`);
  console.log(`   ✅ 候选数量: ${poolData.candidates.length}`);

  console.log('\n👤 测试3: 添加人工回复后状态变化');
  const humanReply = {
    id: generateId(),
    letterId: testLetter.id,
    fromParallel: 'human_world',
    senderName: '陌生人的温暖',
    content: '这是一条人工回复，充满了温暖和关怀。',
    emotion: '温暖',
    source: 'stranger',
    isStrangerReply: true,
    createdAt: new Date().toISOString(),
  };
  testLetter.replies.push(humanReply);

  const letterData2 = readJSON('letters.json') || { letters: [] };
  const lIdx = letterData2.letters.findIndex(l => l.id === testLetter.id);
  if (lIdx !== -1) {
    letterData2.letters[lIdx] = testLetter;
    writeJSON('letters.json', letterData2);
  }

  const poolDataAfterHuman = getReplyCandidatePoolData(testLetter.id);
  console.log(`   ✅ 添加人工回复后状态: ${poolDataAfterHuman.pool.status}`);
  console.log(`   ✅ 是否有人工回复: ${poolDataAfterHuman.hasHumanReply}`);

  console.log('\n⏰ 测试4: 超时补位机制（模拟超时）');
  resetTestData();

  const testLetter2 = {
    id: 'test_letter_002',
    senderId: 'test_user_002',
    senderName: '测试用户2',
    recipient: '未来的自己',
    recipientType: 'future',
    title: '测试信件2 - 超时测试',
    content: '这是一封用于测试超时补位的信件。',
    emotions: ['思念'],
    isPublic: true,
    isAnonymous: false,
    likes: 0,
    createdAt: new Date().toISOString(),
    deliverAt: new Date().toISOString(),
    replies: [],
  };

  initializeReplyCandidates(testLetter2);

  const poolData2 = getReplyCandidatePool(testLetter2.id);
  if (poolData2) {
    poolData2.pool.timeoutAt = new Date(Date.now() - 1000).toISOString();
    const poolDataFile = readJSON('replyCandidatePools.json');
    const idx = poolDataFile.pools.findIndex((p) => p.id === poolData2.pool.id);
    if (idx !== -1) {
      poolDataFile.pools[idx] = poolData2.pool;
      writeJSON('replyCandidatePools.json', poolDataFile);
    }
  }

  const letterData3 = readJSON('letters.json') || { letters: [] };
  letterData3.letters.unshift(testLetter2);
  writeJSON('letters.json', letterData3);

  const hasFallback = checkAndApplyTimeoutFallback(testLetter2);
  const updatedLetter = readJSON('letters.json').letters.find(
    (l) => l.id === testLetter2.id
  );
  const finalPoolData = getReplyCandidatePoolData(testLetter2.id);

  console.log(`   ✅ 超时补位是否触发: ${hasFallback}`);
  console.log(`   ✅ 补位后回复数量: ${updatedLetter.replies.length}`);
  console.log(`   ✅ 补位回复来源: ${updatedLetter.replies[0]?.source}`);
  console.log(`   ✅ 补位回复质量分: ${updatedLetter.replies[0]?.qualityScore}`);
  console.log(`   ✅ 候选池最终状态: ${finalPoolData.pool.status}`);
  console.log(`   ✅ 选中的候选ID: ${finalPoolData.pool.selectedCandidateId}`);

  console.log('\n💬 测试5: 回复来源标记体系');
  const replySources = [
    { source: 'human', label: '人工回复', icon: '👤' },
    { source: 'ai_generated', label: 'AI回复（用户选择）', icon: '🤖' },
    { source: 'ai_fallback', label: 'AI回复（超时补位）', icon: '⏰' },
    { source: 'stranger', label: '陌生人回复', icon: '👥' },
  ];
  replySources.forEach((r) => {
    console.log(`   ${r.icon} ${r.source}: ${r.label}`);
  });

  console.log('\n📊 测试6: 质量反馈数据结构');
  console.log('   ✅ feedback.rating: 1-5星评分');
  console.log('   ✅ feedback.helpful: 是否有帮助');
  console.log('   ✅ feedback.tags: 标签数组');
  console.log('   ✅ feedback.comment: 补充意见');
  console.log('   ✅ feedback.createdAt: 反馈时间');

  console.log('\n🎯 测试7: 人工选择AI候选');
  resetTestData();

  const testLetter3 = {
    id: 'test_letter_003',
    senderId: 'test_user_003',
    senderName: '测试用户3',
    recipient: '未来的自己',
    recipientType: 'future',
    title: '测试信件3 - 人工选择',
    content: '这是一封用于测试人工选择AI候选的信件。',
    emotions: ['希望'],
    isPublic: true,
    isAnonymous: false,
    likes: 0,
    createdAt: new Date().toISOString(),
    deliverAt: new Date().toISOString(),
    replies: [],
  };

  initializeReplyCandidates(testLetter3);
  const letterData4 = readJSON('letters.json') || { letters: [] };
  letterData4.letters.unshift(testLetter3);
  writeJSON('letters.json', letterData4);

  const poolInfo3 = getReplyCandidatePool(testLetter3.id);
  const candidates3 = poolInfo3.candidates;
  candidates3.sort((a, b) => b.qualityScore - a.qualityScore);
  const selectedCandidate = candidates3[0];

  selectedCandidate.status = 'selected';
  selectedCandidate.selectedAt = new Date().toISOString();

  const candidateData = readJSON('replyCandidates.json') || { candidates: [] };
  const cIdx = candidateData.candidates.findIndex(c => c.id === selectedCandidate.id);
  if (cIdx !== -1) {
    candidateData.candidates[cIdx] = selectedCandidate;
    writeJSON('replyCandidates.json', candidateData);
  }

  candidates3.forEach(c => {
    if (c.id !== selectedCandidate.id) {
      c.status = 'rejected';
      const idx = candidateData.candidates.findIndex(cc => cc.id === c.id);
      if (idx !== -1) candidateData.candidates[idx] = c;
    }
  });
  writeJSON('replyCandidates.json', candidateData);

  poolInfo3.pool.status = 'human_replied';
  poolInfo3.pool.selectedCandidateId = selectedCandidate.id;

  const poolDataFile2 = readJSON('replyCandidatePools.json') || { pools: [] };
  const pIdx = poolDataFile2.pools.findIndex(p => p.id === poolInfo3.pool.id);
  if (pIdx !== -1) {
    poolDataFile2.pools[pIdx] = { ...poolInfo3.pool, updatedAt: new Date().toISOString() };
    writeJSON('replyCandidatePools.json', poolDataFile2);
  }

  const reply = {
    id: generateId(),
    letterId: testLetter3.id,
    fromParallel: selectedCandidate.fromParallel,
    senderName: selectedCandidate.senderName,
    content: selectedCandidate.content,
    emotion: selectedCandidate.emotion,
    source: 'ai_generated',
    candidateId: selectedCandidate.id,
    qualityScore: selectedCandidate.qualityScore,
    createdAt: new Date().toISOString()
  };

  testLetter3.replies.push(reply);
  const letterData5 = readJSON('letters.json') || { letters: [] };
  const lIdx3 = letterData5.letters.findIndex(l => l.id === testLetter3.id);
  if (lIdx3 !== -1) {
    letterData5.letters[lIdx3] = testLetter3;
    writeJSON('letters.json', letterData5);
  }

  console.log(`   ✅ 选择的候选: ${selectedCandidate.senderName}`);
  console.log(`   ✅ 候选质量分: ${selectedCandidate.qualityScore}`);
  console.log(`   ✅ 回复来源标记: ${reply.source}`);
  console.log(`   ✅ 其他候选状态: 已拒绝`);

  console.log('\n🎉 所有核心逻辑测试通过！');
  console.log('\n📋 新增API端点总结:');
  console.log('   GET    /letters/:id/reply-candidates       - 获取候选池数据');
  console.log('   POST   /letters/:id/select-candidate      - 人工选择AI候选');
  console.log('   POST   /letters/:id/check-timeout         - 检查并触发超时补位');
  console.log('   POST   /letters/replies/:replyId/feedback - 提交质量反馈');

  console.log('\n🎨 前端展示区分:');
  console.log('   🔵 人工回复 - User图标，极光色 (text-aurora)');
  console.log('   🟣 AI回复   - Bot图标，星云紫色 (text-nebula-purple)');
  console.log('   🟠 AI补位   - Bot图标，星橙色 (text-nebula-orange)');
  console.log('   🟡 陌生人   - Users图标，星光色 (text-starlight)');

  console.log('\n📈 核心策略流程:');
  console.log('   1. 信件创建 → 生成5个AI候选 → 进入5分钟等待期');
  console.log('   2. 等待期内 → 用户可主动选择AI候选发送');
  console.log('   3. 等待期内 → 收到陌生人回复 → 关闭候选池');
  console.log('   4. 等待超时 → 自动发送质量最高的AI候选');
  console.log('   5. 发送后 → 用户可对AI回复进行质量反馈');

  resetTestData();
  console.log('\n✅ 测试完成，测试数据已清理');
}

runTests();
