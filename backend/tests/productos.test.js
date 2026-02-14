const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');
// no direct model use in this test file

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

const adminCreds = { nombre: 'Admin', email: 'a@a.local', password: 'admin123', rol: 'Administrador' };

async function loginAdmin() {
  await request(app).post('/api/auth/register').send(adminCreds);
  const res = await request(app).post('/api/auth/login').send({ email: adminCreds.email, password: adminCreds.password });
  return res.body.token;
}

test('admin can create product and authenticated user can list, edit and delete', async () => {
  const token = await loginAdmin();

  const prod = { nombre: 'Test Prod', categoria: 'Test', costo: 100, precioVenta: 200, stock: 5 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  expect(resCreate.statusCode).toBe(201);
  const created = resCreate.body.producto;

  const resList = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
  expect(resList.statusCode).toBe(200);
  expect(Array.isArray(resList.body)).toBe(true);
  expect(resList.body.length).toBe(1);

  // Edit producto
  const resEdit = await request(app).put(`/api/productos/${created._id}`).set('Authorization', `Bearer ${token}`).send({ precioVenta: 250 });
  expect(resEdit.statusCode).toBe(200);
  expect(resEdit.body.producto.precioVenta).toBe(250);

  // Delete producto
  const resDelete = await request(app).delete(`/api/productos/${created._id}`).set('Authorization', `Bearer ${token}`);
  expect(resDelete.statusCode).toBe(200);

  const resListAfter = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
  expect(resListAfter.body.length).toBe(0);
});

test('non-admin cannot create product', async () => {
  // register a non-admin user
  const user = { nombre: 'User', email: 'u@u.local', password: 'userpass' };
  await request(app).post('/api/auth/register').send(user);
  const resLogin = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  const token = resLogin.body.token;

  const prod = { nombre: 'No Admin Prod', categoria: 'Test', costo: 10, precioVenta: 20, stock: 1 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  expect(resCreate.statusCode).toBe(403);
});
