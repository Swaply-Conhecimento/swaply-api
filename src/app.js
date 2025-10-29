const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { RATE_LIMITS } = require('./utils/constants');

// Importar configuração de autenticação
require('./config/auth');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const classRoutes = require('./routes/classes');
const instructorRoutes = require('./routes/instructors');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Conectar ao banco de dados
connectDB();

// Inicializar jobs de notificações em produção
if (process.env.NODE_ENV === 'production') {
  const { initializeNotificationJobs } = require('./jobs/notificationJobs');
  initializeNotificationJobs();
}

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Configuração CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite
      'https://swaply.vercel.app',
      'https://swaply-web.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ]
};

app.use(cors(corsOptions));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.API_GENERAL.windowMs,
  max: RATE_LIMITS.API_GENERAL.max,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.windowMs,
  max: RATE_LIMITS.LOGIN.max,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar Passport
app.use(passport.initialize());

// Middleware para logging de requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Rota de informações da API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Swaply API v1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      classes: '/api/classes',
      payments: '/api/payments',
      notifications: '/api/notifications'
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/notifications', notificationRoutes);

// Rota para servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware global de tratamento de erros
app.use(errorHandler);

// Tratamento de erros não capturados
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection:', err.message);
  // Fechar servidor e sair do processo
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Fechando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Fechando servidor graciosamente...');
  process.exit(0);
});

module.exports = app;
