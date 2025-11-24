require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../src/models/Course');

async function recreateIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Tentar remover o índice antigo
    try {
      await Course.collection.dropIndex('title_text_description_text_tags_text');
      console.log('✅ Índice antigo removido');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Índice não existe, será criado');
      } else {
        console.log('⚠️  Erro ao remover índice:', error.message);
      }
    }

    // Recriar o índice (será criado automaticamente pelo Mongoose ao iniciar)
    console.log('✅ Índice será recriado automaticamente na próxima inicialização');
    
    await mongoose.connection.close();
    console.log('✅ Concluído');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

recreateIndex();

