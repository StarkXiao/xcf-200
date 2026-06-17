const fs = require('fs');
const path = require('path');

const LETTER_ID = 'mqhhdhggnvkujlxh6';

console.log('=== 超时补位功能测试 ===\n');

const replyPoolsPath = path.join(__dirname, 'data', 'replyCandidatePools.json');
const replyCandidatesPath = path.join(__dirname, 'data', 'replyCandidates.json');
const lettersPath = path.join(__dirname, 'data', 'letters.json');

const poolsData = JSON.parse(fs.readFileSync(replyPoolsPath, 'utf8'));
const candidatesData = JSON.parse(fs.readFileSync(replyCandidatesPath, 'utf8'));
const lettersData = JSON.parse(fs.readFileSync(lettersPath, 'utf8'));

const pool = poolsData.pools.find(p => p.letterId === LETTER_ID);
const candidates = candidatesData.candidates.filter(c => c.letterId === LETTER_ID);
const letter = lettersData.letters.find(l => l.id === LETTER_ID);

console.log('1. 检查候选池是否存在:');
if (pool) {
  console.log(`   ✅ 候选池存在，ID: ${pool.id}`);
  console.log(`   - 状态: ${pool.status}`);
  console.log(`   - 超时时间: ${pool.timeoutAt}`);
  console.log(`   - 候选数量: ${candidates.length}`);
} else {
  console.log('   ❌ 候选池不存在');
  console.log('\n可能原因：信件还在投递中，候选池需要等信件送达后才创建。');
  console.log('让我们检查已有的超时测试信件...\n');
  
  const timeoutTestLetter = lettersData.letters.find(l => l.title === '超时测试信件');
  if (timeoutTestLetter) {
    console.log(`找到超时测试信件: ${timeoutTestLetter.id}`);
    console.log(`回复数量: ${timeoutTestLetter.replies?.length || 0}`);
    if (timeoutTestLetter.replies?.length > 0) {
      const reply = timeoutTestLetter.replies[0];
      console.log(`回复来源: ${reply.source}`);
      console.log(`发送者: ${reply.senderName}`);
      console.log(`质量分: ${reply.qualityScore}`);
    }
  }
  process.exit(0);
}

console.log('\n2. 模拟超时（将超时时间改为过去）:');
const originalTimeout = pool.timeoutAt;
pool.timeoutAt = new Date(Date.now() - 60000).toISOString();
console.log(`   原超时时间: ${originalTimeout}`);
console.log(`   新超时时间: ${pool.timeoutAt}`);

const poolIdx = poolsData.pools.findIndex(p => p.id === pool.id);
poolsData.pools[poolIdx] = pool;
fs.writeFileSync(replyPoolsPath, JSON.stringify(poolsData, null, 2));
console.log('   ✅ 超时时间已修改');

console.log('\n3. 调用超时检查API:');
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/letters/${LETTER_ID}/check-timeout`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(`   状态码: ${res.statusCode}`);
    console.log(`   成功: ${result.success}`);
    console.log(`   消息: ${result.message}`);
    console.log(`   已触发补位: ${result.data?.hasFallback}`);
    
    if (result.data?.hasFallback) {
      console.log('\n4. 验证AI补位回复:');
      const updatedLetters = JSON.parse(fs.readFileSync(lettersPath, 'utf8'));
      const updatedLetter = updatedLetters.letters.find(l => l.id === LETTER_ID);
      const reply = updatedLetter.replies?.[updatedLetter.replies.length - 1];
      
      if (reply) {
        console.log(`   ✅ 回复已创建`);
        console.log(`   - 来源: ${reply.source}`);
        console.log(`   - 来源标签: ${reply.source === 'ai_fallback' ? 'AI补位（橙色）' : reply.source}`);
        console.log(`   - 发送者: ${reply.senderName}`);
        console.log(`   - 质量分: ${reply.qualityScore}`);
        console.log(`   - 候选ID: ${reply.candidateId}`);
        
        if (reply.source === 'ai_fallback') {
          console.log('\n   🎉 超时补位功能验证成功！');
          console.log('   回复将显示橙色的"AI补位"标签，区别于普通AI回复（紫色）。');
        }
      }
      
      console.log('\n5. 检查候选池状态更新:');
      const updatedPool = result.data.poolData.pool;
      console.log(`   新状态: ${updatedPool.status}`);
      console.log(`   选中候选ID: ${updatedPool.selectedCandidateId}`);
      console.log(`   补位时间: ${updatedPool.fallbackAt}`);
    }
    
    console.log('\n=== 测试完成 ===');
  });
});

req.on('error', error => {
  console.error(`   ❌ 请求失败: ${error.message}`);
});

req.end();
