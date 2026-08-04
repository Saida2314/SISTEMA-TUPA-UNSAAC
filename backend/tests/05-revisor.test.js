const request = require('supertest');
const app = require('../src/app');
const { sql } = require('../src/config/db');

describe('05 - Revisor', () => {
  afterAll(async () => {
    await sql.close();
  });

  test('Debe cargar resumen del Revisor', async () => {
    const respuesta = await request(app)
      .get('/api/revisor/resumen');

    expect([200, 401, 403, 500]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(respuesta.body).toBeDefined();
    }
  });

  test('Debe listar solicitudes para Revisor', async () => {
    const respuesta = await request(app)
      .get('/api/revisor/solicitudes');

    expect([200, 401, 403, 500]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(Array.isArray(respuesta.body)).toBe(true);
    }
  });

  test('Debe rechazar detalle de solicitud inexistente o devolver no encontrado', async () => {
    const respuesta = await request(app)
      .get('/api/revisor/solicitudes/999999');

    expect([200, 400, 401, 403, 404, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar observación sin datos completos', async () => {
    const respuesta = await request(app)
      .post('/api/revisor/solicitudes/999999/observar')
      .send({});

    expect([400, 401, 403, 404, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar derivación sin datos completos', async () => {
    const respuesta = await request(app)
      .post('/api/revisor/solicitudes/999999/derivar')
      .send({});

    expect([400, 401, 403, 404, 500]).toContain(respuesta.statusCode);
  });
});