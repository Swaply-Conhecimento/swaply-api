const express = require('express');
const {
  getActiveCounts,
  getActiveCoursesCount,
  getActiveUsersCount,
} = require('../controllers/statsController');

const router = express.Router();

// Retorna ambos counts
router.get('/', getActiveCounts);

// Retorna apenas contagem de cursos ativos
router.get('/courses', getActiveCoursesCount);

// Retorna apenas contagem de usuários ativos
router.get('/users', getActiveUsersCount);

module.exports = router;
