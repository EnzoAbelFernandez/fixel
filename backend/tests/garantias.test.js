const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

const adminCreds = { nombre: 'Admin', email: 'admin@t.local', password: 'admin123', rol: 'Administrador' };

async function loginAdmin() {
  await request(app).post('/api/auth/register').send(adminCreds);
  const res = await request(app).post('/api/auth/login').send({ email: adminCreds.email, password: adminCreds.password });
  return { token: res.body.token, user: res.body.usuario };
}

test('admin can register garantia which decrements stock and is retrievable', async () => {
  const { token } = await loginAdmin();

  // create product
  const prod = { nombre: 'GProd', categoria: 'G', costo: 50, precioVenta: 100, stock: 3 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  expect(resCreate.statusCode).toBe(201);
  const productoId = resCreate.body.producto._id;

  // register garantia
  const body = { productoId, cantidad: 2, motivo: 'Falla', vendedorId: resCreate.body.producto._id };
  const resG = await request(app).post('/api/garantias').set('Authorization', `Bearer ${token}`).send(body);
  expect(resG.statusCode).toBe(201);
  expect(resG.body.garantia.cantidad).toBe(2);

  // product stock should be 1
  const list = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
  expect(list.body[0].stock).toBe(1);

  // get garantias as admin
  const resList = await request(app).get('/api/garantias').set('Authorization', `Bearer ${token}`);
  expect(resList.statusCode).toBe(200);
  expect(Array.isArray(resList.body)).toBe(true);
});
