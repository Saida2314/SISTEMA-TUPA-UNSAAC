const request = require('supertest');
const app = require('../src/app');
const { sql, poolPromise } = require('../src/config/db');

describe('Pruebas del Sistema TUPA UNSAAC', () => {
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

  test('Debe conectar correctamente a SQL Server', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT 1 AS conectado
    `);

    expect(resultado.recordset[0].conectado).toBe(1);
  });

  test('Debe existir la tabla roles con roles registrados', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT COUNT(*) AS total_roles
      FROM roles
    `);

    expect(resultado.recordset[0].total_roles).toBeGreaterThanOrEqual(4);
  });

  test('Debe listar trámites públicos', async () => {
    const respuesta = await request(app)
      .get('/api/public/tramites');

    expect(respuesta.statusCode).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
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
});