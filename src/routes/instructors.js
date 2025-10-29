const express = require('express');
const { getInstructorCalendar } = require('../controllers/userController');
const { 
  handleValidationErrors,
  validateObjectId
} = require('../middleware/validation');
const { param, query } = require('express-validator');

const router = express.Router();

/**
 * GET /instructors/:id/calendar
 * Obter calendário público de um instrutor
 */
router.get('/:id/calendar',
  [
    param('id')
      .isMongoId().withMessage('ID do instrutor inválido'),
    query('month')
      .notEmpty().withMessage('Mês é obrigatório')
      .isInt({ min: 1, max: 12 }).withMessage('Mês deve ser entre 1 e 12'),
    query('year')
      .notEmpty().withMessage('Ano é obrigatório')
      .isInt({ min: 2020, max: 2100 }).withMessage('Ano inválido')
  ],
  handleValidationErrors,
  getInstructorCalendar
);

module.exports = router;
