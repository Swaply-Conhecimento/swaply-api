const ScheduledClass = require('../models/ScheduledClass');
const Course = require('../models/Course');
const User = require('../models/User');
const schedulingService = require('../services/schedulingService');
const { validationResult } = require('express-validator');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /classes/schedule
 * Agendar uma nova aula
 */
const scheduleClass = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(createApiResponse(
      false,
      'Dados inválidos',
      null,
      null,
      errors.array()
    ));
  }

  const { courseId, date, duration = 1, notes = '' } = req.body;
  const studentId = req.user._id;

  try {
    const scheduledClass = await schedulingService.scheduleClass({
      courseId,
      studentId,
      date,
      duration,
      notes
    });

    res.status(201).json(createApiResponse(
      true,
      'Aula agendada com sucesso',
      scheduledClass
    ));
  } catch (error) {
    const statusCode = error.message.includes('não encontrado') ? 404 :
                       error.message.includes('créditos') || 
                       error.message.includes('matriculado') ||
                       error.message.includes('disponível') ||
                       error.message.includes('antecedência') ||
                       error.message.includes('limite') ? 400 : 500;

    return res.status(statusCode).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * GET /classes/scheduled
 * Listar aulas agendadas do usuário
 */
const getScheduledClasses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    courseId
  } = req.query;

  try {
    const result = await schedulingService.getUserScheduledClasses(userId, {
      page,
      limit,
      status,
      startDate,
      endDate,
      courseId
    });

    res.json(createApiResponse(
      true,
      'Aulas agendadas obtidas com sucesso',
      result.classes,
      result.pagination
    ));
  } catch (error) {
    return res.status(500).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * GET /classes/:id
 * Obter detalhes de uma aula específica
 */
const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const scheduledClass = await ScheduledClass.findById(id)
    .populate('courseId', 'title description image pricePerHour')
    .populate('studentId', 'name email avatar')
    .populate('instructorId', 'name email avatar bio');

  if (!scheduledClass) {
    return res.status(404).json(createApiResponse(
      false,
      'Aula não encontrada'
    ));
  }

  // Verificar permissão (estudante ou instrutor)
  const isStudent = scheduledClass.studentId._id.toString() === userId.toString();
  const isInstructor = scheduledClass.instructorId._id.toString() === userId.toString();

  if (!isStudent && !isInstructor) {
    return res.status(403).json(createApiResponse(
      false,
      'Você não tem permissão para visualizar esta aula'
    ));
  }

  res.json(createApiResponse(
    true,
    'Detalhes da aula obtidos com sucesso',
    scheduledClass
  ));
});

/**
 * DELETE /classes/:id/cancel ou PUT /classes/:id/cancel
 * Cancelar uma aula agendada
 */
const cancelClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = '' } = req.body;
  const userId = req.user._id;

  try {
    const result = await schedulingService.cancelClass(id, userId, reason);

    res.json(createApiResponse(
      true,
      'Aula cancelada com sucesso',
      {
        status: result.class.status,
        refunded: result.refunded,
        creditsRefunded: result.refundAmount
      }
    ));
  } catch (error) {
    const statusCode = error.message.includes('não encontrada') ? 404 :
                       error.message.includes('permissão') ? 403 :
                       error.message.includes('cancelada') || 
                       error.message.includes('concluída') ? 400 : 500;

    return res.status(statusCode).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * GET /courses/:id/availability
 * Obter horários disponíveis de um curso/instrutor
 */
const getCourseAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json(createApiResponse(
      false,
      'startDate e endDate são obrigatórios'
    ));
  }

  try {
    const availability = await schedulingService.getCourseAvailability(
      id,
      startDate,
      endDate
    );

    res.json(createApiResponse(
      true,
      'Disponibilidade obtida com sucesso',
      { availability }
    ));
  } catch (error) {
    const statusCode = error.message.includes('não encontrado') ? 404 : 500;
    return res.status(statusCode).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * PUT /classes/:id/complete
 * Marcar aula como concluída (apenas instrutor)
 */
const completeClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const scheduledClass = await ScheduledClass.findById(id);

  if (!scheduledClass) {
    return res.status(404).json(createApiResponse(
      false,
      'Aula não encontrada'
    ));
  }

  // Verificar se é o instrutor
  if (scheduledClass.instructorId.toString() !== userId.toString()) {
    return res.status(403).json(createApiResponse(
      false,
      'Apenas o instrutor pode marcar a aula como concluída'
    ));
  }

  try {
    await scheduledClass.complete();

    res.json(createApiResponse(
      true,
      'Aula marcada como concluída',
      scheduledClass
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * POST /classes/:id/attendance
 * Marcar presença em uma aula
 */
const markAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const scheduledClass = await ScheduledClass.findById(id);

  if (!scheduledClass) {
    return res.status(404).json(createApiResponse(
      false,
      'Aula não encontrada'
    ));
  }

  // Determinar o papel do usuário
  let role;
  if (scheduledClass.studentId.toString() === userId.toString()) {
    role = 'student';
  } else if (scheduledClass.instructorId.toString() === userId.toString()) {
    role = 'instructor';
  } else {
    return res.status(403).json(createApiResponse(
      false,
      'Você não está relacionado a esta aula'
    ));
  }

  try {
    await scheduledClass.markAttendance(userId, role);

    res.json(createApiResponse(
      true,
      'Presença registrada',
      {
        attendance: scheduledClass.attendance,
        status: scheduledClass.status
      }
    ));
  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message
    ));
  }
});

