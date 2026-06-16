const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const letterRoutes = require('./routes/letters');
const emotionRoutes = require('./routes/emotions');
const userRoutes = require('./routes/user');
const archiveRoutes = require('./routes/archive');
const strangerReplyRoutes = require('./routes/strangerReply');
const healingRoutes = require('./routes/healing');
const activityRoutes = require('./routes/activities');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/stranger-reply', strangerReplyRoutes);
app.use('/api/healing', healingRoutes);
app.use('/api/activities', activityRoutes);

app.get('/api', (req, res) => {
  res.json({ 
    message: '欢迎来到星邮局 API', 
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      letters: '/api/letters',
      emotions: '/api/emotions',
      user: '/api/user'
    }
  });
});

app.listen(PORT, () => {
  console.log(`星邮局后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 文档: http://localhost:${PORT}/api`);
});
