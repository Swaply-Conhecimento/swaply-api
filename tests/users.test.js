const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Users API', () => {
  let token;

  beforeAll(async () => {
    // Garante ambiente de teste consistente
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    await User.deleteMany({});

    const userData = {
      name: 'Usuário Teste',
      email: 'usuario@test.com',
      password: '123456',
      confirmPassword: '123456'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    token = registerResponse.body.data.token;
  });

  describe('GET /api/users/profile', () => {
    it('deve retornar o perfil do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Usuário Teste');
      expect(response.body.data.email).toBe('usuario@test.com');
    });

    it('deve retornar erro quando não há token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acesso não fornecido');
    });
  });

  describe('GET /api/users/credits/balance', () => {
    it('deve retornar saldo de créditos do usuário', async () => {
      const response = await request(app)
        .get('/api/users/credits/balance')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('credits');
      expect(response.body.data).toHaveProperty('creditPrice');
    });
  });
});


