const request = require('supertest');
const app = require('../src/app');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

describe('Stats API', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await Promise.all([User.deleteMany({}), Course.deleteMany({})]);
  });

  it('deve retornar 0 para contagens quando não há dados', async () => {
    const response = await request(app)
      .get('/api/stats')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.activeCourses).toBe(0);
    expect(response.body.data.activeUsers).toBe(0);
  });

  it('deve refletir contagens de cursos e usuários ativos', async () => {
    const user = await User.create({
      name: 'User Stats',
      email: 'stats@test.com',
      password: '123456',
      isActive: true
    });

    await Course.create({
      title: 'Curso Stats',
      description: 'Curso para estatísticas',
      category: 'Programação',
      subcategory: 'Node.js',
      level: 'Iniciante', // ver enum em Course.js
      pricePerHour: 80,
      totalHours: 5,
      pricing: {
        singleClass: 40,
        fullCourse: 400
      },
      maxStudents: 10,
      currentStudents: 0,
      instructor: user._id,
      status: 'active'
    });

    const response = await request(app)
      .get('/api/stats')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.activeCourses).toBeGreaterThanOrEqual(1);
    expect(response.body.data.activeUsers).toBeGreaterThanOrEqual(1);
  });

  it('deve retornar apenas contagem de cursos em /api/stats/courses', async () => {
    const response = await request(app)
      .get('/api/stats/courses')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('activeCourses');
  });

  it('deve retornar apenas contagem de usuários em /api/stats/users', async () => {
    const response = await request(app)
      .get('/api/stats/users')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('activeUsers');
  });
});


