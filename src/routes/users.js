const express = require("express");
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
  getCreditsBalance,
  getUserCalendar,
  getInstructorCalendar,
  changePassword,
} = require("../controllers/userController");
const {
  getUserReviews,
  getReceivedReviews,
  getInstructorReviewStats,
} = require("../controllers/reviewController");
const { uploadAvatar, cleanupTempFiles } = require("../middleware/upload");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  sanitizeInput,
} = require("../middleware/validation");
const {
  userValidators,
  paymentValidators,
  paramValidators,
} = require("../utils/validators");
const { authenticate } = require("../middleware/auth");
const { body } = require("express-validator");

const router = express.Router();

// Todas as rotas de usuários requerem autenticação
router.use(authenticate);

// Rotas de perfil
router.get("/profile", getProfile);
router.put(
  "/profile",
  sanitizeInput,
  userValidators.updateProfile,
  handleValidationErrors,
  updateProfile
);

// Rota de alteração de senha
router.put(
  "/password",
  sanitizeInput,
  [
    body("currentPassword").notEmpty().withMessage("Senha atual é obrigatória"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Nova senha deve ter pelo menos 6 caracteres"),
    body("confirmNewPassword")
      .notEmpty()
      .withMessage("Confirmação da nova senha é obrigatória"),
  ],
  handleValidationErrors,
  changePassword
);

// Rotas de avatar
router.post("/avatar", uploadAvatar, cleanupTempFiles, uploadUserAvatar);
router.delete("/avatar", removeAvatar);

// Rotas de configurações
router.get("/settings", getSettings);
router.put(
  "/settings",
  sanitizeInput,
  userValidators.updateSettings,
  handleValidationErrors,
  updateSettings
);

// Rotas de créditos
router.get("/credits", validatePagination, getCreditsHistory);
router.get("/credits/balance", getCreditsBalance);
router.post(
  "/credits/purchase",
  sanitizeInput,
  paymentValidators.purchaseCredits,
  handleValidationErrors,
  purchaseCredits
);

// Rotas de estatísticas
router.get("/stats", getStats);

// Rotas de favoritos
router.get("/favorites", validatePagination, getFavorites);
router.post(
  "/favorites/:courseId",
  paramValidators.courseId,
  handleValidationErrors,
  addToFavorites
);
router.delete(
  "/favorites/:courseId",
  paramValidators.courseId,
  handleValidationErrors,
  removeFromFavorites
);

// Rotas de cursos
router.get("/enrolled-courses", validatePagination, getEnrolledCourses);
router.get("/teaching-courses", validatePagination, getTeachingCourses);

// Rotas de instrutor
router.post("/become-instructor", becomeInstructor);

// Rota de exclusão de conta
router.delete("/account", deleteAccount);

// Rotas de calendário
router.get("/calendar", getUserCalendar);

// Rotas de avaliações do usuário
router.get("/reviews", validatePagination, getUserReviews);

router.get("/reviews/received", validatePagination, getReceivedReviews);

router.get("/reviews/stats", getInstructorReviewStats);

module.exports = router;
