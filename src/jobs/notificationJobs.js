const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const ScheduledClass = require('../models/ScheduledClass');
const schedulingService = require('../services/schedulingService');

// Limpar notificações antigas (todo domingo às 2h)
const setupCleanupJob = () => {
  cron.schedule('0 2 * * 0', async () => {
    try {
      await NotificationService.cleanupOldNotifications(30);
    } catch (error) {
      // Erro na limpeza de notificações - silencioso
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
};

// Lembretes de aula (verificar a cada 15 minutos para aulas em 1 hora)
const setupClassRemindersJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      // Usar o método do schedulingService para enviar lembretes
      // Envia lembretes para aulas que começam em até 60 minutos
      await schedulingService.sendClassReminders(60);
    } catch (error) {
      // Erro ao enviar lembretes de aula - silencioso
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
};

// Atualizar status de aulas que passaram (verificar a cada hora)
const setupUpdateMissedClassesJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      
      // Buscar aulas agendadas que já passaram
      const result = await ScheduledClass.updateMany({
        status: 'scheduled',
        date: { $lt: now }
      }, {
        $set: { status: 'missed' }
      });

    } catch (error) {
      // Erro ao atualizar status de aulas - silencioso
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
};

// Notificações de novos cursos (verificar a cada hora)
const setupNewCourseNotificationsJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const Course = require('../models/Course');
      const User = require('../models/User');

      // Buscar cursos criados na última hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newCourses = await Course.find({
        createdAt: { $gte: oneHourAgo },
        status: 'active'
      }).populate('instructor', 'name');

      for (const course of newCourses) {
        // Buscar usuários interessados na categoria (que têm a categoria nos favoritos)
        const interestedUsers = await User.find({
          isActive: true,
          _id: { $ne: course.instructor._id }, // Não notificar o próprio instrutor
          // Aqui você pode adicionar lógica para usuários interessados na categoria
        }).limit(100); // Limitar para não sobrecarregar

        // Por enquanto, notificar uma amostra aleatória de usuários
        const randomUsers = interestedUsers.sort(() => 0.5 - Math.random()).slice(0, 10);

        for (const user of randomUsers) {
          await NotificationService.createNewCourse(
            user._id,
            course.title,
            course.category
          );
        }

      }

    } catch (error) {
      // Erro ao notificar sobre novos cursos - silencioso
    }
  }, {
    timezone: "America/Sao_Paulo"
  });
};

// Inicializar todos os jobs
const initializeNotificationJobs = () => {
  setupCleanupJob();
  setupClassRemindersJob();
  setupUpdateMissedClassesJob();
  setupNewCourseNotificationsJob();
};

// Parar todos os jobs
const stopNotificationJobs = () => {
  cron.getTasks().forEach(task => task.stop());
};

module.exports = {
  initializeNotificationJobs,
  stopNotificationJobs,
  setupCleanupJob,
  setupClassRemindersJob,
  setupUpdateMissedClassesJob,
  setupNewCourseNotificationsJob
};

// Se executado diretamente, rodar teste
if (require.main === module) {
  const runTest = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      // Criar algumas notificações de teste
      const testUser = await User.findOne({ email: 'test@swaply.com' });
      if (testUser) {
        await NotificationService.createClassReminder(testUser._id, 'Teste', 'Instrutor', 30);
        await NotificationService.createCreditEarned(testUser._id, 5, 'Curso Teste');
        
        // Testar estatísticas
        await NotificationService.getNotificationStats(testUser._id);
      }
      
      await mongoose.connection.close();
      
    } catch (error) {
      process.exit(1);
    }
  };
  
  runTest();
}
