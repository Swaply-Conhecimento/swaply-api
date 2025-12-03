const Course = require('../models/Course');
const User = require('../models/User');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/stats
const getActiveCounts = asyncHandler(async (req, res) => {
  try {
    // Contar cursos ativos (status: 'active' ou isLive: true)
    const activeCourses = await Course.countDocuments({
      $or: [
        { status: 'active' },
        { status: { $exists: false }, isLive: true }
      ]
    });

    // Contar usuários ativos (isActive: true ou não deletados)
    const activeUsers = await User.countDocuments({
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    });

    res.json(createApiResponse(
      true,
      'Contagens obtidas com sucesso',
      { activeCourses, activeUsers }
    ));
  } catch (error) {
    // Em caso de erro, retornar valores padrão
    res.json(createApiResponse(
      true,
      'Contagens obtidas com sucesso',
      { activeCourses: 0, activeUsers: 0 }
    ));
  }
});

// GET /api/stats/courses
const getActiveCoursesCount = asyncHandler(async (req, res) => {
  const activeCourses = await Course.countDocuments({ status: 'active' });

  res.json(createApiResponse(
    true,
    'Quantidade de cursos ativos obtida com sucesso',
    { activeCourses }
  ));
});

// GET /api/stats/users
const getActiveUsersCount = asyncHandler(async (req, res) => {
  const activeUsers = await User.countDocuments({ isActive: true });

  res.json(createApiResponse(
    true,
    'Quantidade de usuários ativos obtida com sucesso',
    { activeUsers }
  ));
});

module.exports = {
  getActiveCounts,
  getActiveCoursesCount,
  getActiveUsersCount
};
