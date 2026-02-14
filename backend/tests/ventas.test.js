const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

const adminCreds = { nombre: 'Admin', email: 'a@a.local', password: 'admin123', rol: 'Administrador' };

async function loginAdmin() {
  await request(app).post('/api/auth/register').send(adminCreds);
  const res = await request(app).post('/api/auth/login').send({ email: adminCreds.email, password: adminCreds.password });
  return { token: res.body.token, user: res.body.usuario };
}

test('register sale happy path decrements stock', async () => {
  const { token, user } = await loginAdmin();

  // create product
  const prod = { nombre: 'ProdV', categoria: 'Cat', costo: 10, precioVenta: 20, stock: 5 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  expect(resCreate.statusCode).toBe(201);
  const productoId = resCreate.body.producto._id;

  // register sale
  const sale = { vendedorId: user.id, productosVendidos: [{ productoId, cantidad: 2 }] };
  const resSale = await request(app).post('/api/ventas').set('Authorization', `Bearer ${token}`).send(sale);
  expect(resSale.statusCode).toBe(201);

  // check stock
  const resList = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
  expect(resList.body[0].stock).toBe(3);
});

test('register sale with insufficient stock returns 409 and does not change stock', async () => {
  const { token, user } = await loginAdmin();
  const prod = { nombre: 'ProdV2', categoria: 'Cat', costo: 10, precioVenta: 20, stock: 1 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  const productoId = resCreate.body.producto._id;

  const sale = { vendedorId: user.id, productosVendidos: [{ productoId, cantidad: 2 }] };
  const resSale = await request(app).post('/api/ventas').set('Authorization', `Bearer ${token}`).send(sale);
  expect(resSale.statusCode).toBe(409);

  // stock should remain 1
  const resList = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
  expect(resList.body[0].stock).toBe(1);
});
