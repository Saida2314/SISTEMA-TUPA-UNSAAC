const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/db');

function validarCorreoInstitucional(correo) {
  return /^[a-zA-Z0-9._%+-]+@unsaac\.edu\.pe$/.test(correo);
}

function validarDni(dni) {
  return /^[0-9]{8}$/.test(dni);
}

function validarPasswordSegura(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function generarCodigoUsuario() {
  const anio = new Date().getFullYear().toString().slice(-2);
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let bloque = '';

  for (let i = 0; i < 6; i++) {
    bloque += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  return `USU-${anio}-${bloque}`;
}

async function generarCodigoUsuarioUnico(pool) {
  let codigo = generarCodigoUsuario();
  let existe = true;

  while (existe) {
    const resultado = await pool.request()
      .input('codigo_usuario', sql.NVarChar, codigo)
      .query(`
        SELECT id_usuario
        FROM usuarios
        WHERE codigo_usuario = @codigo_usuario
      `);

    if (resultado.recordset.length === 0) {
      existe = false;
    } else {
      codigo = generarCodigoUsuario();
    }
  }

  return codigo;
}

async function obtenerIdRol(pool, nombreRol) {
  const resultado = await pool.request()
    .input('nombre', sql.NVarChar, nombreRol)
    .query(`
      SELECT id_rol
      FROM roles
      WHERE nombre = @nombre
    `);

  if (resultado.recordset.length === 0) {
    return null;
  }

  return resultado.recordset[0].id_rol;
}

function crearToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '8h'
    }
  );
}

