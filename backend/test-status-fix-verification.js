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
      content: `你的信《${title}》已被银河邮局收录。愿这份心意在星河里闪耀 ✨`,
      emotion: '神秘',
      qualityScore: 85
    },
    {
      fromParallel: 'echo_world',
      senderName: '世界回声',
      content: `在某个平行时空里，有人正阅读着你的文字——"${contentSnippet}..."，并回以同样的温暖。`,
      emotion: '温暖',
      qualityScore: 90
    },
    {
      fromParallel: 'cosmic_witness',
      senderName: '宇宙见证者',
      content: `星河里每一粒尘埃都在倾听你的心事。关于《${title}》，宇宙说：一切都会好起来的。🌟`,
      emotion: '治愈',
      qualityScore: 92
    },
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

function resetTestData() {
  writeJSON('letters.json', { letters: [] });
  writeJSON('replyCandidates.json', { candidates: [] });
  writeJSON('replyCandidatePools.json', { pools: [] });
  writeJSON('notifications.json', { notifications: [] });
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

  const poolDataFile = readJSON('replyCandidatePools.json') || { pools: [] };
  const pIdx = poolDataFile.pools.findIndex(p => p.id === pool.id);
  if (pIdx !== -1) {
    poolDataFile.pools[pIdx] = { ...pool, updatedAt: new Date().toISOString() };
    writeJSON('replyCandidatePools.json', poolDataFile);
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

function runTests() {
  console.log('\n🧪 开始验证状态修复 - 区分三种回复来源状态\n');
  resetTestData();

  let allPassed = true;

  console.log('📝 测试1: 陌生人回复状态验证');
  const letter1 = {
    id: 'test_human',
    senderId: 'user1',
    title: '测试陌生人回复',
    content: '测试内容',
    emotions: ['温暖'],
    replies: []
  };
  initializeReplyCandidates(letter1);
  const letterData1 = readJSON('letters.json') || { letters: [] };
  letterData1.letters.unshift(letter1);
  writeJSON('letters.json', letterData1);

  const strangerReply = {
    id: generateId(),
    letterId: letter1.id,
    senderName: '温暖陌生人',
    content: '这是一条陌生人回复',
    source: 'stranger',
    isStrangerReply: true,
    createdAt: new Date().toISOString(),
  };
  letter1.replies.push(strangerReply);
  const ld1 = readJSON('letters.json');
  const li1 = ld1.letters.findIndex(l => l.id === letter1.id);
  if (li1 !== -1) { ld1.letters[li1] = letter1; writeJSON('letters.json', ld1); }

  checkAndApplyTimeoutFallback(letter1);
  const finalPool1 = getReplyCandidatePool(letter1.id);

  const test1Pass = finalPool1.pool.status === 'human_replied';
  console.log(`   候选池状态: ${finalPool1.pool.status}`);
  console.log(`   期望: human_replied`);
  console.log(`   结果: ${test1Pass ? '✅ 通过' : '❌ 失败'}`);
  if (!test1Pass) allPassed = false;

  console.log('\n🤖 测试2: 手动选用AI候选状态验证');
  resetTestData();

  const letter2 = {
    id: 'test_ai_selected',
    senderId: 'user2',
    title: '测试手动选AI',
    content: '测试内容',
    emotions: ['希望'],
    replies: []
  };
  const { candidates: cands2, pool: pool2init } = initializeReplyCandidates(letter2);
  const letterData2 = readJSON('letters.json') || { letters: [] };
  letterData2.letters.unshift(letter2);
  writeJSON('letters.json', letterData2);

  const selectedCand2 = cands2[0];
  selectedCand2.status = 'selected';
  selectedCand2.selectedAt = new Date().toISOString();
  const cd2 = readJSON('replyCandidates.json');
  const ci2 = cd2.candidates.findIndex(c => c.id === selectedCand2.id);
  if (ci2 !== -1) { cd2.candidates[ci2] = selectedCand2; writeJSON('replyCandidates.json', cd2); }

  cands2.forEach(c => {
    if (c.id !== selectedCand2.id) {
      c.status = 'rejected';
      const idx2 = cd2.candidates.findIndex(cc => cc.id === c.id);
      if (idx2 !== -1) cd2.candidates[idx2] = c;
    }
  });
  writeJSON('replyCandidates.json', cd2);

  pool2init.status = 'ai_selected';
  pool2init.selectedCandidateId = selectedCand2.id;
  const pd2 = readJSON('replyCandidatePools.json');
  const pi2 = pd2.pools.findIndex(p => p.id === pool2init.id);
  if (pi2 !== -1) {
    pd2.pools[pi2] = { ...pool2init, updatedAt: new Date().toISOString() };
    writeJSON('replyCandidatePools.json', pd2);
  }

  const reply2 = {
    id: generateId(),
    letterId: letter2.id,
    senderName: selectedCand2.senderName,
    content: selectedCand2.content,
    source: 'ai_generated',
    candidateId: selectedCand2.id,
    qualityScore: selectedCand2.qualityScore,
    createdAt: new Date().toISOString()
  };
  letter2.replies.push(reply2);
  const ld2 = readJSON('letters.json');
  const li2 = ld2.letters.findIndex(l => l.id === letter2.id);
  if (li2 !== -1) { ld2.letters[li2] = letter2; writeJSON('letters.json', ld2); }

  const fallbackResult = checkAndApplyTimeoutFallback(letter2);
  const finalPool2 = getReplyCandidatePool(letter2.id);

  const test2StatusPass = finalPool2.pool.status === 'ai_selected';
  const test2NoFallback = fallbackResult === false;
  const test2ReplySource = reply2.source === 'ai_generated';
  console.log(`   候选池状态: ${finalPool2.pool.status}`);
  console.log(`   期望状态: ai_selected`);
  console.log(`   是否触发超时补位: ${fallbackResult} (期望: false)`);
  console.log(`   回复来源: ${reply2.source} (期望: ai_generated)`);
  const test2Pass = test2StatusPass && test2NoFallback && test2ReplySource;
  console.log(`   结果: ${test2Pass ? '✅ 通过' : '❌ 失败'}`);
  if (!test2Pass) allPassed = false;

  console.log('\n⏰ 测试3: 超时AI补位状态验证');
  resetTestData();

  const letter3 = {
    id: 'test_ai_fallback',
    senderId: 'user3',
    title: '测试超时补位',
    content: '测试内容',
    emotions: ['思念'],
    replies: []
  };
  initializeReplyCandidates(letter3);
  const poolInfo3 = getReplyCandidatePool(letter3.id);
  poolInfo3.pool.timeoutAt = new Date(Date.now() - 1000).toISOString();
  const pd3 = readJSON('replyCandidatePools.json');
  const pi3 = pd3.pools.findIndex(p => p.id === poolInfo3.pool.id);
  if (pi3 !== -1) { pd3.pools[pi3] = poolInfo3.pool; writeJSON('replyCandidatePools.json', pd3); }

  const ld3init = readJSON('letters.json') || { letters: [] };
  ld3init.letters.unshift(letter3);
  writeJSON('letters.json', ld3init);

  const hasFallback3 = checkAndApplyTimeoutFallback(letter3);
  const finalLetter3 = readJSON('letters.json').letters.find(l => l.id === letter3.id);
  const finalPool3 = getReplyCandidatePool(letter3.id);

  const test3Fallback = hasFallback3 === true;
  const test3Status = finalPool3.pool.status === 'timeout_fallback';
  const test3Source = finalLetter3.replies?.[0]?.source === 'ai_fallback';
  console.log(`   是否触发补位: ${hasFallback3} (期望: true)`);
  console.log(`   候选池状态: ${finalPool3.pool.status} (期望: timeout_fallback)`);
  console.log(`   回复来源: ${finalLetter3.replies?.[0]?.source} (期望: ai_fallback)`);
  const test3Pass = test3Fallback && test3Status && test3Source;
  console.log(`   结果: ${test3Pass ? '✅ 通过' : '❌ 失败'}`);
  if (!test3Pass) allPassed = false;

  console.log('\n🛡️  测试4: ai_selected状态不应触发超时补位');
  resetTestData();

  const letter4 = {
    id: 'test_no_fallback_after_ai_select',
    senderId: 'user4',
    title: '测试选AI后不超时',
    content: '测试内容',
    emotions: ['治愈'],
    replies: []
  };
  initializeReplyCandidates(letter4);
  const poolInfo4 = getReplyCandidatePool(letter4.id);
  poolInfo4.pool.timeoutAt = new Date(Date.now() - 5000).toISOString();
  poolInfo4.pool.status = 'ai_selected';
  const pd4 = readJSON('replyCandidatePools.json');
  const pi4 = pd4.pools.findIndex(p => p.id === poolInfo4.pool.id);
  if (pi4 !== -1) { pd4.pools[pi4] = { ...poolInfo4.pool, updatedAt: new Date().toISOString() }; writeJSON('replyCandidatePools.json', pd4); }

  const ld4 = readJSON('letters.json') || { letters: [] };
  ld4.letters.unshift(letter4);
  writeJSON('letters.json', ld4);

  const fallback4 = checkAndApplyTimeoutFallback(letter4);
  const test4NoNewReply = letter4.replies?.length === 0;
  const test4Status = fallback4 === false;
  console.log(`   是否触发补位: ${fallback4} (期望: false)`);
  console.log(`   回复数量: ${letter4.replies?.length || 0} (期望: 0)`);
  const test4Pass = test4NoNewReply && test4Status;
  console.log(`   结果: ${test4Pass ? '✅ 通过' : '❌ 失败'}`);
  if (!test4Pass) allPassed = false;

  console.log('\n' + '='.repeat(50));
  console.log(allPassed ? '🎉 所有状态验证测试通过！' : '💥 有测试失败，请检查。');
  console.log('='.repeat(50));

  resetTestData();
}

runTests();
