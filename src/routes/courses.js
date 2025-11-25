const express = require("express");
const {
  getAllCourses,
  searchCourses,
  getCategories,
  getFeaturedCourses,
  getPopularCourses,
  getRecommendedCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
  getCourseStudents,
  uploadCourseImage,
  getCourseReviews,
} = require("../controllers/courseController");
const { getCourseAvailability } = require("../controllers/classController");
const {
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
  reportReview,
  respondToReview,
} = require("../controllers/reviewController");

const {
  authenticate,
  optionalAuth,
  requireInstructor,
  requireCourseOwnership,
  requireEnrollment,
} = require("../middleware/auth");
const {
  uploadCourseImage: uploadMiddleware,
  cleanupTempFiles,
} = require("../middleware/upload");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  sanitizeInput,
} = require("../middleware/validation");
const {
  courseValidators,
  paramValidators,
  reviewValidators,
} = require("../utils/validators");

const router = express.Router();

// Rotas públicas (aceitam token opcional para retornar isFavorite quando presente)
router.get("/", validatePagination, validateSearchFilters, optionalAuth, getAllCourses);

router.get(
  "/search",
  validatePagination,
  courseValidators.search,
  handleValidationErrors,
  optionalAuth,
  searchCourses
);

router.get("/categories", optionalAuth, getCategories);

router.get("/featured", optionalAuth, getFeaturedCourses);

router.get("/popular", optionalAuth, getPopularCourses);

// Rotas públicas com autenticação opcional
router.get(
  "/:id",
  paramValidators.id,
  handleValidationErrors,
  optionalAuth,
  getCourseById
);

router.get(
  "/:id/reviews",
  paramValidators.id,
  handleValidationErrors,
  validatePagination,
  getCourseReviews
);

router.get(
  "/:id/availability",
  paramValidators.id,
  handleValidationErrors,
  getCourseAvailability
);

// Rotas que requerem autenticação
router.use(authenticate);

const handleOptionalCourseImageUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return next();
  }

  uploadMiddleware(req, res, next);
};

// Rotas de recomendação
router.get(
  "/recommended/:userId",
  paramValidators.userId,
  handleValidationErrors,
  getRecommendedCourses
);

// Rotas de matrícula
router.post(
  "/:id/enroll",
  paramValidators.id,
  handleValidationErrors,
  enrollInCourse
);

router.delete(
  "/:id/unenroll",
  paramValidators.id,
  handleValidationErrors,
  unenrollFromCourse
);

// Rotas de criação de curso (qualquer usuário autenticado pode criar)
router.post(
  "/",
  handleOptionalCourseImageUpload,
  cleanupTempFiles,
  sanitizeInput,
  courseValidators.create,
  handleValidationErrors,
  createCourse
);

// Rotas de edição de curso (requerem ser dono do curso)
router.put(
  "/:id",
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  handleOptionalCourseImageUpload,
  cleanupTempFiles,
  sanitizeInput,
  courseValidators.update,
  handleValidationErrors,
  updateCourse
);

router.delete(
  "/:id",
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  deleteCourse
);

router.get(
  "/:id/students",
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  validatePagination,
  getCourseStudents
);

router.post(
  "/:id/image",
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  uploadMiddleware,
  cleanupTempFiles,
  uploadCourseImage
);

// Rotas de avaliações
router.post(
  "/:id/reviews",
  paramValidators.id,
  handleValidationErrors,
  sanitizeInput,
  reviewValidators.create,
  handleValidationErrors,
  createReview
);

router.put(
  "/reviews/:reviewId",
  paramValidators.reviewId,
  handleValidationErrors,
  sanitizeInput,
  reviewValidators.update,
  handleValidationErrors,
  updateReview
);

router.delete(
  "/reviews/:reviewId",
  paramValidators.reviewId,
  handleValidationErrors,
  deleteReview
);

router.post(
  "/reviews/:reviewId/helpful",
  paramValidators.reviewId,
  handleValidationErrors,
  markReviewHelpful
);

router.delete(
  "/reviews/:reviewId/helpful",
  paramValidators.reviewId,
  handleValidationErrors,
  unmarkReviewHelpful
);

router.post(
  "/reviews/:reviewId/report",
  paramValidators.reviewId,
  handleValidationErrors,
  reportReview
);

router.post(
  "/reviews/:reviewId/respond",
  paramValidators.reviewId,
  handleValidationErrors,
  respondToReview
);

module.exports = router;
