const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso inválido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se usuário é instrutor
const requireInstructor = (req, res, next) => {
  if (!req.user.isInstructor) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas instrutores podem acessar este recurso'
    });
  }
  next();
};

// Middleware para verificar se usuário é dono do recurso
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.body[resourceField] || req.params[resourceField] || req.query[resourceField];
    
    if (!resourceUserId || resourceUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não tem permissão para acessar este recurso'
      });
    }
    next();
  };
};

// Middleware para verificar se usuário é dono do curso
const requireCourseOwnership = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const courseId = req.params.courseId || req.params.id || req.body.courseId;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'ID do curso não fornecido'
      });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não é o instrutor deste curso'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se usuário está matriculado no curso
const requireEnrollment = async (req, res, next) => {
  try {
    const Course = require('../models/Course');
    const courseId = req.params.courseId || req.params.id || req.body.courseId;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'ID do curso não fornecido'
      });
    }

    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }

    const isEnrolled = course.enrolledStudents.includes(req.user._id);
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    
    if (!isEnrolled && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você não está matriculado neste curso'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar créditos suficientes
const requireCredits = (minCredits) => {
  return (req, res, next) => {
    if (req.user.credits < minCredits) {
      return res.status(400).json({
        success: false,
        message: `Créditos insuficientes. Você precisa de pelo menos ${minCredits} crédito${minCredits > 1 ? 's' : ''}`
      });
    }
    next();
  };
};

// Middleware opcional de autenticação (não falha se não houver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignora erros de token em autenticação opcional
    next();
  }
};

// Função para gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Função para gerar refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Função para verificar refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token inválido');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
};

module.exports = {
  authenticate,
  requireInstructor,
  requireOwnership,
  requireCourseOwnership,
  requireEnrollment,
  requireCredits,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};
