const mongoose = require('mongoose');
const InstructorAvailability = require('../models/InstructorAvailability');
const ScheduledClass = require('../models/ScheduledClass');
const Course = require('../models/Course');
const { asyncHandler } = require('../middleware/errorHandler');
const { createApiResponse } = require('../utils/helpers');

/**
 * @desc    Obter ou criar disponibilidade do instrutor
 * @route   GET /api/availability/instructor
 * @access  Private (Instrutor)
 */
const getInstructorAvailability = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { courseId } = req.query;

  let availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  // Se não existir, criar com configuração padrão usando upsert
  if (!availability) {
    availability = await InstructorAvailability.findOneAndUpdate(
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        instructor: instructorId,
        course: courseId || null,
        recurringAvailability: [],
        specificSlots: []
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  res.json(createApiResponse(
    true,
    'Disponibilidade obtida com sucesso',
    availability
  ));
});

/**
 * @desc    Adicionar disponibilidade recorrente
 * @route   POST /api/availability/recurring
 * @access  Private (Instrutor)
 */
const addRecurringAvailability = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { dayOfWeek, startTime, endTime, courseId } = req.body;

  let availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  if (!availability) {
    availability = await InstructorAvailability.findOneAndUpdate(
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  // Validar horários
  if (startTime >= endTime) {
    return res.status(400).json(createApiResponse(
      false,
      'Horário de início deve ser anterior ao horário de término'
    ));
  }

  await availability.addRecurringSlot(dayOfWeek, startTime, endTime);

  res.status(201).json(createApiResponse(
    true,
    'Disponibilidade recorrente adicionada com sucesso',
    availability
  ));
});

/**
 * @desc    Remover disponibilidade recorrente
 * @route   DELETE /api/availability/recurring/:slotId
 * @access  Private (Instrutor)
 */
const removeRecurringAvailability = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { slotId } = req.params;
  const { courseId } = req.query;

  const availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  if (!availability) {
    return res.status(404).json(createApiResponse(false, 'Disponibilidade não encontrada'));
  }

  await availability.removeRecurringSlot(slotId);

  res.json(createApiResponse(
    true,
    'Disponibilidade recorrente removida com sucesso',
    availability
  ));
});

/**
 * @desc    Adicionar slot específico
 * @route   POST /api/availability/specific
 * @access  Private (Instrutor)
 */
const addSpecificSlot = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { date, startTime, endTime, isAvailable, reason, courseId } = req.body;

  let availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  if (!availability) {
    availability = await InstructorAvailability.findOneAndUpdate(
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  // Validar horários
  if (startTime >= endTime) {
    return res.status(400).json(createApiResponse(
      false,
      'Horário de início deve ser anterior ao horário de término'
    ));
  }

  // Validar data (não pode ser no passado)
  const slotDate = new Date(date);
  if (slotDate < new Date()) {
    return res.status(400).json(createApiResponse(
      false,
      'Não é possível adicionar disponibilidade para datas passadas'
    ));
  }

  await availability.addSpecificSlot(date, startTime, endTime, isAvailable, reason);

  res.status(201).json(createApiResponse(
    true,
    'Slot específico adicionado com sucesso',
    availability
  ));
});

/**
 * @desc    Bloquear data específica
 * @route   POST /api/availability/block
 * @access  Private (Instrutor)
 */
const blockDate = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { date, reason, courseId } = req.body;

  let availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  if (!availability) {
    availability = await InstructorAvailability.findOneAndUpdate(
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  await availability.blockDate(date, reason);

  res.status(201).json(createApiResponse(
    true,
    'Data bloqueada com sucesso',
    availability
  ));
});

