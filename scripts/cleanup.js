require('dotenv').config();
const mongoose = require('mongoose');

// Importar modelos
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Review = require('../src/models/Review');
const Payment = require('../src/models/Payment');
const Notification = require('../src/models/Notification');
const Class = require('../src/models/Class');

// Conectar ao banco
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para limpar banco de dados
const cleanupDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Limpando banco de dados...');
    
    // Deletar em ordem para respeitar referências
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✅ ${deletedNotifications.deletedCount} notificações deletadas`);
    
    const deletedReviews = await Review.deleteMany({});
    console.log(`✅ ${deletedReviews.deletedCount} avaliações deletadas`);
    
    const deletedClasses = await Class.deleteMany({});
    console.log(`✅ ${deletedClasses.deletedCount} aulas deletadas`);
    
    const deletedPayments = await Payment.deleteMany({});
    console.log(`✅ ${deletedPayments.deletedCount} transações deletadas`);
    
    const deletedCourses = await Course.deleteMany({});
    console.log(`✅ ${deletedCourses.deletedCount} cursos deletados`);
    
    const deletedUsers = await User.deleteMany({});
    console.log(`✅ ${deletedUsers.deletedCount} usuários deletados`);
    
    console.log('\n🎉 Limpeza concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`👥 Usuários deletados: ${deletedUsers.deletedCount}`);
    console.log(`📚 Cursos deletados: ${deletedCourses.deletedCount}`);
    console.log(`⭐ Avaliações deletadas: ${deletedReviews.deletedCount}`);
    console.log(`💰 Transações deletadas: ${deletedPayments.deletedCount}`);
    console.log(`📅 Aulas deletadas: ${deletedClasses.deletedCount}`);
    console.log(`🔔 Notificações deletadas: ${deletedNotifications.deletedCount}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  }
};

// Executar limpeza se chamado diretamente
if (require.main === module) {
  cleanupDatabase();
}

module.exports = { cleanupDatabase };

