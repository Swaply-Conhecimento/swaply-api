const request = require('supertest');
const app = require('../src/app');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

describe('Courses API', () => {
  let token;
  let user;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Course.deleteMany({})]);

    // Cria usuário e obtém token via fluxo de registro
    const userData = {
      name: 'Instrutor Teste',
      email: 'instrutor@test.com',
      password: '123456',
      confirmPassword: '123456'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    token = registerResponse.body.data.token;
    user = await User.findOne({ email: userData.email });
  });

  describe('GET /api/courses', () => {
    it('deve listar cursos mesmo sem estar autenticado', async () => {
      // Cria um curso diretamente no banco
      await Course.create({
        title: 'Curso Público',
        description: 'Curso de teste',
        category: 'Programação',
        subcategory: 'JavaScript',
        level: 'Iniciante', // ver enum em Course.js
        pricePerHour: 100,
        totalHours: 10,
        pricing: {
          singleClass: 50,
          fullCourse: 800,
        },
        maxStudents: 20,
        currentStudents: 0,
        instructor: user._id,
        status: 'active',
      });

      const response = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toHaveProperty('title');
    });
  });

  describe('GET /api/courses/categories', () => {
    it('deve retornar categorias de cursos', async () => {
      const response = await request(app)
        .get('/api/courses/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('name');
        expect(response.body.data[0]).toHaveProperty('subcategories');
      }
    });
  });
});