/**
 * @desc    Obter slots disponíveis para agendamento
 * @route   GET /api/availability/slots
 * @access  Public
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { instructorId, courseId, startDate, endDate } = req.query;

  if (!instructorId) {
    return res.status(400).json(createApiResponse(false, 'ID do instrutor é obrigatório'));
  }

  // Buscar disponibilidade: primeiro específica do curso, depois geral do instrutor
  let availability = null;
  
  // Converter IDs para ObjectId se necessário
  const instructorObjectId = mongoose.Types.ObjectId.isValid(instructorId) 
    ? new mongoose.Types.ObjectId(instructorId) 
    : instructorId;
  const courseObjectId = courseId && mongoose.Types.ObjectId.isValid(courseId)
    ? new mongoose.Types.ObjectId(courseId)
    : courseId;
  
  // Log para debug
  console.log('🔍 Buscando disponibilidade:', {
    instructorId: instructorObjectId.toString(),
    courseId: courseObjectId ? courseObjectId.toString() : 'null',
    startDate,
    endDate
  });
  
  if (courseObjectId) {
    // Tentar buscar disponibilidade específica do curso
    // Primeiro sem verificar isActive
    availability = await InstructorAvailability.findOne({
      instructor: instructorObjectId,
      course: courseObjectId
    });
    
    console.log('🔍 Busca específica do curso:', {
      courseId: courseObjectId.toString(),
      found: !!availability,
      availabilityId: availability?._id?.toString(),
      isActive: availability?.isActive,
      hasRecurring: availability?.recurringAvailability?.length > 0,
      hasSpecific: availability?.specificSlots?.length > 0
    });
  }
  
  // Se não encontrou específica, buscar disponibilidade geral do instrutor
  if (!availability) {
    availability = await InstructorAvailability.findOne({
      instructor: instructorObjectId,
      course: null
    });
    
    console.log('🔍 Busca geral do instrutor:', {
      found: !!availability,
      availabilityId: availability?._id?.toString(),
      isActive: availability?.isActive,
      hasRecurring: availability?.recurringAvailability?.length > 0,
      hasSpecific: availability?.specificSlots?.length > 0
    });
  }

  if (!availability) {
    // Log de todas as disponibilidades do instrutor para debug
    const allAvailabilities = await InstructorAvailability.find({
      instructor: instructorObjectId
    }).select('course isActive recurringAvailability specificSlots').lean();
    
    console.log('🔍 Todas as disponibilidades do instrutor:', {
      instructorId: instructorObjectId.toString(),
      count: allAvailabilities.length,
      availabilities: allAvailabilities.map(av => ({
        id: av._id?.toString(),
        course: av.course?.toString() || 'null',
        isActive: av.isActive,
        recurringCount: av.recurringAvailability?.length || 0,
        specificCount: av.specificSlots?.length || 0
      }))
    });
    
    return res.json(createApiResponse(
      true,
      'Nenhuma disponibilidade configurada',
      { slots: [] }
    ));
  }
  
  // Verificar se está ativa (mas não bloquear se não estiver definido)
  if (availability.isActive === false) {
    console.log('⚠️ Disponibilidade encontrada mas está inativa:', availability._id);
    return res.json(createApiResponse(
      true,
      'Disponibilidade está inativa',
      { slots: [] }
    ));
  }

  // Definir período de busca - normalizar para início e fim do dia
  let start, end;
  
  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Início do dia
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }
  
  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Fim do dia
  } else {
    end = new Date(Date.now() + (availability.maxAdvanceBooking * 24 * 60 * 60 * 1000));
    end.setHours(23, 59, 59, 999);
  }

  // Obter disponibilidade base
  const baseSlots = availability.getAvailabilityForPeriod(start, end);
  
  // Log para debug
  console.log('🔍 getAvailableSlots - Debug:', {
    instructorId,
    courseId: courseId || 'null (geral)',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    availabilityType: availability.course ? 'course-specific' : 'general',
    recurringSlots: availability.recurringAvailability?.length || 0,
    specificSlots: availability.specificSlots?.length || 0,
    baseSlotsFound: baseSlots.length
  });

  // Buscar aulas já agendadas no período
  const scheduledClasses = await ScheduledClass.find({
    instructorId: instructorObjectId,
    status: { $in: ['scheduled', 'in_progress'] },
    date: { $gte: start, $lte: end }
  }).select('date duration');

  // Gerar slots disponíveis considerando aulas agendadas
  const availableSlots = [];
  
  for (const baseSlot of baseSlots) {
    const slotDate = new Date(baseSlot.date);
    const [startHour, startMinute] = baseSlot.startTime.split(':').map(Number);
    const [endHour, endMinute] = baseSlot.endTime.split(':').map(Number);
    
    slotDate.setHours(startHour, startMinute, 0, 0);
    const slotEnd = new Date(slotDate);
    slotEnd.setHours(endHour, endMinute, 0, 0);
    
    // Dividir em slots de acordo com a duração configurada
    let currentSlot = new Date(slotDate);
    
    while (currentSlot < slotEnd) {
      const slotEndTime = new Date(currentSlot.getTime() + (availability.slotDuration * 60 * 60 * 1000));
      
      if (slotEndTime > slotEnd) break;
      
      // Verificar se está no futuro com antecedência mínima
      const now = new Date();
      const minTime = new Date(now.getTime() + (availability.minAdvanceBooking * 60 * 60 * 1000));
      
      if (currentSlot < minTime) {
        currentSlot = slotEndTime;
        if (availability.bufferTime > 0) {
          currentSlot = new Date(currentSlot.getTime() + (availability.bufferTime * 60 * 1000));
        }
        continue;
      }
      
      // Verificar conflito com aulas agendadas
      const hasConflict = scheduledClasses.some(scheduledClass => {
        const classStart = new Date(scheduledClass.date);
        const classEnd = new Date(classStart.getTime() + (scheduledClass.duration * 60 * 60 * 1000));
        
        return (
          (currentSlot >= classStart && currentSlot < classEnd) ||
          (slotEndTime > classStart && slotEndTime <= classEnd) ||
          (currentSlot <= classStart && slotEndTime >= classEnd)
        );
      });
      
      if (!hasConflict) {
        availableSlots.push({
          start: currentSlot.toISOString(),
          end: slotEndTime.toISOString(),
          duration: availability.slotDuration,
          date: currentSlot.toISOString().split('T')[0],
          time: currentSlot.toTimeString().substring(0, 5)
        });
      }
      
      currentSlot = slotEndTime;
      
      // Adicionar buffer time
      if (availability.bufferTime > 0) {
        currentSlot = new Date(currentSlot.getTime() + (availability.bufferTime * 60 * 1000));
      }
    }
  }

  res.json(createApiResponse(
    true,
    'Slots disponíveis obtidos com sucesso',
    {
      instructor: instructorId,
      course: courseId,
      period: { start, end },
      totalSlots: availableSlots.length,
      slots: availableSlots,
      settings: {
        slotDuration: availability.slotDuration,
        minAdvanceBooking: availability.minAdvanceBooking,
        maxAdvanceBooking: availability.maxAdvanceBooking,
        bufferTime: availability.bufferTime
      }
    }
  ));
});

/**
 * @desc    Atualizar configurações de disponibilidade
 * @route   PUT /api/availability/settings
 * @access  Private (Instrutor)
 */
