import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

// 加载环境变量 - 从 server/.env
dotenv.config();

// 验证必需的环境变量
const requiredEnvVars = ['OPENAI_API_KEY', 'OPENAI_BASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check if server/.env file exists');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('   - OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');
console.log('   - OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api', routes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    service: 'LLM Push/Email Demo API',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /api/generate',
      verify: 'POST /api/verify',
      userProfile: 'GET /api/user/:userId/profile',
      health: 'GET /api/health'
    },
    documentation: 'https://github.com/your-repo'
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});
