const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');

describe('Notifications API', () => {
  let user;
  let token;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Notification.deleteMany({})]);

    const userData = {
      name: 'User Notif',
      email: 'notif@test.com',
      password: '123456',
      confirmPassword: '123456'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    token = registerResponse.body.data.token;
    user = await User.findOne({ email: userData.email });

    // Cria algumas notificações para o usuário
    await Notification.create([
      {
        userId: user._id,
        type: 'system',
        title: 'Bem-vindo',
        message: 'Bem-vindo à plataforma Swaply!',
        isRead: false
      },
      {
        userId: user._id,
        type: 'new_course',
        title: 'Novo curso disponível',
        message: 'Confira o novo curso disponível para você.',
        isRead: true
      }
    ]);
  });

  it('deve listar notificações do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.unreadCount).toBeGreaterThanOrEqual(0);
  });

  it('deve marcar todas notificações como lidas', async () => {
    const response = await request(app)
      .put('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('modifiedCount');

    const unreadAfter = await Notification.countDocuments({
      userId: user._id,
      isRead: false
    });
    expect(unreadAfter).toBe(0);
  });
});


