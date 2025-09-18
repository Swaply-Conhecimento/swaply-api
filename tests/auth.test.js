const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { connectDB } = require('../src/config/database');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Conectar ao banco de teste
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/swaply-test';
    await connectDB();
  });

  beforeEach(async () => {
    // Limpar banco antes de cada teste
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Fechar conexão após todos os testes
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: '123456',
        confirmPassword: '123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('deve retornar erro para email duplicado', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: '123456',
        confirmPassword: '123456'
      };

      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Segundo registro com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('E-mail já está em uso');
    });

    it('deve retornar erro para senhas não coincidentes', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: '123456',
        confirmPassword: '654321'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('As senhas não coincidem');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Criar usuário de teste
      const user = new User({
        name: 'João Silva',
        email: 'joao@test.com',
        password: '123456'
      });
      await user.save();
    });

    it('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'joao@test.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const loginData = {
        email: 'joao@test.com',
        password: 'senhaerrada'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciais inválidas');
    });
  });

  describe('GET /api/auth/verify-token', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Criar usuário e obter token
      user = new User({
        name: 'João Silva',
        email: 'joao@test.com',
        password: '123456'
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao@test.com',
          password: '123456'
        });

      token = loginResponse.body.data.token;
    });

    it('deve verificar token válido', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('joao@test.com');
    });

    it('deve retornar erro para token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');
    });

    it('deve retornar erro quando não há token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acesso não fornecido');
    });
  });
});
