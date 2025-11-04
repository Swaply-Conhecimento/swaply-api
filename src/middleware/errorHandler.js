const mongoose = require('mongoose');

// Middleware global de tratamento de erros
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('Error:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors
    });
  }

  // Erro de duplicação (chave única)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' já está em uso`;
    
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Erro de ObjectId inválido
  if (err.name === 'CastError') {
    const message = 'Recurso não encontrado';
    return res.status(404).json({
      success: false,
      message
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }

  // Erro de conexão com banco
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível'
    });
  }

  // Erro de upload do Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Arquivo muito grande'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Muitos arquivos enviados'
    });
  }

  // Erro personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Erro no servidor'
    });
  }

  // Erro padrão do servidor
  // Em desenvolvimento, mostrar mais detalhes
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack
    })
  });
};

// Middleware para capturar rotas não encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: error.message
  });
};

// Middleware para tratar erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Classe para erros customizados
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Função para criar erro de validação
const createValidationError = (message, field = null) => {
  const error = new AppError(message, 400);
  if (field) {
    error.field = field;
  }
  return error;
};

// Função para criar erro de autorização
const createAuthError = (message = 'Não autorizado') => {
  return new AppError(message, 401);
};

// Função para criar erro de permissão
const createForbiddenError = (message = 'Acesso negado') => {
  return new AppError(message, 403);
};

// Função para criar erro de não encontrado
const createNotFoundError = (message = 'Recurso não encontrado') => {
  return new AppError(message, 404);
};

// Função para criar erro de conflito
const createConflictError = (message = 'Conflito de dados') => {
  return new AppError(message, 409);
};

// Função para criar erro de servidor
const createServerError = (message = 'Erro interno do servidor') => {
  return new AppError(message, 500);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  createValidationError,
  createAuthError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createServerError
};
