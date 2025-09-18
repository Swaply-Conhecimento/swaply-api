const express = require('express');
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
  getCourseReviews
} = require('../controllers/courseController');
const {
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
  reportReview,
  respondToReview
} = require('../controllers/reviewController');
const { 
  authenticate, 
  optionalAuth,
  requireInstructor,
  requireCourseOwnership,
  requireEnrollment
} = require('../middleware/auth');
const { uploadCourseImage: uploadMiddleware, cleanupTempFiles } = require('../middleware/upload');
const { 
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateSearchFilters,
  sanitizeInput
} = require('../middleware/validation');
const { courseValidators, paramValidators, reviewValidators } = require('../utils/validators');

const router = express.Router();

// Rotas públicas (não requerem autenticação)
router.get('/', 
  validatePagination,
  validateSearchFilters,
  getAllCourses
);

router.get('/search',
  validatePagination,
  courseValidators.search,
  handleValidationErrors,
  searchCourses
);

router.get('/categories', getCategories);

router.get('/featured',
  getFeaturedCourses
);

router.get('/popular',
  getPopularCourses
);

// Rotas com autenticação opcional
router.get('/:id',
  paramValidators.id,
  handleValidationErrors,
  optionalAuth,
  getCourseById
);

router.get('/:id/reviews',
  paramValidators.id,
  handleValidationErrors,
  validatePagination,
  getCourseReviews
);

// Rotas que requerem autenticação
router.use(authenticate);

// Rotas de recomendação
router.get('/recommended/:userId',
  paramValidators.userId,
  handleValidationErrors,
  getRecommendedCourses
);

// Rotas de matrícula
router.post('/:id/enroll',
  paramValidators.id,
  handleValidationErrors,
  enrollInCourse
);

router.delete('/:id/unenroll',
  paramValidators.id,
  handleValidationErrors,
  unenrollFromCourse
);

// Rotas que requerem ser instrutor
router.post('/',
  requireInstructor,
  sanitizeInput,
  courseValidators.create,
  handleValidationErrors,
  createCourse
);

// Rotas que requerem ser dono do curso
router.put('/:id',
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  sanitizeInput,
  courseValidators.update,
  handleValidationErrors,
  updateCourse
);

router.delete('/:id',
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  deleteCourse
);

router.get('/:id/students',
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  validatePagination,
  getCourseStudents
);

router.post('/:id/image',
  paramValidators.id,
  handleValidationErrors,
  requireCourseOwnership,
  uploadMiddleware,
  cleanupTempFiles,
  uploadCourseImage
);

// Rotas de avaliações
router.post('/:id/reviews',
  paramValidators.id,
  handleValidationErrors,
  sanitizeInput,
  reviewValidators.create,
  handleValidationErrors,
  createReview
);

router.put('/reviews/:reviewId',
  paramValidators.reviewId,
  handleValidationErrors,
  sanitizeInput,
  reviewValidators.update,
  handleValidationErrors,
  updateReview
);

router.delete('/reviews/:reviewId',
  paramValidators.reviewId,
  handleValidationErrors,
  deleteReview
);

router.post('/reviews/:reviewId/helpful',
  paramValidators.reviewId,
  handleValidationErrors,
  markReviewHelpful
);

router.delete('/reviews/:reviewId/helpful',
  paramValidators.reviewId,
  handleValidationErrors,
  unmarkReviewHelpful
);

router.post('/reviews/:reviewId/report',
  paramValidators.reviewId,
  handleValidationErrors,
  reportReview
);

router.post('/reviews/:reviewId/respond',
  paramValidators.reviewId,
  handleValidationErrors,
  respondToReview
);

module.exports = router;
