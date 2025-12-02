const PlatformFeedback = require('../models/PlatformFeedback');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Criar feedback da plataforma
const createPlatformFeedback = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiResponse(
      false,
      'Dados inválidos',
      null,
      null,
      errors.array()
    ));
  }

  const userId = req.user._id;
  const {
    rating,
    categories = {},
    comment = '',
    suggestions = '',
    wouldRecommend = false
  } = req.body;

  // Verificar se usuário já enviou feedback (opcional - pode permitir múltiplos)
  // Descomente se quiser limitar a um feedback por usuário:
  // const existingFeedback = await PlatformFeedback.findOne({ userId });
  // if (existingFeedback) {
  //   return res.status(400).json(createApiResponse(
  //     false,
  //     'Você já enviou um feedback sobre a plataforma'
  //   ));
  // }

  // Criar feedback
  const feedback = new PlatformFeedback({
    userId,
    rating,
    categories: {
      usability: categories.usability || 0,
      design: categories.design || 0,
      performance: categories.performance || 0,
      support: categories.support || 0
    },
    comment: comment.trim(),
    suggestions: suggestions.trim(),
    wouldRecommend
  });

  await feedback.save();

  // Buscar feedback populado
  const populatedFeedback = await PlatformFeedback.findById(feedback._id)
    .populate('userId', 'name email avatar')
    .lean();

  res.status(201).json(createApiResponse(
    true,
    'Feedback enviado com sucesso. Obrigado pela sua avaliação!',
    populatedFeedback
  ));
});

// Obter feedback do usuário (se quiser permitir visualizar feedbacks anteriores)
const getUserFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const feedback = await PlatformFeedback.findOne({ userId })
    .populate('userId', 'name email avatar')
    .lean();

  if (!feedback) {
    return res.status(404).json(createApiResponse(
      false,
      'Feedback não encontrado'
    ));
  }

  res.json(createApiResponse(
    true,
    'Feedback obtido com sucesso',
    feedback
  ));
});

// Obter estatísticas de feedback (apenas admin - implementar middleware se necessário)
const getFeedbackStats = asyncHandler(async (req, res) => {
  const stats = await PlatformFeedback.getStats();

  res.json(createApiResponse(
    true,
    'Estatísticas de feedback obtidas com sucesso',
    stats
  ));
});

module.exports = {
  createPlatformFeedback,
  getUserFeedback,
  getFeedbackStats
};

