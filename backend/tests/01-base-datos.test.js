const { sql, poolPromise } = require('../src/config/db');

describe('01 - Base de datos SQL Server', () => {
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

  test('Debe estar conectado a la base de datos SistemaTupaUnsaac', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT DB_NAME() AS base_datos
    `);

    expect(resultado.recordset[0].base_datos).toBe('SistemaTupaUnsaac');
  });

  test('Deben existir las tablas principales', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    const tablas = resultado.recordset.map((item) => item.TABLE_NAME);

    expect(tablas).toContain('usuarios');
    expect(tablas).toContain('roles');
    expect(tablas).toContain('categorias_tramite');
    expect(tablas).toContain('tramites');
    expect(tablas).toContain('solicitudes');
  });

  test('La tabla usuarios debe tener columnas necesarias', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'usuarios'
    `);

    const columnas = resultado.recordset.map((item) => item.COLUMN_NAME);

    expect(columnas).toContain('id_usuario');
    expect(columnas).toContain('id_rol');
    expect(columnas).toContain('nombres');
    expect(columnas).toContain('apellidos');
    expect(columnas).toContain('dni');
    expect(columnas).toContain('correo');
    expect(columnas).toContain('password_hash');
    expect(columnas).toContain('estado');
    expect(columnas).toContain('fecha_registro');
  });

  test('La tabla roles debe tener columnas necesarias', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'roles'
    `);

    const columnas = resultado.recordset.map((item) => item.COLUMN_NAME);

    expect(columnas).toContain('id_rol');
    expect(columnas).toContain('nombre');
    expect(columnas).toContain('descripcion');
  });

  test('Deben existir los roles principales', async () => {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT nombre
      FROM roles
    `);

    const roles = resultado.recordset.map((item) => item.nombre);

    expect(roles).toContain('USUARIO');
    expect(roles).toContain('REVISOR');
    expect(roles).toContain('ADMIN_GENERAL');
    expect(roles).toContain('ADMIN_AREA');
  });
});