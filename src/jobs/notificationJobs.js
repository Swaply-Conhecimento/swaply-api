const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const ScheduledClass = require('../models/ScheduledClass');
const schedulingService = require('../services/schedulingService');

// Limpar notificações antigas (todo domingo às 2h)
const setupCleanupJob = () => {
  cron.schedule('0 2 * * 0', async () => {
    try {
      console.log('🧹 Iniciando limpeza automática de notificações...');
      const deletedCount = await NotificationService.cleanupOldNotifications(30);
      console.log(`✅ Limpeza concluída: ${deletedCount} notificações antigas removidas`);
    } catch (error) {
      console.error('❌ Erro na limpeza de notificações:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('📅 Job de limpeza de notificações configurado (Domingos às 2h)');
};

// Lembretes de aula (verificar a cada 15 minutos para aulas em 1 hora)
const setupClassRemindersJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('⏰ Verificando aulas para enviar lembretes...');
      
      // Usar o método do schedulingService para enviar lembretes
      // Envia lembretes para aulas que começam em até 60 minutos
      const remindersCount = await schedulingService.sendClassReminders(60);
      
      if (remindersCount > 0) {
        console.log(`✅ ${remindersCount} lembrete(s) enviado(s) com sucesso`);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar lembretes de aula:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('⏰ Job de lembretes de aula configurado (a cada 15 minutos)');
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

      if (result.modifiedCount > 0) {
        console.log(`📝 ${result.modifiedCount} aula(s) marcada(s) como perdida(s)`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status de aulas:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('📝 Job de atualização de aulas perdidas configurado (a cada hora)');
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

        console.log(`📚 Notificações de novo curso enviadas: ${course.title} (${randomUsers.length} usuários)`);
      }

    } catch (error) {
      console.error('❌ Erro ao notificar sobre novos cursos:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('📚 Job de notificações de novos cursos configurado (a cada hora)');
};

// Inicializar todos os jobs
const initializeNotificationJobs = () => {
  console.log('\n🚀 Inicializando jobs de notificações...');
  
  setupCleanupJob();
  setupClassRemindersJob();
  setupUpdateMissedClassesJob();
  setupNewCourseNotificationsJob();
  
  console.log('✅ Todos os jobs de notificações configurados');
};

// Parar todos os jobs
const stopNotificationJobs = () => {
  cron.getTasks().forEach(task => task.stop());
  console.log('🛑 Todos os jobs de notificações parados');
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
      
      console.log('🧪 Testando sistema de notificações...');
      
      // Criar algumas notificações de teste
      const testUser = await User.findOne({ email: 'test@swaply.com' });
      if (testUser) {
        await NotificationService.createClassReminder(testUser._id, 'Teste', 'Instrutor', 30);
        await NotificationService.createCreditEarned(testUser._id, 5, 'Curso Teste');
        
        console.log('✅ Notificações de teste criadas');
        
        // Testar estatísticas
        const stats = await NotificationService.getNotificationStats(testUser._id);
        console.log('📊 Estatísticas:', stats);
      }
      
      await mongoose.connection.close();
      console.log('✅ Teste concluído');
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      process.exit(1);
    }
  };
  
  runTest();
}
