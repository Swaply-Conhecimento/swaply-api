const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Estudante é obrigatório']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Curso é obrigatório']
  },
  enrollmentType: {
    type: String,
    enum: ['full_course', 'single_class'],
    required: [true, 'Tipo de matrícula é obrigatório']
  },
  // Para single_class, armazena o ID da aula agendada
  scheduledClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledClass',
    default: null
  },
  // Preço pago
  pricePaid: {
    type: Number,
    required: [true, 'Preço pago é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  // Status da matrícula
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'refunded'],
    default: 'active'
  },
  // Data de expiração (para cursos completos, pode ser null)
  expiresAt: {
    type: Date,
    default: null
  },
  // Progresso (para curso completo)
  progress: {
    completedClasses: {
      type: Number,
      default: 0
    },
    totalClasses: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Transação de pagamento
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  }
}, {
  timestamps: true
});

// Índices
enrollmentSchema.index({ student: 1, course: 1 });
enrollmentSchema.index({ student: 1, enrollmentType: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ createdAt: -1 });

// Índice único: um estudante não pode ter mais de uma matrícula full_course ativa no mesmo curso
enrollmentSchema.index(
  { student: 1, course: 1, enrollmentType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      enrollmentType: 'full_course',
      status: 'active'
    }
  }
);

// Método para atualizar progresso
enrollmentSchema.methods.updateProgress = async function() {
  if (this.enrollmentType !== 'full_course') {
    return;
  }

  const ScheduledClass = mongoose.model('ScheduledClass');
  
  const completedClasses = await ScheduledClass.countDocuments({
    courseId: this.course,
    studentId: this.student,
    status: 'completed'
  });

  const totalClasses = await ScheduledClass.countDocuments({
    courseId: this.course,
    studentId: this.student,
    status: { $in: ['scheduled', 'in_progress', 'completed'] }
  });

  this.progress.completedClasses = completedClasses;
  this.progress.totalClasses = totalClasses;
  this.progress.percentage = totalClasses > 0 
    ? Math.round((completedClasses / totalClasses) * 100) 
    : 0;

  // Se completou todas as aulas, marca como completo
  if (this.progress.percentage === 100 && totalClasses > 0) {
    this.status = 'completed';
  }

  await this.save();
};

// Método para verificar se pode agendar aula
enrollmentSchema.methods.canScheduleClass = function() {
  if (this.enrollmentType === 'single_class') {
    // Aula avulsa: só pode agendar se ainda não agendou
    return !this.scheduledClass;
  }

  // Curso completo: pode agendar a qualquer momento se estiver ativo
  return this.status === 'active';
};

// Método para cancelar matrícula
enrollmentSchema.methods.cancel = async function(reason = '') {
  this.status = 'cancelled';
  await this.save();
  
  // Se for curso completo, cancelar todas as aulas futuras
  if (this.enrollmentType === 'full_course') {
    const ScheduledClass = mongoose.model('ScheduledClass');
    
    await ScheduledClass.updateMany(
      {
        courseId: this.course,
        studentId: this.student,
        status: 'scheduled',
        date: { $gte: new Date() }
      },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: this.student,
          cancellationReason: reason || 'Matrícula cancelada'
        }
      }
    );
  }
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);

