const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { createApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Matricular em curso completo
 * @route   POST /api/enrollments/full-course
 * @access  Private
 */
const enrollInFullCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user._id;

  // Verificar se o curso existe
  const course = await Course.findById(courseId).populate('instructor', 'name email');

  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  // Verificar se o curso está ativo
  if (course.status !== 'active') {
    return res.status(400).json(createApiResponse(
      false,
      'Este curso não está disponível para matrícula'
    ));
  }

  // Verificar se já está matriculado
  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    enrollmentType: 'full_course',
    status: 'active'
  });

  if (existingEnrollment) {
    return res.status(400).json(createApiResponse(
      false,
      'Você já está matriculado neste curso'
    ));
  }

  // Verificar se o estudante tem créditos suficientes
  const student = await User.findById(studentId);
  
  if (student.credits < course.pricing.fullCourse) {
    return res.status(400).json(createApiResponse(
      false,
      `Créditos insuficientes. Você precisa de ${course.pricing.fullCourse} créditos, mas tem apenas ${student.credits}`
    ));
  }

  // Deduzir créditos
  student.credits -= course.pricing.fullCourse;
  await student.save();

  // Criar registro de pagamento
  const payment = new Payment({
    user: studentId,
    type: 'credit_spent',
    amount: course.pricing.fullCourse,
    credits: course.pricing.fullCourse,
    status: 'completed',
    description: `Matrícula no curso: ${course.title}`,
    metadata: {
      courseId: course._id,
      courseTitle: course.title,
      enrollmentType: 'full_course'
    }
  });

  await payment.save();

  // Criar matrícula
  const enrollment = new Enrollment({
    student: studentId,
    course: courseId,
    enrollmentType: 'full_course',
    pricePaid: course.pricing.fullCourse,
    status: 'active',
    payment: payment._id
  });

  await enrollment.save();

  // Adicionar estudante ao curso
  if (!course.enrolledStudents.includes(studentId)) {
    await course.enrollStudent(studentId);
  }

  // Popular dados para resposta
  await enrollment.populate([
    { path: 'course', select: 'title description instructor image pricing' },
    { path: 'student', select: 'name email avatar' }
  ]);

  res.status(201).json(createApiResponse(
    true,
    'Matrícula realizada com sucesso! Agora você pode agendar aulas a qualquer momento.',
    {
      enrollment,
      remainingCredits: student.credits
    }
  ));
});

/**
 * @desc    Comprar aula avulsa (cria matrícula + agenda aula)
 * @route   POST /api/enrollments/single-class
 * @access  Private
 */
const enrollInSingleClass = asyncHandler(async (req, res) => {
  const { courseId, date, time, duration = 1, notes = '' } = req.body;
  const studentId = req.user._id;

  // Verificar se o curso existe
  const course = await Course.findById(courseId).populate('instructor', 'name email');

  if (!course) {
    return res.status(404).json(createApiResponse(
      false,
      'Curso não encontrado'
    ));
  }

  // Verificar se o estudante tem créditos suficientes
  const student = await User.findById(studentId);
  
  if (student.credits < course.pricing.singleClass) {
    return res.status(400).json(createApiResponse(
      false,
      `Créditos insuficientes. Você precisa de ${course.pricing.singleClass} créditos, mas tem apenas ${student.credits}`
    ));
  }

  // Importar schedulingService para agendar a aula
  const schedulingService = require('../services/schedulingService');

  try {
    // Agendar a aula (isso já valida disponibilidade, deduz créditos, cria Jitsi, etc)
    const scheduledClass = await schedulingService.scheduleClass({
      courseId,
      studentId,
      date,
      time,
      duration,
      notes,
      isSingleClass: true,
      singleClassPrice: course.pricing.singleClass
    });

    // Criar registro de pagamento
    const payment = new Payment({
      user: studentId,
      type: 'credit_spent',
      amount: course.pricing.singleClass,
      credits: course.pricing.singleClass,
      status: 'completed',
      description: `Aula avulsa: ${course.title}`,
      metadata: {
        courseId: course._id,
        courseTitle: course.title,
        enrollmentType: 'single_class',
        classId: scheduledClass._id,
        classDate: date,
        classTime: time
      }
    });

    await payment.save();

    // Criar matrícula de aula avulsa
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      enrollmentType: 'single_class',
      scheduledClass: scheduledClass._id,
      pricePaid: course.pricing.singleClass,
      status: 'active',
      payment: payment._id
    });

    await enrollment.save();

    // Atualizar a aula com a referência do enrollment
    scheduledClass.enrollment = enrollment._id;
    await scheduledClass.save();

    // Popular dados para resposta
    await enrollment.populate([
      { path: 'course', select: 'title description instructor image pricing' },
      { path: 'student', select: 'name email avatar' },
      { path: 'scheduledClass' }
    ]);

    // Atualizar créditos do estudante
    const updatedStudent = await User.findById(studentId);

    res.status(201).json(createApiResponse(
      true,
      'Aula avulsa comprada e agendada com sucesso!',
      {
        enrollment,
        scheduledClass,
        remainingCredits: updatedStudent.credits
      }
    ));

  } catch (error) {
    return res.status(400).json(createApiResponse(
      false,
      error.message || 'Erro ao agendar aula'
    ));
  }
});

/**
 * @desc    Listar matrículas do usuário
 * @route   GET /api/enrollments
 * @access  Private
 */
const getMyEnrollments = asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  const studentId = req.user._id;

  const query = { student: studentId };

  if (type) {
    query.enrollmentType = type;
  }

  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .populate('course', 'title description instructor image pricing rating')
      .populate('scheduledClass', 'date time duration status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Enrollment.countDocuments(query)
  ]);

  res.json(createApiResponse(
    true,
    'Matrículas obtidas com sucesso',
    enrollments,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  ));
});

