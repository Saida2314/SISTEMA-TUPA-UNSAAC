const request = require('supertest');
const app = require('../src/app');
const { sql, poolPromise } = require('../src/config/db');

describe('02 - Autenticación y registro', () => {
  const numero = Date.now().toString().slice(-8);

  const usuarioPrueba = {
    nombres: 'Usuario',
    apellidos: 'Prueba',
    dni: numero,
    correo: `usuario.prueba.${numero}@unsaac.edu.pe`,
    password: 'Usuario123*'
  };

  afterAll(async () => {
    await sql.close();
  });

  test('Debe rechazar registro sin datos', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({});

    expect([400, 409, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar correo no institucional', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({
        nombres: 'Usuario',
        apellidos: 'Externo',
        dni: '12345678',
        correo: 'usuario@gmail.com',
        password: 'Usuario123*'
      });

    expect([400, 409, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar DNI inválido', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({
        nombres: 'Usuario',
        apellidos: 'Prueba',
        dni: '123',
        correo: `dni.invalido.${numero}@unsaac.edu.pe`,
        password: 'Usuario123*'
      });

    expect([400, 409, 500]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar contraseña insegura', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({
        nombres: 'Usuario',
        apellidos: 'Prueba',
        dni: '87654321',
        correo: `password.invalido.${numero}@unsaac.edu.pe`,
        password: '123456'
      });

    expect([400, 409, 500]).toContain(respuesta.statusCode);
  });

  test('Debe registrar un nuevo usuario público', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send(usuarioPrueba);

    expect([200, 201]).toContain(respuesta.statusCode);
    expect(respuesta.body).toHaveProperty('mensaje');
  });

  test('Debe guardar el usuario registrado en la base de datos', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('correo', sql.NVarChar, usuarioPrueba.correo)
      .query(`
        SELECT 
          u.id_usuario,
          u.nombres,
          u.apellidos,
          u.dni,
          u.correo,
          r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.correo = @correo
      `);

    expect(resultado.recordset.length).toBe(1);
    expect(resultado.recordset[0].correo).toBe(usuarioPrueba.correo);
    expect(resultado.recordset[0].rol).toBe('USUARIO');
  });

  test('Debe iniciar sesión con el usuario registrado', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        correo: usuarioPrueba.correo,
        password: usuarioPrueba.password,
        rolSeleccionado: 'USUARIO'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body).toHaveProperty('token');
    expect(respuesta.body).toHaveProperty('usuario');
    expect(respuesta.body.usuario.rol).toBe('USUARIO');
  });

  test('Debe rechazar login con contraseña incorrecta', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        correo: usuarioPrueba.correo,
        password: 'Incorrecta123*',
        rolSeleccionado: 'USUARIO'
      });

    expect([400, 401]).toContain(respuesta.statusCode);
  });

  test('Debe rechazar login con rol incorrecto', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        correo: usuarioPrueba.correo,
        password: usuarioPrueba.password,
        rolSeleccionado: 'REVISOR'
      });

    expect([400, 401, 403]).toContain(respuesta.statusCode);
  });
});