const http = require('http');

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

async function createTestLetter() {
  const result = await makeRequest(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/letters',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      senderId: 'frontend_test_user',
      senderName: '前端测试用户',
      recipient: '未来的自己',
      recipientType: 'future',
      title: '前端界面测试信件',
      content: '这是一封专门用于测试前端界面的信件。\n\n希望能够看到完整的候选池组件、回复卡片的来源区分、以及质量反馈功能。\n\n让我们看看人工优先策略是如何工作的！',
      emotions: ['希望', '温暖', '好奇'],
      isPublic: true,
      isAnonymous: false
    }
  );

  console.log('信件创建成功！');
  console.log('信件ID:', result.data.data.id);
  console.log('请访问以下URL查看详情页:');
  console.log(`http://localhost:5175/letters/${result.data.data.id}`);
}

createTestLetter().catch(console.error);
