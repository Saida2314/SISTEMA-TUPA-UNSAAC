const request = require('supertest');
const app = require('../src/app');
const { sql, poolPromise } = require('../src/config/db');

describe('04 - Admin General', () => {
  afterAll(async () => {
    await sql.close();
  });

  test('Debe cargar el panel del Admin General', async () => {
    const respuesta = await request(app)
      .get('/api/admin-general/panel');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toHaveProperty('resumen');
    expect(respuesta.body).toHaveProperty('tramitesRecientes');
    expect(respuesta.body).toHaveProperty('usuariosRecientes');

    expect(respuesta.body.resumen).toHaveProperty('total_tramites');
    expect(respuesta.body.resumen).toHaveProperty('total_usuarios');
    expect(respuesta.body.resumen).toHaveProperty('revisores');
    expect(respuesta.body.resumen).toHaveProperty('admins_area');
  });

  test('Debe listar categorías para Admin General', async () => {
    const respuesta = await request(app)
      .get('/api/admin-general/categorias');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe listar trámites para Admin General', async () => {
    const respuesta = await request(app)
      .get('/api/admin-general/tramites');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe listar usuarios para Admin General', async () => {
    const respuesta = await request(app)
      .get('/api/admin-general/usuarios');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe listar usuarios filtrados por rol REVISOR', async () => {
    const respuesta = await request(app)
      .get('/api/admin-general/usuarios?rol=REVISOR');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe existir al menos un rol administrativo en la base de datos', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT COUNT(*) AS total
      FROM roles
      WHERE nombre IN ('REVISOR', 'ADMIN_AREA', 'ADMIN_GENERAL')
    `);

    expect(resultado.recordset[0].total).toBeGreaterThanOrEqual(3);
  });
});