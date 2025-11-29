const request = require('supertest');
const app = require('../src/app');

describe('Health and API info endpoints', () => {
  it('deve retornar status OK na rota /health', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Servidor funcionando');
    expect(response.body.environment).toBeDefined();
  });

  it('deve retornar informações básicas da API na rota /api', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Swaply API');
    expect(response.body.endpoints).toBeDefined();
    expect(response.body.endpoints.auth).toBe('/api/auth');
  });
});


