const Notification = require('../models/Notification');

class NotificationService {
  
  // Criar notificação
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data
      });

      await notification.save();
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Notificação de lembrete de aula
  static async createClassReminder(userId, courseTitle, instructorName, timeMinutes) {
    return this.createNotification(
      userId,
      'class_reminder',
      'Lembrete de Aula',
      `Você tem uma aula de "${courseTitle}" em ${timeMinutes} minutos com ${instructorName}.`,
      { courseTitle, instructorName, timeMinutes }
    );
  }

  // Notificação de créditos recebidos
  static async createCreditEarned(userId, credits, courseTitle) {
    return this.createNotification(
      userId,
      'credit_earned',
      'Créditos Recebidos',
      `Você ganhou ${credits} crédito${credits > 1 ? 's' : ''} por ensinar a aula de "${courseTitle}".`,
      { credits, courseTitle }
    );
  }

  // Notificação de novo curso
  static async createNewCourse(userId, courseTitle, category) {
    return this.createNotification(
      userId,
      'new_course',
      'Novo Curso Disponível',
      `Um novo curso "${courseTitle}" foi adicionado na categoria ${category}.`,
      { courseTitle, category }
    );
  }

  // Notificação de aula agendada
  static async createClassScheduled(userId, courseTitle, date, time) {
    return this.createNotification(
      userId,
      'class_scheduled',
      'Aula Agendada',
      `Sua aula de "${courseTitle}" foi agendada para ${date} às ${time}.`,
      { courseTitle, date, time }
    );
  }

  // Notificação de novo aluno
  static async createNewStudent(instructorId, studentName, courseTitle) {
    return this.createNotification(
      instructorId,
      'new_student',
      'Novo Aluno',
      `${studentName} se inscreveu no seu curso "${courseTitle}".`,
      { studentName, courseTitle }
    );
  }

  // Notificação de créditos gastos
  static async createCreditSpent(userId, credits, courseTitle) {
    return this.createNotification(
      userId,
      'credit_spent',
      'Créditos Utilizados',
      `Você utilizou ${credits} crédito${credits > 1 ? 's' : ''} para agendar uma aula de "${courseTitle}".`,
      { credits, courseTitle }
    );
  }

  // Notificação de aula cancelada
  static async createClassCancelled(userId, courseTitle, refundedCredits) {
    return this.createNotification(
      userId,
      'class_cancelled',
      'Aula Cancelada',
      `A aula de "${courseTitle}" foi cancelada. ${refundedCredits > 0 ? `Seus ${refundedCredits} créditos foram reembolsados.` : ''}`,
      { courseTitle, refundedCredits }
    );
  }

  // Notificação do sistema
  static async createSystemNotification(userId, title, message, data = {}) {
    return this.createNotification(
      userId,
      'system',
      title,
      message,
      data
    );
  }

  // Mensagem do instrutor
  static async createInstructorMessage(userId, instructorName, message, courseTitle = null) {
    return this.createNotification(
      userId,
      'instructor_message',
      `Mensagem de ${instructorName}`,
      message,
      { instructorName, courseTitle }
    );
  }

  // Notificação de atualização de curso
  static async createCourseUpdate(userId, courseTitle, updateType) {
    return this.createNotification(
      userId,
      'course_update',
      'Curso Atualizado',
      `O curso "${courseTitle}" foi atualizado: ${updateType}.`,
      { courseTitle, updateType }
    );
  }

  // Notificar todos os usuários (para atualizações do sistema)
  static async notifyAllUsers(title, message, data = {}) {
    const User = require('../models/User');
    const users = await User.find({ isActive: true }).select('_id');
    
    const notifications = users.map(user => ({
      userId: user._id,
      type: 'system',
      title,
      message,
      data
    }));

    await Notification.insertMany(notifications);
    return notifications.length;
  }

  // Limpar notificações antigas (rodar como cron job)
  static async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    return result.deletedCount;
  }

  // Obter estatísticas de notificações
  static async getNotificationStats(userId) {
    const stats = await Notification.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUnread = await Notification.countDocuments({
      userId,
      isRead: false
    });

    return {
      totalUnread,
      byType: stats
    };
  }
}

module.exports = NotificationService;
