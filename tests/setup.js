const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Aumentar timeout global dos testes (para operações de banco em memória)
jest.setTimeout(30000);

// Variáveis de ambiente necessárias para autenticação durante os testes
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
process.env.JITSI_PRIVATE_KEY =
  process.env.JITSI_PRIVATE_KEY || "test-private-key";

let mongoServer;

// Configurar banco de teste antes de todos os testes
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Limpar banco após cada teste
afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Fechar conexões após todos os testes
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    // Em testes, apenas loga o erro e não falha a suíte

    console.warn(
      "Erro ao encerrar MongoMemoryServer/mongoose nos testes:",
      err
    );
  }
});
