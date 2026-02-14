const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

const adminCreds = { nombre: 'Admin', email: 'admin2@t.local', password: 'admin123', rol: 'Administrador' };

async function loginAdmin() {
  await request(app).post('/api/auth/register').send(adminCreds);
  const res = await request(app).post('/api/auth/login').send({ email: adminCreds.email, password: adminCreds.password });
  return { token: res.body.token, user: res.body.usuario };
}

test('reportes show correct totals after ventas and perdidas', async () => {
  const { token, user } = await loginAdmin();

  // create product
  const prod = { nombre: 'RProd', categoria: 'R', costo: 10, precioVenta: 20, stock: 10 };
  const resCreate = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  const productoId = resCreate.body.producto._id;

  // create two sales
  const sale1 = { vendedorId: user.id, productosVendidos: [{ productoId, cantidad: 2 }] };
  await request(app).post('/api/ventas').set('Authorization', `Bearer ${token}`).send(sale1);
  const sale2 = { vendedorId: user.id, productosVendidos: [{ productoId, cantidad: 3 }] };
  await request(app).post('/api/ventas').set('Authorization', `Bearer ${token}`).send(sale2);

  // create a perdida
  await request(app).post('/api/garantias').set('Authorization', `Bearer ${token}`).send({ productoId, cantidad: 1, motivo: 'Fallo' });

  const resBalance = await request(app).get('/api/reportes/balance').set('Authorization', `Bearer ${token}`);
  expect(resBalance.statusCode).toBe(200);
  expect(resBalance.body).toHaveProperty('ingresos');
  expect(resBalance.body).toHaveProperty('totalPerdido');
});