const updateAvailabilitySettings = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const { 
    minAdvanceBooking, 
    maxAdvanceBooking, 
    slotDuration, 
    bufferTime,
    timezone,
    courseId 
  } = req.body;

  let availability = await InstructorAvailability.findOne({
    instructor: instructorId,
    course: courseId || null
  });

  if (!availability) {
    availability = await InstructorAvailability.findOneAndUpdate(
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        instructor: instructorId,
        course: courseId || null
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  // Atualizar campos se fornecidos
  if (minAdvanceBooking !== undefined) availability.minAdvanceBooking = minAdvanceBooking;
  if (maxAdvanceBooking !== undefined) availability.maxAdvanceBooking = maxAdvanceBooking;
  if (slotDuration !== undefined) availability.slotDuration = slotDuration;
  if (bufferTime !== undefined) availability.bufferTime = bufferTime;
  if (timezone !== undefined) availability.timezone = timezone;

  await availability.save();

  res.json(createApiResponse(
    true,
    'Configurações atualizadas com sucesso',
    availability
  ));
});

/**
 * @desc    Obter disponibilidade de um curso específico
 * @route   GET /api/availability/course/:courseId
 * @access  Public
 */
const getCourseAvailability = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { startDate, endDate } = req.query;

  const course = await Course.findById(courseId).select('instructor');
  
  if (!course) {
    return res.status(404).json(createApiResponse(false, 'Curso não encontrado'));
  }

  // Redirecionar para getAvailableSlots com o instrutor do curso
  req.query.instructorId = course.instructor;
  req.query.courseId = courseId;
  
  return getAvailableSlots(req, res);
});

module.exports = {
  getInstructorAvailability,
  addRecurringAvailability,
  removeRecurringAvailability,
  addSpecificSlot,
  blockDate,
  getAvailableSlots,
  updateAvailabilitySettings,
  getCourseAvailability
};

