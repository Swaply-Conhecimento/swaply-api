const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  enrollInFullCourse,
  enrollInSingleClass,
  getMyEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  checkEnrollmentStatus
} = require('../controllers/enrollmentController');

// Validadores
const enrollFullCourseValidators = [
  body('courseId')
    .isMongoId()
    .withMessage('ID do curso inválido')
];

const enrollSingleClassValidators = [
  body('courseId')
    .isMongoId()
    .withMessage('ID do curso inválido'),
  body('date')
    .notEmpty()
    .withMessage('Data é obrigatória')
    .isISO8601()
    .withMessage('Data inválida'),
  body('time')
    .notEmpty()
    .withMessage('Horário é obrigatório')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido (HH:MM)'),
  body('duration')
    .optional()
    .isFloat({ min: 0.5, max: 4 })
    .withMessage('Duração deve estar entre 0.5 e 4 horas'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas não podem ter mais de 1000 caracteres')
];

const idValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido')
];

// Todas as rotas requerem autenticação
router.use(authenticate);

// Matricular em curso completo
router.post(
  '/full-course',
  enrollFullCourseValidators,
  handleValidationErrors,
  enrollInFullCourse
);

// Comprar aula avulsa
router.post(
  '/single-class',
  enrollSingleClassValidators,
  handleValidationErrors,
  enrollInSingleClass
);

// Listar minhas matrículas
router.get(
  '/',
  getMyEnrollments
);

// Verificar status de matrícula em um curso
router.get(
  '/check/:courseId',
  [
    param('courseId')
      .isMongoId()
      .withMessage('ID do curso inválido')
  ],
  handleValidationErrors,
  checkEnrollmentStatus
);

// Obter detalhes de uma matrícula
router.get(
  '/:id',
  idValidator,
  handleValidationErrors,
  getEnrollmentById
);

// Cancelar matrícula
router.delete(
  '/:id',
  idValidator,
  handleValidationErrors,
  cancelEnrollment
);

module.exports = router;

