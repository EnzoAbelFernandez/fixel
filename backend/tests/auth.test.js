const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');
// ... no direct model use in this test

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

test('register and login flow', async () => {
  const user = { nombre: 'Test', email: 't@test.local', password: 'pass123' };
  const resReg = await request(app).post('/api/auth/register').send(user);
  expect(resReg.statusCode).toBe(201);

  const resLogin = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  expect(resLogin.statusCode).toBe(200);
  expect(resLogin.body).toHaveProperty('token');
});
