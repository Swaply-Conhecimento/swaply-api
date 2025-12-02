const mongoose = require('mongoose');

const scheduledClassSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Curso é obrigatório'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Estudante é obrigatório'],
    index: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instrutor é obrigatório'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    index: true,
    validate: {
      validator: function(value) {
        // A data deve ser no futuro
        return value > new Date();
      },
      message: 'A data deve ser no futuro'
    }
  },
  duration: {
    type: Number,
    default: 1, // em horas
    required: [true, 'Duração é obrigatória'],
    min: [0.5, 'Duração mínima é 0.5 horas'],
    max: [4, 'Duração máxima é 4 horas']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'],
    default: 'scheduled',
    required: true,
    index: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notas não podem ter mais de 1000 caracteres']
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: {
    type: String,
    maxlength: [500, 'Motivo do cancelamento não pode ter mais de 500 caracteres']
  },
  cancelledAt: {
    type: Date
  },
  creditsSpent: {
    type: Number,
    default: 1,
    min: [1, 'Créditos gastos devem ser pelo menos 1']
  },
  refunded: {
    type: Boolean,
    default: false
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  attendance: {
    studentJoined: {
      type: Boolean,
      default: false
    },
    instructorJoined: {
      type: Boolean,
      default: false
    },
    studentJoinedAt: Date,
    instructorJoinedAt: Date
  },
  rating: {
    type: Number,
    min: [1, 'Avaliação mínima é 1'],
    max: [5, 'Avaliação máxima é 5']
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback não pode ter mais de 500 caracteres']
  },
  jitsiRoomName: {
    type: String,
    default: null
  },
  jitsiInstructorUrl: {
    type: String,
    default: null
  },
  jitsiStudentUrl: {
    type: String,
    default: null
  },
  jitsiInstructorToken: {
    type: String,
    default: null
  },
  jitsiStudentToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Índices compostos para queries frequentes
scheduledClassSchema.index({ studentId: 1, date: 1 });
scheduledClassSchema.index({ instructorId: 1, date: 1 });
scheduledClassSchema.index({ courseId: 1, status: 1 });
scheduledClassSchema.index({ status: 1, date: 1 });

// Virtual para verificar se a aula já passou
scheduledClassSchema.virtual('isPast').get(function() {
  const classEndTime = new Date(this.date.getTime() + (this.duration * 60 * 60 * 1000));
  return classEndTime < new Date();
});

// Virtual para verificar se a aula está acontecendo agora
scheduledClassSchema.virtual('isHappeningNow').get(function() {
  const now = new Date();
  const classStartTime = new Date(this.date);
  const classEndTime = new Date(this.date.getTime() + (this.duration * 60 * 60 * 1000));
  
  // Considerar 15 minutos antes e 15 minutos depois
  const allowedStartTime = new Date(classStartTime.getTime() - (15 * 60 * 1000));
  const allowedEndTime = new Date(classEndTime.getTime() + (15 * 60 * 1000));
  
  return now >= allowedStartTime && now <= allowedEndTime;
});

// Virtual para tempo até a aula (em minutos)
scheduledClassSchema.virtual('minutesUntilClass').get(function() {
  const now = new Date();
  const classStartTime = new Date(this.date);
  const diffMs = classStartTime - now;
  return Math.floor(diffMs / (60 * 1000));
});

// Método para cancelar aula
scheduledClassSchema.methods.cancel = async function(userId, reason = '') {
  if (this.status === 'cancelled') {
    throw new Error('Aula já está cancelada');
  }
  
  if (this.status === 'completed') {
    throw new Error('Não é possível cancelar uma aula já concluída');
  }

  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelReason = reason;
  this.cancelledAt = new Date();

  // Calcular reembolso baseado no tempo de antecedência
  const hoursUntilClass = this.minutesUntilClass / 60;
  
  if (hoursUntilClass >= 24) {
    // Reembolso total
    this.refunded = true;
    this.refundedAmount = this.creditsSpent;
  } else if (hoursUntilClass >= 12) {
    // Reembolso parcial (50%)
    this.refunded = true;
    this.refundedAmount = Math.floor(this.creditsSpent * 0.5);
  } else {
    // Sem reembolso
    this.refunded = false;
    this.refundedAmount = 0;
  }

  // Se cancelado pelo instrutor, reembolso total
  if (userId.toString() === this.instructorId.toString()) {
    this.refunded = true;
    this.refundedAmount = this.creditsSpent;
  }

  await this.save();
  return this.refundedAmount;
};

// Método para marcar como concluída
scheduledClassSchema.methods.complete = async function() {
  if (this.status === 'cancelled') {
    throw new Error('Não é possível concluir uma aula cancelada');
  }

  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
};

// Método para marcar presença
scheduledClassSchema.methods.markAttendance = async function(userId, role) {
  if (role === 'student') {
    this.attendance.studentJoined = true;
    this.attendance.studentJoinedAt = new Date();
  } else if (role === 'instructor') {
    this.attendance.instructorJoined = true;
    this.attendance.instructorJoinedAt = new Date();
  }

  // Se ambos entraram, marcar como em progresso
  if (this.attendance.studentJoined && this.attendance.instructorJoined) {
    this.status = 'in_progress';
  }

  await this.save();
};

// Middleware para verificar se a aula passou sem ser completada
scheduledClassSchema.pre('save', function(next) {
  if (this.isPast && this.status === 'scheduled') {
    this.status = 'missed';
  }
  next();
});

// Método estático para obter aulas próximas (para lembretes)
scheduledClassSchema.statics.getUpcomingClasses = async function(minutesAhead = 60) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + (minutesAhead * 60 * 1000));

  return await this.find({
    status: 'scheduled',
    date: {
      $gte: now,
      $lte: futureTime
    }
  })
    .populate('studentId', 'name email settings.notifications')
    .populate('instructorId', 'name email')
    .populate('courseId', 'title');
};

// Método estático para verificar conflitos de horário
scheduledClassSchema.statics.checkConflict = async function(instructorId, date, duration) {
  const classStartTime = new Date(date);
  const classEndTime = new Date(date.getTime() + (duration * 60 * 60 * 1000));

  // Buscar todas as aulas do instrutor que estão agendadas ou em progresso
  const existingClasses = await this.find({
    instructorId,
    status: { $in: ['scheduled', 'in_progress'] }
  }).select('date duration status').lean();

  // Se não há aulas existentes, não há conflito
  if (existingClasses.length === 0) {
    return false;
  }

  // Verificar se há sobreposição de horários
  for (const existingClass of existingClasses) {
    const existingStart = new Date(existingClass.date);
    const existingEnd = new Date(existingStart.getTime() + (existingClass.duration * 60 * 60 * 1000));

    // Verificar sobreposição:
    // 1. Nova aula começa durante uma aula existente
    // 2. Nova aula termina durante uma aula existente
    // 3. Nova aula engloba completamente uma aula existente
    // 4. Aula existente engloba completamente a nova aula
    const hasOverlap = (
      (classStartTime >= existingStart && classStartTime < existingEnd) ||
      (classEndTime > existingStart && classEndTime <= existingEnd) ||
      (classStartTime <= existingStart && classEndTime >= existingEnd) ||
      (classStartTime >= existingStart && classEndTime <= existingEnd)
    );

    if (hasOverlap) {
      return true;
    }
  }

  return false;
};

module.exports = mongoose.model('ScheduledClass', scheduledClassSchema);
