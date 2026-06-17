const http = require('http');

const letterId = 'mqhg9jf757jjdxf8y';

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function debug() {
  console.log('检查信件:', letterId);
  
  console.log('\n1. 先调用 GET /reply-candidates:');
  const result1 = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/letters/${letterId}/reply-candidates`,
    method: 'GET'
  });
  console.log('状态码:', result1.status);
  console.log('返回数据:', JSON.stringify(result1.data, null, 2));

  console.log('\n2. 再调用 POST /check-timeout:');
  const result2 = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/letters/${letterId}/check-timeout`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {});
  console.log('状态码:', result2.status);
  console.log('返回数据:', JSON.stringify(result2.data, null, 2));

  console.log('\n3. 检查数据文件:');
  const fs = require('fs');
  const pools = JSON.parse(fs.readFileSync('./data/replyCandidatePools.json', 'utf8'));
  const pool = pools.pools.find(p => p.letterId === letterId);
  console.log('候选池:', JSON.stringify(pool, null, 2));

  const candidates = JSON.parse(fs.readFileSync('./data/replyCandidates.json', 'utf8'));
  const letterCandidates = candidates.candidates.filter(c => c.letterId === letterId);
  console.log('候选数量:', letterCandidates.length);
  letterCandidates.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.senderName} - ${c.status} - ${c.qualityScore}分`);
  });
}

debug().catch(console.error);
