const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const Class = require('../models/Class');

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

// Lembretes de aula (verificar a cada 5 minutos)
const setupClassRemindersJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      // Buscar aulas que começam em 30 minutos
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos no futuro
      const reminderTimeEnd = new Date(now.getTime() + 35 * 60 * 1000); // 35 minutos no futuro

      const upcomingClasses = await Class.find({
        date: {
          $gte: new Date(reminderTime.toDateString()), // Mesmo dia
          $lt: new Date(new Date(reminderTime.toDateString()).getTime() + 24 * 60 * 60 * 1000) // Próximo dia
        },
        status: { $in: ['scheduled', 'confirmed'] },
        reminderSent: { $ne: true }
      })
        .populate('studentId', 'name email')
        .populate('instructorId', 'name')
        .populate('courseId', 'title');

      for (const classItem of upcomingClasses) {
        // Verificar se a aula está no horário de lembrete (30 minutos antes)
        const classDateTime = new Date(classItem.date);
        const [hours, minutes] = classItem.time.split(':');
        classDateTime.setHours(parseInt(hours), parseInt(minutes));

        const timeDiff = classDateTime.getTime() - now.getTime();
        const minutesUntilClass = Math.floor(timeDiff / (1000 * 60));

        // Se está entre 25 e 35 minutos, enviar lembrete
        if (minutesUntilClass >= 25 && minutesUntilClass <= 35) {
          await NotificationService.createClassReminder(
            classItem.studentId._id,
            classItem.courseId.title,
            classItem.instructorId.name,
            30
          );

          // Marcar lembrete como enviado
          classItem.reminderSent = true;
          await classItem.save();

          console.log(`📧 Lembrete enviado para ${classItem.studentId.name} - Aula: ${classItem.courseId.title}`);
        }
      }

    } catch (error) {
      console.error('❌ Erro ao enviar lembretes de aula:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  console.log('⏰ Job de lembretes de aula configurado (a cada 5 minutos)');
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
