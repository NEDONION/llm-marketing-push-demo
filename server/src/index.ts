import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

// ES modules 中的 __dirname 替代
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 静态文件服务 - 提供前端构建文件
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA fallback - 所有非 API 请求返回 index.html
app.use((req, res, next) => {
  // 如果请求不是 API 且不是静态文件，返回 index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
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
