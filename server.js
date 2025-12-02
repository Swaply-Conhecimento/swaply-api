require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                   SWAPLY API                 ║
║          Plataforma de Troca de              ║
║              Conhecimentos                   ║
╠══════════════════════════════════════════════╣
║ 🚀 Servidor rodando na porta ${PORT.toString().padEnd(4)} 🚀        ║
║ 🌍 Ambiente: ${process.env.NODE_ENV?.toUpperCase().padEnd(11) || 'DEVELOPMENT'} 🌍        ║
║ 📊 Health Check: http://localhost:${PORT}/health   ║
║ 📚 API Docs: http://localhost:${PORT}/api          ║
╚══════════════════════════════════════════════╝
  `);
  
  // Verificar conexão com serviços externos
  checkExternalServices();
});

// Função para verificar serviços externos
const checkExternalServices = async () => {
  console.log('\n🔍 Verificando serviços externos...\n');
  
  // Verificar configuração de email
  try {
    const { testEmailConfiguration } = require('./src/services/emailService');
    const emailOk = await testEmailConfiguration();
    console.log(`📧 Email Service: ${emailOk ? '✅ OK' : '❌ ERRO'}`);
  } catch (error) {
    console.log('📧 Email Service: ❌ ERRO - Configuração não encontrada');
  }
  
  // Verificar API do Jitsi
  try {
    const { jitsiService } = require('./src/services/jitsiService');
    const jitsiStatus = await jitsiService.checkStatus();
    console.log(`📹 Jitsi Meet: ${jitsiStatus.success ? '✅ OK' : '❌ ERRO'}`);
  } catch (error) {
    console.log('📹 Jitsi Meet: ❌ ERRO - Configuração não encontrada');
  }
  
  // Verificar Cloudinary
  try {
    const { cloudinary } = require('./src/config/cloudinary');
    if (cloudinary.config().cloud_name) {
      console.log('☁️  Cloudinary: ✅ OK');
    } else {
      console.log('☁️  Cloudinary: ❌ ERRO - Configuração incompleta');
    }
  } catch (error) {
    console.log('☁️  Cloudinary: ❌ ERRO - Configuração não encontrada');
  }
  
  // Verificar Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('💳 Stripe: ✅ OK');
    } else {
      console.log('💳 Stripe: ❌ ERRO - Chave não configurada');
    }
  } catch (error) {
    console.log('💳 Stripe: ❌ ERRO - Configuração não encontrada');
  }
  
  console.log('\n✨ Swaply API pronta para uso! ✨\n');
};

// Tratamento de erros do servidor
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requer privilégios elevados`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} já está em uso`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = server;
