const request = require('supertest');
const app = require('../src/app');
const { sql } = require('../src/config/db');

describe('03 - Rutas públicas y catálogo de trámites', () => {
  afterAll(async () => {
    await sql.close();
  });

  test('GET / debe responder que la API funciona', async () => {
    const respuesta = await request(app).get('/');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toHaveProperty('mensaje');
    expect(respuesta.body.mensaje).toContain('API del Sistema TUPA UNSAAC');
  });

  test('Debe listar trámites públicos', async () => {
    const respuesta = await request(app)
      .get('/api/public/tramites');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe responder al buscar trámites públicos', async () => {
    const respuesta = await request(app)
      .get('/api/public/tramites?buscar=certificado');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
  });

  test('Debe responder al filtrar trámites por categoría si la ruta lo permite', async () => {
    const respuesta = await request(app)
      .get('/api/public/tramites?categoria=Pregrado');

    expect([200, 400, 404]).toContain(respuesta.statusCode);

    if (respuesta.statusCode === 200) {
      expect(Array.isArray(respuesta.body)).toBe(true);
    }
  });
});