/**
 * @desc    Obter detalhes de uma matrícula
 * @route   GET /api/enrollments/:id
 * @access  Private
 */
const getEnrollmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findById(id)
    .populate('course', 'title description instructor image pricing rating totalHours')
    .populate('student', 'name email avatar')
    .populate('scheduledClass')
    .lean();

  if (!enrollment) {
    return res.status(404).json(createApiResponse(
      false,
      'Matrícula não encontrada'
    ));
  }

  // Verificar se o usuário tem permissão
  if (enrollment.student._id.toString() !== userId.toString()) {
    return res.status(403).json(createApiResponse(
      false,
      'Acesso negado'
    ));
  }

  // Se for curso completo, buscar aulas agendadas
  if (enrollment.enrollmentType === 'full_course') {
    const ScheduledClass = require('../models/ScheduledClass');
    
    const scheduledClasses = await ScheduledClass.find({
      courseId: enrollment.course._id,
      studentId: enrollment.student._id
    })
      .sort({ date: 1 })
      .lean();

    enrollment.scheduledClasses = scheduledClasses;
  }

  res.json(createApiResponse(
    true,
    'Matrícula obtida com sucesso',
    enrollment
  ));
});

/**
 * @desc    Cancelar matrícula
 * @route   DELETE /api/enrollments/:id
 * @access  Private
 */
const cancelEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const enrollment = await Enrollment.findById(id);

  if (!enrollment) {
    return res.status(404).json(createApiResponse(
      false,
      'Matrícula não encontrada'
    ));
  }

  // Verificar se o usuário tem permissão
  if (enrollment.student.toString() !== userId.toString()) {
    return res.status(403).json(createApiResponse(
      false,
      'Acesso negado'
    ));
  }

  // Verificar se já está cancelada
  if (enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
    return res.status(400).json(createApiResponse(
      false,
      'Esta matrícula já foi cancelada'
    ));
  }

  // Cancelar matrícula (isso cancela as aulas futuras também)
  await enrollment.cancel(reason);

  // Calcular reembolso
  let refundAmount = 0;

  if (enrollment.enrollmentType === 'single_class') {
    // Aula avulsa: reembolso total se cancelar com antecedência
    const ScheduledClass = require('../models/ScheduledClass');
    const scheduledClass = await ScheduledClass.findById(enrollment.scheduledClass);

    if (scheduledClass && scheduledClass.date > new Date()) {
      const hoursUntilClass = (scheduledClass.date - new Date()) / (1000 * 60 * 60);
      
      // Reembolso total se cancelar com mais de 24h de antecedência
      if (hoursUntilClass >= 24) {
        refundAmount = enrollment.pricePaid;
      }
    }
  } else {
    // Curso completo: reembolso proporcional baseado em aulas não realizadas
    const ScheduledClass = require('../models/ScheduledClass');
    
    const completedClasses = await ScheduledClass.countDocuments({
      courseId: enrollment.course,
      studentId: enrollment.student,
      status: 'completed'
    });

    const totalClasses = await ScheduledClass.countDocuments({
      courseId: enrollment.course,
      studentId: enrollment.student
    });

    if (totalClasses > 0) {
      const percentageUsed = completedClasses / totalClasses;
      refundAmount = Math.floor(enrollment.pricePaid * (1 - percentageUsed));
    } else {
      // Se não teve nenhuma aula, reembolso total
      refundAmount = enrollment.pricePaid;
    }
  }

  // Processar reembolso se houver
  if (refundAmount > 0) {
    const student = await User.findById(userId);
    student.credits += refundAmount;
    await student.save();

    // Buscar curso para obter título
    const course = await Course.findById(enrollment.course).select('title').lean();
    const courseTitle = course?.title || 'Curso';

    // Criar registro de pagamento de reembolso
    const refundPayment = new Payment({
      user: userId,
      type: 'refund',
      amount: refundAmount,
      credits: refundAmount,
      status: 'completed',
      description: `Reembolso de matrícula: ${courseTitle}`,
      metadata: {
        enrollmentId: enrollment._id,
        originalPayment: enrollment.payment,
        reason
      }
    });

    await refundPayment.save();

    enrollment.status = 'refunded';
    await enrollment.save();
  }

  res.json(createApiResponse(
    true,
    'Matrícula cancelada com sucesso',
    {
      enrollment,
      refundAmount,
      refunded: refundAmount > 0
    }
  ));
});

/**
 * @desc    Verificar se usuário pode agendar aula em um curso
 * @route   GET /api/enrollments/check/:courseId
 * @access  Private
 */
const checkEnrollmentStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  // Buscar matrícula ativa
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: 'active'
  });

  if (!enrollment) {
    return res.json(createApiResponse(
      true,
      'Usuário não está matriculado',
      {
        enrolled: false,
        canSchedule: false,
        enrollmentType: null
      }
    ));
  }

  const canSchedule = enrollment.canScheduleClass();

  res.json(createApiResponse(
    true,
    'Status de matrícula verificado',
    {
      enrolled: true,
      canSchedule,
      enrollmentType: enrollment.enrollmentType,
      enrollment: {
        _id: enrollment._id,
        enrollmentType: enrollment.enrollmentType,
        status: enrollment.status,
        pricePaid: enrollment.pricePaid,
        progress: enrollment.progress,
        createdAt: enrollment.createdAt
      }
    }
  ));
});

module.exports = {
  enrollInFullCourse,
  enrollInSingleClass,
  getMyEnrollments,
  getEnrollmentById,
  cancelEnrollment,
  checkEnrollmentStatus
};

