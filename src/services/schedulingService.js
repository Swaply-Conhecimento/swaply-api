const ScheduledClass = require('../models/ScheduledClass');
const Course = require('../models/Course');
const User = require('../models/User');
const { jitsiService } = require('./jitsiService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const { paymentService } = require('./paymentService');

class SchedulingService {
  /**
   * Agendar uma nova aula
   */
  async scheduleClass({ courseId, studentId, date, time, duration = 1, notes = '', isSingleClass = false, singleClassPrice = null }) {
    // Validar curso
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email avatar');
    
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

    // Para aulas avulsas, não precisa estar matriculado
    // Para curso completo, precisa estar matriculado
    if (!isSingleClass && !course.enrolledStudents.includes(studentId)) {
      throw new Error('Você deve estar matriculado no curso para agendar uma aula');
    }

    // Verificar créditos
    let creditsNeeded;
    if (isSingleClass && singleClassPrice) {
      // Aula avulsa: usa o preço fixo
      creditsNeeded = singleClassPrice;
    } else {
      // Curso completo: calcula baseado na duração
      creditsNeeded = Math.ceil(duration * course.pricePerHour);
    }

    if (student.credits < creditsNeeded) {
      throw new Error(`Créditos insuficientes. Necessário: ${creditsNeeded}, disponível: ${student.credits}`);
    }

    // Validar data e hora (mínimo 2 horas de antecedência)
    const [hours, minutes] = time.split(':');
    
    // Construir data/hora corretamente
    // Se date vier como string "YYYY-MM-DD", criar Date corretamente
    let classDateTime;
    if (typeof date === 'string') {
      // Se for formato ISO ou YYYY-MM-DD
      if (date.includes('T')) {
        classDateTime = new Date(date);
      } else {
        // Formato YYYY-MM-DD - criar data e depois setar hora
        classDateTime = new Date(date + 'T00:00:00');
        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    } else {
      classDateTime = new Date(date);
      classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    const now = new Date();
    const minAdvanceTime = 2 * 60 * 60 * 1000; // 2 horas em ms

    if (classDateTime.getTime() - now.getTime() < minAdvanceTime) {
      throw new Error('Aulas devem ser agendadas com pelo menos 2 horas de antecedência');
    }

    // Verificar conflito de horário do instrutor
    const hasConflict = await ScheduledClass.checkConflict(
      course.instructor._id,
      classDateTime,
      duration
    );

    if (hasConflict) {
      throw new Error('Este horário não está disponível');
    }

    // Verificar limite de aulas por dia do estudante
    const dayStart = new Date(classDateTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(classDateTime);
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

    // Deduzir créditos ANTES de criar a aula (para evitar criar aula se falhar)
    await paymentService.spendCredits(
      studentId,
      creditsNeeded,
      `Aula agendada: ${course.title}`,
      courseId,
      null // classId será atualizado depois
    );

    // Criar sala Jitsi para a aula
    const jitsiMeeting = await jitsiService.createClassMeeting(
      { date: classDateTime, time, duration },
      course.instructor,
      course,
      student
    );

    // Criar aula agendada
    const scheduledClass = new ScheduledClass({
      courseId,
      studentId,
      instructorId: course.instructor._id,
      date: classDateTime,
      duration,
      creditsSpent: creditsNeeded,
      notes,
      jitsiRoomName: jitsiMeeting.data.roomName,
      jitsiInstructorUrl: jitsiMeeting.data.instructorUrl,
      jitsiStudentUrl: jitsiMeeting.data.studentUrl,
      jitsiInstructorToken: jitsiMeeting.data.instructorToken,
      jitsiStudentToken: jitsiMeeting.data.studentToken
    });

    await scheduledClass.save();
    
    // Atualizar o payment com o classId (se necessário)
    // O paymentService já criou o payment, mas podemos atualizar se precisar

    // Popular dados para retorno
    await scheduledClass.populate([
      { path: 'courseId', select: 'title image pricePerHour' },
      { path: 'studentId', select: 'name email avatar' },
      { path: 'instructorId', select: 'name email avatar' }
    ]);

    // Enviar notificações e emails
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

    // Cancelar aula e calcular reembolso
    const refundAmount = await scheduledClass.cancel(userId, reason);

    // Processar reembolso se houver
    if (refundAmount > 0) {
      await paymentService.earnCredits(
        scheduledClass.studentId._id,
        refundAmount,
        `Reembolso: ${scheduledClass.courseId.title}`,
        scheduledClass.courseId._id,
        scheduledClass._id
      );
    }

    // Enviar notificações
    await this.sendCancellationNotifications(scheduledClass, isInstructor, reason, refundAmount);

    return {
      scheduledClass,
      refundAmount
    };
  }

  /**
   * Obter aulas agendadas do usuário
   */
  async getUserScheduledClasses(userId, filters = {}) {
    const {
      role = 'student', // 'student' ou 'instructor'
      status,
      courseId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = filters;

    const query = {
      [role === 'student' ? 'studentId' : 'instructorId']: userId
    };

    if (status) {
      query.status = status;
    }

    if (courseId) {
      query.courseId = courseId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
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
   * Obter disponibilidade do instrutor
   */
  async getInstructorAvailability(instructorId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Buscar todas as aulas agendadas no período
    const scheduledClasses = await ScheduledClass.find({
      instructorId,
      status: { $in: ['scheduled', 'in_progress'] },
      date: {
        $gte: start,
        $lte: end
      }
    }).select('date duration').lean();

    // Converter para slots ocupados
    const busySlots = scheduledClasses.map(classItem => {
      const startTime = new Date(classItem.date);
      const endTime = new Date(startTime.getTime() + (classItem.duration * 60 * 60 * 1000));
      
      return {
        start: startTime,
        end: endTime
      };
    });

    return {
      instructorId,
      period: { start, end },
      busySlots,
      availableSlots: this.calculateAvailableSlots(start, end, busySlots)
    };
  }

  /**
   * Calcular slots disponíveis
   */
  calculateAvailableSlots(startDate, endDate, busySlots) {
    const availableSlots = [];
    const workingHours = {
      start: 8, // 8h
      end: 22   // 22h
    };

    let currentDate = new Date(startDate);
    currentDate.setHours(workingHours.start, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(workingHours.end, 0, 0, 0);

      // Verificar cada hora do dia
      while (currentDate < dayEnd) {
        const slotEnd = new Date(currentDate.getTime() + (60 * 60 * 1000)); // 1 hora

        // Verificar se o slot está livre
        const isBusy = busySlots.some(busy => {
          return (currentDate >= busy.start && currentDate < busy.end) ||
                 (slotEnd > busy.start && slotEnd <= busy.end) ||
                 (currentDate <= busy.start && slotEnd >= busy.end);
        });

        if (!isBusy && currentDate > new Date()) {
          availableSlots.push({
            start: new Date(currentDate),
            end: new Date(slotEnd)
          });
        }

        currentDate = slotEnd;
      }

      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(workingHours.start, 0, 0, 0);
    }

    return availableSlots;
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
   * Obter próximas aulas (para dashboard)
   */
  async getUpcomingClasses(userId, role = 'student', limit = 5) {
    const query = {
      [role === 'student' ? 'studentId' : 'instructorId']: userId,
      status: { $in: ['scheduled', 'in_progress'] },
      date: { $gte: new Date() }
    };

    const classes = await ScheduledClass.find(query)
      .populate('courseId', 'title image')
      .populate('studentId', 'name avatar')
      .populate('instructorId', 'name avatar')
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    return classes.map(classItem => ({
      ...classItem,
      title: classItem.courseId.title,
      course: classItem.courseId,
      student: classItem.studentId,
      instructor: classItem.instructorId,
      canJoin: this.canJoinClass(classItem),
      minutesUntil: this.getMinutesUntilClass(classItem.date)
    }));
  }

  /**
   * Verificar se pode entrar na aula
   */
  canJoinClass(classItem) {
    const now = new Date();
    const classStart = new Date(classItem.date);
    const classEnd = new Date(classStart.getTime() + (classItem.duration * 60 * 60 * 1000));
    
    // Pode entrar 15 minutos antes e até 15 minutos depois do fim
    const allowedStart = new Date(classStart.getTime() - (15 * 60 * 1000));
    const allowedEnd = new Date(classEnd.getTime() + (15 * 60 * 1000));
    
    return now >= allowedStart && now <= allowedEnd && classItem.status !== 'cancelled';
  }

  /**
   * Obter minutos até a aula
   */
  getMinutesUntilClass(classDate) {
    const now = new Date();
    const diffMs = new Date(classDate) - now;
    return Math.floor(diffMs / (60 * 1000));
  }

  /**
   * Obter link de acesso à aula
   */
  async getClassAccessLink(classId, userId) {
    const scheduledClass = await ScheduledClass.findById(classId)
      .populate('studentId', 'name')
      .populate('instructorId', 'name');

    if (!scheduledClass) {
      throw new Error('Aula não encontrada');
    }

    // Verificar se o usuário tem permissão
    const isStudent = scheduledClass.studentId._id.toString() === userId.toString();
    const isInstructor = scheduledClass.instructorId._id.toString() === userId.toString();

    if (!isStudent && !isInstructor) {
      throw new Error('Você não tem permissão para acessar esta aula');
    }

    // Verificar se pode entrar
    if (!this.canJoinClass(scheduledClass)) {
      throw new Error('Esta aula ainda não está disponível para acesso');
    }

    // Retornar link apropriado
    return {
      roomName: scheduledClass.jitsiRoomName,
      accessUrl: isInstructor ? scheduledClass.jitsiInstructorUrl : scheduledClass.jitsiStudentUrl,
      token: isInstructor ? scheduledClass.jitsiInstructorToken : scheduledClass.jitsiStudentToken,
      role: isInstructor ? 'instructor' : 'student',
      classInfo: {
        title: scheduledClass.courseId?.title,
        date: scheduledClass.date,
        duration: scheduledClass.duration
      }
    };
  }

  /**
   * Marcar presença na aula
   */
  async markAttendance(classId, userId, role) {
    const scheduledClass = await ScheduledClass.findById(classId);

    if (!scheduledClass) {
      throw new Error('Aula não encontrada');
    }

    await scheduledClass.markAttendance(userId, role);

    return scheduledClass;
  }

  /**
   * Completar aula
   */
  async completeClass(classId, userId) {
    const scheduledClass = await ScheduledClass.findById(classId)
      .populate('instructorId', 'name')
      .populate('studentId', 'name');

    if (!scheduledClass) {
      throw new Error('Aula não encontrada');
    }

    // Apenas o instrutor pode marcar como concluída
    if (scheduledClass.instructorId._id.toString() !== userId.toString()) {
      throw new Error('Apenas o instrutor pode marcar a aula como concluída');
    }

    await scheduledClass.complete();

    // Transferir créditos para o instrutor
    await paymentService.earnCredits(
      scheduledClass.instructorId._id,
      scheduledClass.creditsSpent,
      `Aula concluída`,
      scheduledClass.courseId,
      scheduledClass._id
    );

    return scheduledClass;
  }

  /**
   * Enviar notificações de agendamento
   */
  async sendSchedulingNotifications(scheduledClass, course, student) {
    const classDate = new Date(scheduledClass.date);
    const formattedDate = classDate.toLocaleDateString('pt-BR');
    const formattedTime = classDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Notificação para o estudante
    await notificationService.createClassScheduled(
      student._id,
      course.title,
      formattedDate,
      formattedTime
    );

    // Notificação para o instrutor
    await notificationService.createNewStudent(
      course.instructor._id,
      student.name,
      course.title
    );

    try {
      // Email para o estudante
      await emailService.sendClassScheduledEmail(
        student.email,
        {
          studentName: student.name,
          courseTitle: course.title,
          instructorName: course.instructor.name,
          classDate: formattedDate,
          classTime: formattedTime,
          duration: scheduledClass.duration,
          creditsSpent: scheduledClass.creditsSpent,
          jitsiUrl: scheduledClass.jitsiStudentUrl
        }
      );

      // Email para o instrutor
      await emailService.sendNewClassNotificationEmail(
        course.instructor.email,
        {
          instructorName: course.instructor.name,
          studentName: student.name,
          courseTitle: course.title,
          classDate: formattedDate,
          classTime: formattedTime,
          duration: scheduledClass.duration,
          jitsiUrl: scheduledClass.jitsiInstructorUrl
        }
      );

      // Notificação para incentivar avaliação do curso/instrutor após a aula
      try {
        await notificationService.createSystemNotification(
          student._id,
          'Avalie seu curso',
          `Depois de concluir sua aula de ${course.title}, avalie o curso e o instrutor.`,
          {
            courseId: course._id.toString(),
            url: `/courses/${course._id}?review=1`,
            action: 'review_course'
          }
        );
      } catch (notificationError) {
        // Erro ao criar notificação de avaliação - silencioso
      }

      // E-mail opcional para lembrar da avaliação do curso/instrutor
      try {
        await emailService.sendCourseReviewRequestEmail({
          to: student.email,
          studentName: student.name,
          courseTitle: course.title,
          instructorName: course.instructor.name,
          courseId: course._id
        });
      } catch (reviewEmailError) {
        // Erro ao enviar email de avaliação - silencioso
      }
    } catch (error) {
      // Erro ao enviar notificações de agendamento - silencioso
    }
  }

  /**
   * Enviar notificações de cancelamento
   */
  async sendCancellationNotifications(scheduledClass, cancelledByInstructor, reason, refundAmount) {
    const classDate = new Date(scheduledClass.date);
    const formattedDate = classDate.toLocaleDateString('pt-BR');
    const formattedTime = classDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (cancelledByInstructor) {
      // Notificar estudante
      await notificationService.createClassCancelled(
        scheduledClass.studentId._id,
        scheduledClass.courseId.title,
        refundAmount
      );

      await emailService.sendClassCancelledEmail(
        scheduledClass.studentId.email,
        {
          studentName: scheduledClass.studentId.name,
          courseTitle: scheduledClass.courseId.title,
          classDate: formattedDate,
          classTime: formattedTime,
          refundedCredits: refundAmount,
          reason
        }
      );
    } else {
      // Notificar instrutor
      await emailService.sendClassCancelledByStudentEmail(
        scheduledClass.instructorId.email,
        {
          instructorName: scheduledClass.instructorId.name,
          studentName: scheduledClass.studentId.name,
          courseTitle: scheduledClass.courseId.title,
          classDate: formattedDate,
          classTime: formattedTime,
          reason
        }
      );
    }
  }

  /**
   * Formatar data para exibição
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Instância singleton
const schedulingService = new SchedulingService();

module.exports = schedulingService;
