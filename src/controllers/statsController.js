const Course = require('../models/Course');
const User = require('../models/User');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/stats
const getActiveCounts = asyncHandler(async (req, res) => {
  const activeCourses = await Course.countDocuments({ status: 'active' });
  const activeUsers = await User.countDocuments({ isActive: true });

  res.json(createApiResponse(
    true,
    'Contagens obtidas com sucesso',
    { activeCourses, activeUsers }
  ));
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
