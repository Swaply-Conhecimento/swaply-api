const mongoose = require('mongoose');

const connectDB = async () => {
  // Em ambiente de teste, a conexão é gerenciada por mongodb-memory-server em tests/setup.js
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    // Em produção/ambiente real, encerrar o processo se não conseguir conectar
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Export default (usado por src/app.js)
module.exports = connectDB;
// Export nomeado (usado em alguns testes)
module.exports.connectDB = connectDB;
