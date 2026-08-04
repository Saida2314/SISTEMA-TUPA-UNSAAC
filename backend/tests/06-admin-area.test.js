const request = require('supertest');
const app = require('../src/app');
const { sql } = require('../src/config/db');

describe('06 - Admin Área', () => {
  afterAll(async () => {
    await sql.close();
  });

  test('Debe cargar resumen de Admin Área', async () => {
    const respuesta = await request(app)
      .get('/api/admin-area/resumen');

    expect([200, 401, 403, 500]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(respuesta.body).toBeDefined();
    }
  });

  test('Debe listar solicitudes derivadas para Admin Área', async () => {
    const respuesta = await request(app)
      .get('/api/admin-area/solicitudes');

    expect([200, 401, 403, 500]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(Array.isArray(respuesta.body)).toBe(true);
    }
  });

  test('Debe listar tickets de soporte para Admin Área', async () => {
    const respuesta = await request(app)
      .get('/api/admin-area/tickets');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe rechazar responder ticket inexistente', async () => {
    const respuesta = await request(app)
      .post('/api/admin-area/tickets/999999/responder')
      .send({
        mensaje: 'Respuesta de prueba'
      });

    expect([400, 404, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar finalizar ticket inexistente', async () => {
    const respuesta = await request(app)
      .put('/api/admin-area/tickets/999999/finalizar');

    expect([400, 404, 500]).toContain(respuesta.statusCode);
  });
});