/**
 * PUT /classes/:id/rating
 * Avaliar uma aula (apenas estudante, após conclusão)
 */
const rateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json(createApiResponse(
      false,
      'Avaliação deve ser entre 1 e 5'
    ));
  }

  const scheduledClass = await ScheduledClass.findById(id);

  if (!scheduledClass) {
    return res.status(404).json(createApiResponse(
      false,
      'Aula não encontrada'
    ));
  }

  // Verificar se é o estudante
  if (scheduledClass.studentId.toString() !== userId.toString()) {
    return res.status(403).json(createApiResponse(
      false,
      'Apenas o estudante pode avaliar a aula'
    ));
  }

  // Verificar se a aula foi concluída
  if (scheduledClass.status !== 'completed') {
    return res.status(400).json(createApiResponse(
      false,
      'Apenas aulas concluídas podem ser avaliadas'
    ));
  }

  scheduledClass.rating = rating;
  if (feedback) {
    scheduledClass.feedback = feedback;
  }

  await scheduledClass.save();

  res.json(createApiResponse(
    true,
    'Avaliação registrada com sucesso',
    {
      rating: scheduledClass.rating,
      feedback: scheduledClass.feedback
    }
  ));
});

/**
 * GET /classes/upcoming
 * Obter próximas aulas do usuário
 */
const getUpcomingClasses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 5 } = req.query;

  const now = new Date();

  const classes = await ScheduledClass.find({
    $or: [
      { studentId: userId },
      { instructorId: userId }
    ],
    status: 'scheduled',
    date: { $gte: now }
  })
    .populate('courseId', 'title image')
    .populate('instructorId', 'name avatar')
    .populate('studentId', 'name avatar')
    .sort({ date: 1 })
    .limit(parseInt(limit))
    .lean();

  res.json(createApiResponse(
    true,
    'Próximas aulas obtidas com sucesso',
    classes
  ));
});

/**
 * GET /classes/history
 * Obter histórico de aulas do usuário
 */
const getClassHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const now = new Date();

  const query = {
    $or: [
      { studentId: userId },
      { instructorId: userId }
    ],
    status: { $in: ['completed', 'cancelled', 'missed'] }
  };

  const total = await ScheduledClass.countDocuments(query);

  const classes = await ScheduledClass.find(query)
    .populate('courseId', 'title image')
    .populate('instructorId', 'name avatar')
    .populate('studentId', 'name avatar')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  res.json(createApiResponse(
    true,
    'Histórico de aulas obtido com sucesso',
    classes,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  ));
});

module.exports = {
  scheduleClass,
  getScheduledClasses,
  getClassById,
  cancelClass,
  getCourseAvailability,
  completeClass,
  markAttendance,
  rateClass,
  getUpcomingClasses,
  getClassHistory
};