async function registrar(req, res) {
  try {
    const {
      nombres,
      apellidos,
      dni,
      correo,
      password
    } = req.body;

    if (!nombres || !apellidos || !dni || !correo || !password) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios.'
      });
    }

    if (nombres.trim().length < 2) {
      return res.status(400).json({
        mensaje: 'El nombre debe tener al menos 2 caracteres.'
      });
    }

    if (apellidos.trim().length < 2) {
      return res.status(400).json({
        mensaje: 'El apellido debe tener al menos 2 caracteres.'
      });
    }

    if (!validarDni(dni.trim())) {
      return res.status(400).json({
        mensaje: 'El DNI debe tener exactamente 8 dígitos numéricos.'
      });
    }

    if (!validarCorreoInstitucional(correo.trim())) {
      return res.status(400).json({
        mensaje: 'Debe usar un correo institucional válido: usuario@unsaac.edu.pe'
      });
    }

    if (!validarPasswordSegura(password)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
      });
    }

    const pool = await poolPromise;

    const correoNormalizado = correo.trim().toLowerCase();

    const usuarioExistente = await pool.request()
      .input('correo', sql.NVarChar, correoNormalizado)
      .input('dni', sql.NVarChar, dni.trim())
      .query(`
        SELECT id_usuario
        FROM usuarios
        WHERE correo = @correo OR dni = @dni
      `);

    if (usuarioExistente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: 'Ya existe un usuario con ese correo o DNI.'
      });
    }

    const idRolUsuario = await obtenerIdRol(pool, 'USUARIO');

    if (!idRolUsuario) {
      return res.status(500).json({
        mensaje: 'No existe el rol USUARIO en la base de datos.'
      });
    }

    const codigoUsuario = await generarCodigoUsuarioUnico(pool);
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('codigo_usuario', sql.NVarChar, codigoUsuario)
      .input('id_rol', sql.Int, idRolUsuario)
      .input('nombres', sql.NVarChar, nombres.trim())
      .input('apellidos', sql.NVarChar, apellidos.trim())
      .input('dni', sql.NVarChar, dni.trim())
      .input('correo', sql.NVarChar, correoNormalizado)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO usuarios (
          codigo_usuario,
          id_rol,
          nombres,
          apellidos,
          dni,
          correo,
          password_hash,
          estado
        )
        VALUES (
          @codigo_usuario,
          @id_rol,
          @nombres,
          @apellidos,
          @dni,
          @correo,
          @password_hash,
          'ACTIVO'
        )
      `);

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      codigo_usuario: codigoUsuario
    });
  } catch (error) {
    console.error('Error al registrar usuario:');
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al registrar usuario',
      detalle: error.message
    });
  }
}

async function login(req, res) {
  try {
    const {
      correo,
      password,
      rolSeleccionado
    } = req.body;

    if (!correo || !password || !rolSeleccionado) {
      return res.status(400).json({
        mensaje: 'Debe ingresar correo, contraseña y tipo de usuario.'
      });
    }

    const pool = await poolPromise;

    const correoNormalizado = correo.trim().toLowerCase();

    const resultado = await pool.request()
      .input('correo', sql.NVarChar, correoNormalizado)
      .query(`
        SELECT
          u.id_usuario,
          u.codigo_usuario,
          u.nombres,
          u.apellidos,
          u.dni,
          u.correo,
          u.password_hash,
          u.estado,
          r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.correo = @correo
      `);

    if (resultado.recordset.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    const usuario = resultado.recordset[0];

    if (usuario.estado !== 'ACTIVO') {
      return res.status(403).json({
        mensaje: 'La cuenta no está activa.'
      });
    }

    if (usuario.rol !== rolSeleccionado) {
      return res.status(403).json({
        mensaje: `La cuenta no corresponde al rol seleccionado. Rol registrado: ${usuario.rol}`
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    await pool.request()
      .input('id_usuario', sql.Int, usuario.id_usuario)
      .query(`
        UPDATE usuarios
        SET ultimo_acceso = SYSDATETIME()
        WHERE id_usuario = @id_usuario
      `);

    const usuarioRespuesta = {
      id_usuario: usuario.id_usuario,
      codigo_usuario: usuario.codigo_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      dni: usuario.dni,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado
    };

    const token = crearToken(usuarioRespuesta);

    return res.json({
      mensaje: 'Inicio de sesión correcto.',
      token,
      usuario: usuarioRespuesta
    });
  } catch (error) {
    console.error('Error al iniciar sesión:');
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error interno al iniciar sesión.',
      detalle: error.message
    });
  }
}

async function recuperarPassword(req, res) {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        mensaje: 'Debe ingresar su correo institucional.'
      });
    }

    const pool = await poolPromise;

    const correoNormalizado = correo.trim().toLowerCase();

    const usuarioResultado = await pool.request()
      .input('correo', sql.NVarChar, correoNormalizado)
      .query(`
        SELECT id_usuario, correo
        FROM usuarios
        WHERE correo = @correo
      `);

    if (usuarioResultado.recordset.length === 0) {
      return res.json({
        mensaje: 'Si el correo está registrado, se enviarán las instrucciones de recuperación.'
      });
    }

    const usuario = usuarioResultado.recordset[0];

    const tokenPlano = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(tokenPlano)
      .digest('hex');

    const fechaExpiracion = new Date(Date.now() + 1000 * 60 * 30);

    await pool.request()
      .input('id_usuario', sql.Int, usuario.id_usuario)
      .input('token_hash', sql.NVarChar, tokenHash)
      .input('fecha_expiracion', sql.DateTime2, fechaExpiracion)
      .query(`
        INSERT INTO recuperacion_password (
          id_usuario,
          token_hash,
          fecha_expiracion,
          usado
        )
        VALUES (
          @id_usuario,
          @token_hash,
          @fecha_expiracion,
          0
        )
      `);

    return res.json({
      mensaje: 'Si el correo está registrado, se enviarán las instrucciones de recuperación.',
      token_prueba: tokenPlano
    });
  } catch (error) {
    console.error('Error en recuperación de contraseña:');
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error interno al solicitar recuperación de contraseña.',
      detalle: error.message
    });
  }
}

async function restablecerPassword(req, res) {
  try {
    const token = req.params.token || req.body.token;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        mensaje: 'Debe enviar token y nueva contraseña.'
      });
    }

    if (!validarPasswordSegura(password)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const pool = await poolPromise;

    const tokenResultado = await pool.request()
      .input('token_hash', sql.NVarChar, tokenHash)
      .query(`
        SELECT
          id_recuperacion,
          id_usuario,
          fecha_expiracion,
          usado
        FROM recuperacion_password
        WHERE token_hash = @token_hash
      `);

    if (tokenResultado.recordset.length === 0) {
      return res.status(400).json({
        mensaje: 'Token inválido o expirado.'
      });
    }

    const registro = tokenResultado.recordset[0];

    if (registro.usado) {
      return res.status(400).json({
        mensaje: 'Este token ya fue utilizado.'
      });
    }

    if (new Date(registro.fecha_expiracion) < new Date()) {
      return res.status(400).json({
        mensaje: 'El token ha expirado.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('id_usuario', sql.Int, registro.id_usuario)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE usuarios
        SET password_hash = @password_hash
        WHERE id_usuario = @id_usuario
      `);

    await pool.request()
      .input('id_recuperacion', sql.Int, registro.id_recuperacion)
      .query(`
        UPDATE recuperacion_password
        SET usado = 1
        WHERE id_recuperacion = @id_recuperacion
      `);

    return res.json({
      mensaje: 'Contraseña restablecida correctamente.'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:');
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error interno al restablecer contraseña.',
      detalle: error.message
    });
  }
}

module.exports = {
  login,
  registrar,
  recuperarPassword,
  restablecerPassword,

  registrarUsuario: registrar,
  solicitarRecuperacionPassword: recuperarPassword,
  recuperarContrasena: recuperarPassword,
  restablecerContrasena: restablecerPassword
};