const express = require('express');
const router = express.Router();
const {
  createPlatformFeedback,
  getUserFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const {
  handleValidationErrors,
  sanitizeInput
} = require('../middleware/validation');
const { body } = require('express-validator');

// Validações
const platformFeedbackValidators = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser entre 1 e 5'),
  
  body('categories.usability')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Avaliação de facilidade de uso deve ser entre 0 e 5'),
  
  body('categories.design')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Avaliação de design deve ser entre 0 e 5'),
  
  body('categories.performance')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Avaliação de performance deve ser entre 0 e 5'),
  
  body('categories.support')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('Avaliação de suporte deve ser entre 0 e 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Comentário não pode ter mais de 2000 caracteres'),
  
  body('suggestions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Sugestões não podem ter mais de 2000 caracteres'),
  
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('wouldRecommend deve ser um booleano')
];

// Todas as rotas requerem autenticação
router.use(authenticate);

// POST /api/feedback/platform - Criar feedback da plataforma
router.post(
  '/platform',
  sanitizeInput,
  platformFeedbackValidators,
  handleValidationErrors,
  createPlatformFeedback
);

// GET /api/feedback/platform - Obter feedback do usuário atual
router.get(
  '/platform',
  getUserFeedback
);

// GET /api/feedback/stats - Obter estatísticas de feedback (pode adicionar middleware de admin depois)
router.get(
  '/stats',
  getFeedbackStats
);

module.exports = router;

