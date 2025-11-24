const ScheduledClass = require('../models/ScheduledClass');
const Course = require('../models/Course');
const User = require('../models/User');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class SchedulingService {
  /**
   * Agendar uma nova aula
   */
  async scheduleClass({ courseId, studentId, date, duration = 1, notes = '' }) {
    // Validar curso
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email');
    
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    if (course.status !== 'active') {
      throw new Error('Este curso não está ativo');
    }

    // Validar estudante
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Estudante não encontrado');
    }

    // Verificar se está matriculado
    if (!course.enrolledStudents.includes(studentId)) {
      throw new Error('Você deve estar matriculado no curso para agendar uma aula');
    }

    // Verificar créditos
    const creditsNeeded = Math.ceil(duration * course.pricePerHour);
    if (student.credits < creditsNeeded) {
      throw new Error(`Créditos insuficientes. Necessário: ${creditsNeeded}, disponível: ${student.credits}`);
    }

    // Validar data (mínimo 2 horas de antecedência)
    const classDate = new Date(date);
    const now = new Date();
    const minAdvanceTime = 2 * 60 * 60 * 1000; // 2 horas em ms

    if (classDate.getTime() - now.getTime() < minAdvanceTime) {
      throw new Error('Aulas devem ser agendadas com pelo menos 2 horas de antecedência');
    }

    // Verificar conflito de horário do instrutor
    const hasConflict = await ScheduledClass.checkConflict(
      course.instructor._id,
      classDate,
      duration
    );

    if (hasConflict) {
      throw new Error('Este horário não está disponível');
    }

    // Verificar limite de aulas por dia do estudante
    const dayStart = new Date(classDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(classDate);
    dayEnd.setHours(23, 59, 59, 999);

    const classesToday = await ScheduledClass.countDocuments({
      studentId,
      status: { $in: ['scheduled', 'in_progress'] },
      date: {
        $gte: dayStart,
        $lte: dayEnd
      }
    });

    const maxClassesPerDay = process.env.MAX_CLASSES_PER_DAY || 5;
    if (classesToday >= maxClassesPerDay) {
      throw new Error(`Você atingiu o limite de ${maxClassesPerDay} aulas por dia`);
    }

    // Criar aula agendada
    const scheduledClass = new ScheduledClass({
      courseId,
      studentId,
      instructorId: course.instructor._id,
      date: classDate,
      duration,
      creditsSpent: creditsNeeded,
      notes
    });

    await scheduledClass.save();

    // Deduzir créditos do estudante
    student.credits -= creditsNeeded;
    await student.save();

    // Popular dados para retorno
    await scheduledClass.populate([
      { path: 'courseId', select: 'title image pricePerHour' },
      { path: 'studentId', select: 'name email avatar' },
      { path: 'instructorId', select: 'name email avatar' }
    ]);

    // Enviar notificações
    await this.sendSchedulingNotifications(scheduledClass, course, student);

    return scheduledClass;
  }

  /**
   * Cancelar aula agendada
   */
  async cancelClass(classId, userId, reason = '') {
    const scheduledClass = await ScheduledClass.findById(classId)
      .populate('courseId', 'title')
      .populate('studentId', 'name email credits')
      .populate('instructorId', 'name email');

    if (!scheduledClass) {
      throw new Error('Aula não encontrada');
    }

    // Verificar permissão
    const isStudent = scheduledClass.studentId._id.toString() === userId.toString();
    const isInstructor = scheduledClass.instructorId._id.toString() === userId.toString();

    if (!isStudent && !isInstructor) {
      throw new Error('Você não tem permissão para cancelar esta aula');
    }

    // Cancelar e obter valor do reembolso
    const refundAmount = await scheduledClass.cancel(userId, reason);

    // Reembolsar créditos ao estudante
    if (refundAmount > 0) {
      scheduledClass.studentId.credits += refundAmount;
      await scheduledClass.studentId.save();
    }

    // Enviar notificações de cancelamento
    await this.sendCancellationNotifications(scheduledClass, isInstructor, refundAmount);

    return {
      class: scheduledClass,
      refunded: scheduledClass.refunded,
      refundAmount: refundAmount
    };
  }

  /**
   * Obter aulas agendadas de um usuário
   */
  async getUserScheduledClasses(userId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      courseId
    } = filters;

    const query = {
      $or: [
        { studentId: userId },
        { instructorId: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const total = await ScheduledClass.countDocuments(query);

    const classes = await ScheduledClass.find(query)
      .populate('courseId', 'title image pricePerHour instructor')
      .populate('studentId', 'name email avatar')
      .populate('instructorId', 'name email avatar')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    return {
      classes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obter disponibilidade de um instrutor
   */
  async getInstructorAvailability(instructorId, startDate, endDate) {
    // Verificar se é instrutor
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      throw new Error('Instrutor não encontrado');
    }

    // Obter aulas já agendadas no período
    const scheduledClasses = await ScheduledClass.find({
      instructorId,
      status: { $in: ['scheduled', 'in_progress'] },
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).select('date duration');

    // Criar mapa de slots ocupados
    const occupiedSlots = new Map();
    scheduledClasses.forEach(classItem => {
      const date = classItem.date.toISOString().split('T')[0];
      const time = classItem.date.toTimeString().substring(0, 5);
      
      if (!occupiedSlots.has(date)) {
        occupiedSlots.set(date, []);
      }
      occupiedSlots.get(date).push(time);
    });

    // Gerar slots disponíveis (exemplo: 9h às 18h, de hora em hora)
    const availability = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();

      // Pular finais de semana (opcional)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const slots = [];
        
        // Horários disponíveis: 9h às 18h
        for (let hour = 9; hour < 18; hour++) {
          const time = `${hour.toString().padStart(2, '0')}:00`;
          const occupied = occupiedSlots.has(dateStr) && 
                          occupiedSlots.get(dateStr).includes(time);
          
          slots.push({
            time,
            available: !occupied,
            duration: 1
          });
        }

        availability.push({
          date: dateStr,
          slots
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return availability;
  }

  /**
   * Obter disponibilidade de um curso
   */
  async getCourseAvailability(courseId, startDate, endDate) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    return await this.getInstructorAvailability(course.instructor, startDate, endDate);
  }

  /**
   * Obter calendário de um usuário
   */
  async getUserCalendar(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const classes = await ScheduledClass.find({
      $or: [
        { studentId: userId },
        { instructorId: userId }
      ],
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('courseId', 'title')
      .populate('instructorId', 'name avatar')
      .populate('studentId', 'name avatar')
      .lean();

    // Formatar eventos para o calendário
    const events = classes.map(classItem => ({
      id: classItem._id,
      type: 'scheduled_class',
      title: classItem.courseId.title,
      course: classItem.courseId,
      instructor: classItem.instructorId,
      student: classItem.studentId,
      date: classItem.date.toISOString().split('T')[0],
      startTime: classItem.date.toTimeString().substring(0, 5),
      endTime: new Date(classItem.date.getTime() + (classItem.duration * 60 * 60 * 1000))
        .toTimeString().substring(0, 5),
      status: classItem.status,
      duration: classItem.duration
    }));

    // Calcular estatísticas
    const summary = {
      totalClasses: classes.length,
      completedClasses: classes.filter(c => c.status === 'completed').length,
      upcomingClasses: classes.filter(c => c.status === 'scheduled' && new Date(c.date) > new Date()).length,
      cancelledClasses: classes.filter(c => c.status === 'cancelled').length
    };

    return { events, summary };
  }

  /**
   * Obter calendário público de um instrutor
   */
  async getInstructorCalendar(instructorId, month, year) {
    const instructor = await User.findById(instructorId);
    if (!instructor || !instructor.isInstructor) {
      throw new Error('Instrutor não encontrado');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const availability = await this.getInstructorAvailability(
      instructorId,
      startDate,
      endDate
    );

    return {
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        avatar: instructor.avatar,
        bio: instructor.bio
      },
      availability
    };
  }

  /**
   * Enviar notificações de agendamento
   */
  async sendSchedulingNotifications(scheduledClass, course, student) {
    try {
      // Notificação para o estudante
      await notificationService.createNotification({
        userId: scheduledClass.studentId._id,
        type: 'class_scheduled',
        title: 'Aula agendada com sucesso',
        message: `Sua aula de ${course.title} foi agendada para ${this.formatDate(scheduledClass.date)}`,
        data: {
          classId: scheduledClass._id,
          courseId: course._id,
          date: scheduledClass.date
        }
      });

      // Notificação para o instrutor
      await notificationService.createNotification({
        userId: scheduledClass.instructorId._id,
        type: 'new_student',
        title: 'Nova aula agendada',
        message: `${student.name} agendou uma aula para ${this.formatDate(scheduledClass.date)}`,
        data: {
          classId: scheduledClass._id,
          studentId: student._id,
          date: scheduledClass.date
        }
      });

      // Emails
      await emailService.sendClassScheduledEmail({
        to: scheduledClass.studentId.email,
        studentName: student.name,
        courseTitle: course.title,
        instructorName: scheduledClass.instructorId.name,
        date: scheduledClass.date,
        duration: scheduledClass.duration
      });

      await emailService.sendInstructorClassNotification({
        to: scheduledClass.instructorId.email,
        instructorName: scheduledClass.instructorId.name,
        studentName: student.name,
        courseTitle: course.title,
        date: scheduledClass.date,
        duration: scheduledClass.duration
      });
    } catch (error) {
      // Erro ao enviar notificações de agendamento - silencioso
    }
  }

  /**
   * Enviar notificações de cancelamento
   */
  async sendCancellationNotifications(scheduledClass, cancelledByInstructor, refundAmount) {
    try {
      const notifyStudent = {
        userId: scheduledClass.studentId._id,
        type: 'class_cancelled',
        title: 'Aula cancelada',
        message: `A aula de ${scheduledClass.courseId.title} do dia ${this.formatDate(scheduledClass.date)} foi cancelada`,
        data: {
          classId: scheduledClass._id,
          refunded: scheduledClass.refunded,
          refundAmount,
          reason: scheduledClass.cancelReason
        }
      };

      const notifyInstructor = {
        userId: scheduledClass.instructorId._id,
        type: 'class_cancelled',
        title: 'Aula cancelada',
        message: `A aula com ${scheduledClass.studentId.name} do dia ${this.formatDate(scheduledClass.date)} foi cancelada`,
        data: {
          classId: scheduledClass._id,
          reason: scheduledClass.cancelReason
        }
      };

      // Notificar ambas as partes
      await notificationService.createNotification(notifyStudent);
      await notificationService.createNotification(notifyInstructor);

      // Email para o estudante
      await emailService.sendClassCancelledEmail({
        to: scheduledClass.studentId.email,
        studentName: scheduledClass.studentId.name,
        courseTitle: scheduledClass.courseId.title,
        date: scheduledClass.date,
        refunded: scheduledClass.refunded,
        refundAmount,
        reason: scheduledClass.cancelReason
      });

      // Email para o instrutor
      await emailService.sendInstructorCancellationNotification({
        to: scheduledClass.instructorId.email,
        instructorName: scheduledClass.instructorId.name,
        studentName: scheduledClass.studentId.name,
        courseTitle: scheduledClass.courseId.title,
        date: scheduledClass.date
      });
    } catch (error) {
      // Erro ao enviar notificações de cancelamento - silencioso
    }
  }

  /**
   * Enviar lembretes de aulas próximas
   */
  async sendClassReminders(minutesAhead = 60) {
    try {
      const upcomingClasses = await ScheduledClass.getUpcomingClasses(minutesAhead);

      for (const classItem of upcomingClasses) {
        const timeUntil = Math.floor((new Date(classItem.date) - new Date()) / (60 * 1000));

        // Verificar se o estudante quer receber notificações
        if (classItem.studentId.settings?.notifications?.classNotifications !== false) {
          // Notificação para o estudante
          await notificationService.createNotification({
            userId: classItem.studentId._id,
            type: 'class_reminder',
            title: `Aula em ${timeUntil} minutos`,
            message: `Sua aula de ${classItem.courseId.title} começa em ${timeUntil} minutos`,
            data: {
              classId: classItem._id,
              courseId: classItem.courseId._id
            }
          });

          // Email de lembrete
          await emailService.sendClassReminderEmail({
            to: classItem.studentId.email,
            studentName: classItem.studentId.name,
            courseTitle: classItem.courseId.title,
            date: classItem.date,
            minutesUntil: timeUntil
          });
        }

        // Notificação para o instrutor
        await notificationService.createNotification({
          userId: classItem.instructorId._id,
          type: 'class_reminder',
          title: `Aula em ${timeUntil} minutos`,
          message: `Sua aula com ${classItem.studentId.name} começa em ${timeUntil} minutos`,
          data: {
            classId: classItem._id,
            studentId: classItem.studentId._id
          }
        });

        // Email de lembrete para o instrutor
        await emailService.sendInstructorReminderEmail({
          to: classItem.instructorId.email,
          instructorName: classItem.instructorId.name,
          studentName: classItem.studentId.name,
          courseTitle: classItem.courseId.title,
          date: classItem.date,
          minutesUntil: timeUntil
        });
      }

      return upcomingClasses.length;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Formatar data para exibição
   */
  formatDate(date) {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

module.exports = new SchedulingService();
