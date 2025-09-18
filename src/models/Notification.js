const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  type: {
    type: String,
    required: true,
    enum: [
      'class_reminder',
      'class_cancelled', 
      'class_scheduled',
      'new_course',
      'course_update',
      'credit_earned',
      'credit_spent',
      'new_student',
      'instructor_message',
      'system'
    ]
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  message: {
    type: String,
    required: [true, 'Mensagem é obrigatória'],
    trim: true,
    maxlength: [500, 'Mensagem não pode ter mais de 500 caracteres']
  },
  data: {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    url: {
      type: String,
      trim: true
    },
    action: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['academic', 'financial', 'system', 'social', 'promotional'],
    default: 'academic'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices compostos para performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });

// Middleware para atualizar updatedAt
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para marcar como lida
notificationSchema.methods.markAsRead = async function() {
  if (this.isRead) {
    return this;
  }
  
  this.isRead = true;
  this.readAt = new Date();
  
  await this.save();
  return this;
};

// Método para marcar como não lida
notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  
  await this.save();
  return this;
};

// Método estático para criar notificação de lembrete de aula
notificationSchema.statics.createClassReminder = async function(classData, reminderTime = 30) {
  const classDateTime = new Date(classData.date);
  const [hours, minutes] = classData.time.split(':');
  classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const reminderDateTime = new Date(classDateTime.getTime() - (reminderTime * 60 * 1000));
  
  const notification = new this({
    userId: classData.studentId,
    type: 'class_reminder',
    title: 'Lembrete de Aula',
    message: `Sua aula "${classData.title || 'Aula agendada'}" começará em ${reminderTime} minutos`,
    data: {
      classId: classData._id,
      courseId: classData.courseId,
      url: `/dashboard/classes/${classData._id}`,
      action: 'join_class',
      metadata: {
        reminderTime,
        classDateTime: classDateTime.toISOString()
      }
    },
    priority: 'high',
    category: 'academic'
  });
  
  return await notification.save();
};

// Método estático para criar notificação de cancelamento
notificationSchema.statics.createClassCancellation = async function(classData, reason = '') {
  const notifications = [];
  
  // Notificação para o estudante
  const studentNotification = new this({
    userId: classData.studentId,
    type: 'class_cancelled',
    title: 'Aula Cancelada',
    message: `Sua aula "${classData.title || 'Aula agendada'}" foi cancelada${reason ? ': ' + reason : ''}`,
    data: {
      classId: classData._id,
      courseId: classData.courseId,
      url: '/dashboard/classes',
      action: 'view_classes',
      metadata: { reason }
    },
    priority: 'high',
    category: 'academic'
  });
  
  notifications.push(await studentNotification.save());
  
  // Notificação para o instrutor
  const instructorNotification = new this({
    userId: classData.instructorId,
    type: 'class_cancelled',
    title: 'Aula Cancelada',
    message: `A aula "${classData.title || 'Aula agendada'}" foi cancelada${reason ? ': ' + reason : ''}`,
    data: {
      classId: classData._id,
      courseId: classData.courseId,
      url: '/dashboard/teaching',
      action: 'view_teaching',
      metadata: { reason }
    },
    priority: 'medium',
    category: 'academic'
  });
  
  notifications.push(await instructorNotification.save());
  
  return notifications;
};

// Método estático para criar notificação de novo curso
notificationSchema.statics.createNewCourseNotification = async function(course, interestedUsers) {
  const notifications = [];
  
  for (const userId of interestedUsers) {
    const notification = new this({
      userId,
      type: 'new_course',
      title: 'Novo Curso Disponível',
      message: `Novo curso "${course.title}" na categoria ${course.category}`,
      data: {
        courseId: course._id,
        url: `/courses/${course._id}`,
        action: 'view_course',
        metadata: {
          category: course.category,
          instructor: course.instructor,
          pricePerHour: course.pricePerHour
        }
      },
      priority: 'low',
      category: 'promotional',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    });
    
    notifications.push(await notification.save());
  }
  
  return notifications;
};

// Método estático para criar notificação de créditos
notificationSchema.statics.createCreditNotification = async function(userId, type, amount, description) {
  const titles = {
    credit_earned: 'Créditos Recebidos',
    credit_spent: 'Créditos Utilizados',
    credit_purchased: 'Créditos Comprados'
  };
  
  const messages = {
    credit_earned: `Você recebeu ${amount} crédito${amount > 1 ? 's' : ''}`,
    credit_spent: `Você utilizou ${amount} crédito${amount > 1 ? 's' : ''}`,
    credit_purchased: `Você comprou ${amount} crédito${amount > 1 ? 's' : ''}`
  };
  
  const notification = new this({
    userId,
    type,
    title: titles[type],
    message: `${messages[type]}${description ? ': ' + description : ''}`,
    data: {
      url: '/dashboard/credits',
      action: 'view_credits',
      metadata: { amount, description }
    },
    priority: type === 'credit_earned' ? 'medium' : 'low',
    category: 'financial'
  });
  
  return await notification.save();
};

// Método estático para limpar notificações antigas
notificationSchema.statics.cleanupOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    $or: [
      { isRead: true, readAt: { $lt: thirtyDaysAgo } },
      { isActive: false },
      { expiresAt: { $lt: new Date() } }
    ]
  });
  
  return result.deletedCount;
};

// Método estático para marcar todas como lidas
notificationSchema.statics.markAllAsRead = async function(userId) {
  const result = await this.updateMany(
    { userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
  
  return result.modifiedCount;
};

// Método estático para obter contagem de não lidas
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    userId,
    isRead: false,
    isActive: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
