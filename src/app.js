const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const connectDB = require("./config/database");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Importar configuração de autenticação
require("./config/auth");

// Importar rotas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const classRoutes = require("./routes/classes");
const instructorRoutes = require("./routes/instructors");
const notificationRoutes = require("./routes/notifications");
const feedbackRoutes = require("./routes/feedback");
const availabilityRoutes = require("./routes/availability");
const enrollmentRoutes = require("./routes/enrollments");
const statsRoutes = require('./routes/stats');

const app = express();

// Conectar ao banco de dados
connectDB();

// Inicializar jobs de notificações em produção
if (process.env.NODE_ENV === "production") {
  const { initializeNotificationJobs } = require("./jobs/notificationJobs");
  initializeNotificationJobs();
}

// Middlewares de segurança
app.use(
  helmet({
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
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Configuração CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173", // Vite
      "https://swaply.vercel.app",
      "https://swaply-web.vercel.app",
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Não permitido pelo CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
};

app.use(cors(corsOptions));

// Middlewares de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Inicializar Passport
app.use(passport.initialize());

// Middleware para logging de requests removido
app.use((req, res, next) => {
  next();
});

// Rota de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// Rota de informações da API
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Swaply API v1.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      courses: "/api/courses",
      classes: "/api/classes",
      payments: "/api/payments",
      notifications: "/api/notifications",
    },
  });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/availability", availabilityRoutes);
app.use('/api/stats', statsRoutes);

// Rota para servir arquivos estáticos (uploads)
app.use("/uploads", express.static("uploads"));

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware global de tratamento de erros
app.use(errorHandler);

// Tratamento de erros não capturados
process.on("unhandledRejection", (err, promise) => {
  // Fechar servidor e sair do processo
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  process.exit(0);
});

process.on("SIGINT", () => {
  process.exit(0);
});

module.exports = app;
