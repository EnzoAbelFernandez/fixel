const request = require('supertest');
const { app } = require('../app');
const setup = require('./setup');
const fs = require('fs');
const path = require('path');

beforeAll(async () => await setup.connect());
afterAll(async () => await setup.closeDatabase());
afterEach(async () => await setup.clearDatabase());

test('vendedor cannot create product (403)', async () => {
  const user = { nombre: 'Vend', email: 'v@t.local', password: 'vend123', rol: 'Vendedor' };
  await request(app).post('/api/auth/register').send(user);
  const resLogin = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  const token = resLogin.body.token;

  const prod = { nombre: 'X', categoria: 'Y', costo: 1, precioVenta: 2, stock: 1 };
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${token}`).send(prod);
  expect(res.statusCode).toBe(403);
});

test('bulk CSV upload creates products', async () => {
  // register admin
  const admin = { nombre: 'AdminB', email: 'adminb@t.local', password: 'admin123', rol: 'Administrador' };
  await request(app).post('/api/auth/register').send(admin);
  const resLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password: admin.password });
  const token = resLogin.body.token;

  // prepare CSV
  const csv = 'nombre,categoria,codigoBarras,costo,precioVenta,stock,codigoInterno\nBulk1,BulkCat,123,10,20,5,BK1\nBulk2,BulkCat,,15,30,3,BK2\n';
  const tmpPath = path.join(__dirname, 'tmp_bulk.csv');
  fs.writeFileSync(tmpPath, csv);

  const res = await request(app).post('/api/productos/bulk/upload').set('Authorization', `Bearer ${token}`).attach('file', tmpPath);
  expect(res.statusCode).toBe(200);
  expect(res.body.created + res.body.updated).toBeGreaterThan(0);

  fs.unlinkSync(tmpPath);
});
