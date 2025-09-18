const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadUserAvatar,
  removeAvatar,
  getSettings,
  updateSettings,
  getCreditsHistory,
  purchaseCredits,
  getStats,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getEnrolledCourses,
  getTeachingCourses,
  becomeInstructor,
  deleteAccount,
  getCreditsBalance
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar, cleanupTempFiles } = require('../middleware/upload');
const { 
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  sanitizeInput
} = require('../middleware/validation');
const { userValidators, paymentValidators, paramValidators } = require('../utils/validators');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de perfil
router.get('/profile', getProfile);
router.put('/profile', 
  sanitizeInput,
  userValidators.updateProfile,
  handleValidationErrors,
  updateProfile
);

// Rotas de avatar
router.post('/avatar',
  uploadAvatar,
  cleanupTempFiles,
  uploadUserAvatar
);
router.delete('/avatar', removeAvatar);

// Rotas de configurações
router.get('/settings', getSettings);
router.put('/settings',
  sanitizeInput,
  userValidators.updateSettings,
  handleValidationErrors,
  updateSettings
);

// Rotas de créditos
router.get('/credits', 
  validatePagination,
  getCreditsHistory
);
router.get('/credits/balance', getCreditsBalance);
router.post('/credits/purchase',
  sanitizeInput,
  paymentValidators.purchaseCredits,
  handleValidationErrors,
  purchaseCredits
);

// Rotas de estatísticas
router.get('/stats', getStats);

// Rotas de favoritos
router.get('/favorites',
  validatePagination,
  getFavorites
);
router.post('/favorites/:courseId',
  paramValidators.courseId,
  handleValidationErrors,
  addToFavorites
);
router.delete('/favorites/:courseId',
  paramValidators.courseId,
  handleValidationErrors,
  removeFromFavorites
);

// Rotas de cursos
router.get('/enrolled-courses',
  validatePagination,
  getEnrolledCourses
);
router.get('/teaching-courses',
  validatePagination,
  getTeachingCourses
);

// Rotas de instrutor
router.post('/become-instructor', becomeInstructor);

// Rota de exclusão de conta
router.delete('/account', deleteAccount);

module.exports = router;
