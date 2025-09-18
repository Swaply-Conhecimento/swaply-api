require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Notification = require('./src/models/Notification');
const NotificationService = require('./src/services/notificationService');

const testNotifications = async () => {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Criar usuário de teste se não existir
    let testUser = await User.findOne({ email: 'test@swaply.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Usuário Teste',
        email: 'test@swaply.com',
        password: '123456'
      });
      await testUser.save();
      console.log('✅ Usuário de teste criado');
    }

    console.log('\n🧪 Testando NotificationService...');

    // 1. Testar criação de notificação de lembrete de aula
    console.log('\n📅 1. Criando notificação de lembrete de aula...');
    const classReminder = await NotificationService.createClassReminder(
      testUser._id,
      'JavaScript Avançado',
      'João Silva',
      30
    );
    console.log('✅ Lembrete de aula criado:', classReminder.title);

    // 2. Testar notificação de créditos recebidos
    console.log('\n💰 2. Criando notificação de créditos recebidos...');
    const creditEarned = await NotificationService.createCreditEarned(
      testUser._id,
      5,
      'React Fundamentals'
    );
    console.log('✅ Notificação de créditos criada:', creditEarned.title);

    // 3. Testar notificação de novo curso
    console.log('\n📚 3. Criando notificação de novo curso...');
    const newCourse = await NotificationService.createNewCourse(
      testUser._id,
      'Python para Iniciantes',
      'Tecnologia'
    );
    console.log('✅ Notificação de novo curso criada:', newCourse.title);

    // 4. Testar notificação de aula agendada
    console.log('\n🎯 4. Criando notificação de aula agendada...');
    const classScheduled = await NotificationService.createClassScheduled(
      testUser._id,
      'Node.js Backend',
      '25/09/2024',
      '19:00'
    );
    console.log('✅ Notificação de aula agendada criada:', classScheduled.title);

    // 5. Testar notificação de novo aluno
    console.log('\n👨‍🎓 5. Criando notificação de novo aluno...');
    const newStudent = await NotificationService.createNewStudent(
      testUser._id,
      'Maria Santos',
      'Design UX/UI'
    );
    console.log('✅ Notificação de novo aluno criada:', newStudent.title);

    // 6. Testar notificação de créditos gastos
    console.log('\n💸 6. Criando notificação de créditos gastos...');
    const creditSpent = await NotificationService.createCreditSpent(
      testUser._id,
      3,
      'Fotografia Digital'
    );
    console.log('✅ Notificação de créditos gastos criada:', creditSpent.title);

    // 7. Testar notificação de aula cancelada
    console.log('\n❌ 7. Criando notificação de aula cancelada...');
    const classCancelled = await NotificationService.createClassCancelled(
      testUser._id,
      'Marketing Digital',
      2
    );
    console.log('✅ Notificação de aula cancelada criada:', classCancelled.title);

    // 8. Testar notificação do sistema
    console.log('\n🔧 8. Criando notificação do sistema...');
    const systemNotification = await NotificationService.createSystemNotification(
      testUser._id,
      'Manutenção Programada',
      'O sistema estará em manutenção das 2h às 4h da manhã.',
      { maintenanceStart: '02:00', maintenanceEnd: '04:00' }
    );
    console.log('✅ Notificação do sistema criada:', systemNotification.title);

    // 9. Testar obtenção de estatísticas
    console.log('\n📊 9. Obtendo estatísticas de notificações...');
    const stats = await NotificationService.getNotificationStats(testUser._id);
    console.log('✅ Estatísticas obtidas:');
    console.log(`   Total não lidas: ${stats.totalUnread}`);
    console.log(`   Por tipo:`, stats.byType);

    // 10. Testar busca de notificações
    console.log('\n🔍 10. Buscando notificações do usuário...');
    const userNotifications = await Notification.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`✅ ${userNotifications.length} notificações encontradas:`);
    userNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type}] ${notif.title}`);
    });

    // 11. Testar marcar como lida
    console.log('\n✅ 11. Marcando primeira notificação como lida...');
    if (userNotifications.length > 0) {
      await Notification.findByIdAndUpdate(
        userNotifications[0]._id,
        { isRead: true }
      );
      console.log('✅ Notificação marcada como lida');
    }

    // 12. Testar contagem de não lidas
    console.log('\n🔢 12. Contando notificações não lidas...');
    const unreadCount = await Notification.countDocuments({
      userId: testUser._id,
      isRead: false
    });
    console.log(`✅ Notificações não lidas: ${unreadCount}`);

    console.log('\n🎉 Todos os testes de notificação passaram com sucesso!');
    console.log('\n📊 Resumo dos testes:');
    console.log('✅ Criação de notificações: 8 tipos testados');
    console.log('✅ Busca de notificações: Funcionando');
    console.log('✅ Marcar como lida: Funcionando');
    console.log('✅ Contagem: Funcionando');
    console.log('✅ Estatísticas: Funcionando');

    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
};

testNotifications();
