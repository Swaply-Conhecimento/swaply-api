const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const {
  getInstructorAvailability,
  addRecurringAvailability,
  removeRecurringAvailability,
  addSpecificSlot,
  blockDate,
  getAvailableSlots,
  updateAvailabilitySettings,
  getCourseAvailability
} = require('../controllers/availabilityController');

// Validadores
const recurringValidators = [
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido (HH:MM)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido (HH:MM)'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('ID do curso inválido')
];

const specificSlotValidators = [
  body('date')
    .isISO8601()
    .withMessage('Data inválida'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido (HH:MM)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido (HH:MM)'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable deve ser booleano'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Motivo não pode ter mais de 200 caracteres'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('ID do curso inválido')
];

const blockDateValidators = [
  body('date')
    .isISO8601()
    .withMessage('Data inválida'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Motivo não pode ter mais de 200 caracteres'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('ID do curso inválido')
];

const settingsValidators = [
  body('minAdvanceBooking')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Antecedência mínima deve ser um número positivo'),
  body('maxAdvanceBooking')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Antecedência máxima deve ser maior que 0'),
  body('slotDuration')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('Duração do slot deve ser no mínimo 0.5 horas'),
  body('bufferTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tempo de buffer deve ser um número positivo'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone inválido'),
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('ID do curso inválido')
];

// Rotas públicas
router.get(
  '/slots',
  [
    query('instructorId')
      .isMongoId()
      .withMessage('ID do instrutor inválido'),
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('ID do curso inválido'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Data de término inválida')
  ],
  handleValidationErrors,
  getAvailableSlots
);

router.get(
  '/course/:courseId',
  [
    param('courseId')
      .isMongoId()
      .withMessage('ID do curso inválido'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Data de término inválida')
  ],
  handleValidationErrors,
  getCourseAvailability
);

// Rotas privadas (Instrutor)
router.use(authenticate);

router.get(
  '/instructor',
  [
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('ID do curso inválido')
  ],
  handleValidationErrors,
  getInstructorAvailability
);

router.post(
  '/recurring',
  recurringValidators,
  handleValidationErrors,
  addRecurringAvailability
);

router.delete(
  '/recurring/:slotId',
  [
    param('slotId')
      .isMongoId()
      .withMessage('ID do slot inválido'),
    query('courseId')
      .optional()
      .isMongoId()
      .withMessage('ID do curso inválido')
  ],
  handleValidationErrors,
  removeRecurringAvailability
);

router.post(
  '/specific',
  specificSlotValidators,
  handleValidationErrors,
  addSpecificSlot
);

router.post(
  '/block',
  blockDateValidators,
  handleValidationErrors,
  blockDate
);

router.put(
  '/settings',
  settingsValidators,
  handleValidationErrors,
  updateAvailabilitySettings
);

module.exports = router;

