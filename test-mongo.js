require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔄 Tentando conectar ao MongoDB...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexão com MongoDB bem-sucedida!');
    
    // Criar uma coleção de teste
    const TestSchema = new mongoose.Schema({ name: String });
    const Test = mongoose.model('Test', TestSchema);
    
    const testDoc = new Test({ name: 'Teste de Conexão' });
    await testDoc.save();
    console.log('✅ Documento de teste criado!');
    
    // Buscar o documento
    const found = await Test.findOne({ name: 'Teste de Conexão' });
    console.log('✅ Documento encontrado:', found.name);
    
    // Limpar teste
    await Test.deleteMany({});
    console.log('✅ Teste finalizado e limpeza concluída!');
    
    await mongoose.connection.close();
    console.log('✅ Conexão fechada. MongoDB está funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Dica: Verifique se a senha está correta no .env');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Dica: Verifique se a URI está correta e se há internet');
    }
    
    if (error.message.includes('MongoNetworkError')) {
      console.log('💡 Dica: Verifique se o IP está liberado no Atlas (0.0.0.0/0)');
    }
    
    process.exit(1);
  }
};

testConnection();
