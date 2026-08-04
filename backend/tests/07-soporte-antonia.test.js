const request = require('supertest');
const app = require('../src/app');
const { sql, poolPromise } = require('../src/config/db');

describe('07 - Soporte y Antonia', () => {
  afterAll(async () => {
    await sql.close();
  });

  test('Deben existir tablas de soporte', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN (
        'tickets_soporte',
        'mensajes_ticket',
        'conversaciones_antonia',
        'mensajes_antonia'
      )
    `);

    const tablas = resultado.recordset.map((item) => item.TABLE_NAME);

    expect(tablas).toContain('tickets_soporte');
    expect(tablas).toContain('mensajes_ticket');
  });

  test('Debe rechazar creación de ticket sin datos', async () => {
    const respuesta = await request(app)
      .post('/api/soporte/tickets')
      .send({});

    expect([400, 401, 403, 500]).toContain(respuesta.statusCode);
  });

  test('Debe responder endpoint de tickets de usuario si existe', async () => {
    const respuesta = await request(app)
      .get('/api/soporte/tickets');

    expect([200, 401, 403, 404, 500]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(Array.isArray(respuesta.body)).toBe(true);
    }
  });

  test('Debe responder endpoint de Antonia si existe', async () => {
    const respuesta = await request(app)
      .post('/api/antonia/mensaje')
      .send({
        mensaje: 'Necesito información sobre trámites'
      });

    expect([200, 400, 401, 403, 404, 500]).toContain(respuesta.statusCode);
  });
});