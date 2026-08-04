const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../config/db');

function generarCodigoSimple(prefijo) {
  const anio = new Date().getFullYear().toString().slice(-2);
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let bloque = '';

  for (let i = 0; i < 6; i++) {
    bloque += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  return `${prefijo}-${anio}-${bloque}`;
}

function generarCodigoTramite(categoria) {
  if (categoria === 'Pregrado') return generarCodigoSimple('PG');
  if (categoria === 'Posgrado') return generarCodigoSimple('POS');
  if (categoria === 'Administrativo') return generarCodigoSimple('ADM');

  return generarCodigoSimple('TRA');
}

async function generarCodigoUnico(pool, tabla, columna, generador) {
  let codigo = generador();
  let existe = true;

  while (existe) {
    const resultado = await pool.request()
      .input('codigo', sql.NVarChar, codigo)
      .query(`
        SELECT ${columna}
        FROM ${tabla}
        WHERE ${columna} = @codigo
      `);

    if (resultado.recordset.length === 0) {
      existe = false;
    } else {
      codigo = generador();
    }
  }

  return codigo;
}

function validarCorreoInstitucional(correo) {
  return /^[a-zA-Z0-9._%+-]+@unsaac\.edu\.pe$/.test(correo);
}

function validarDni(dni) {
  return /^[0-9]{8}$/.test(dni);
}

function validarPasswordSegura(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

async function obtenerPanelAdminGeneral(req, res) {
  try {
    const pool = await poolPromise;

    const resumenResultado = await pool.request().query(`
      SELECT
        ISNULL((SELECT COUNT(*) FROM tramites), 0) AS total_tramites,

        ISNULL((
          SELECT COUNT(*)
          FROM tramites
          WHERE activo = 1
        ), 0) AS tramites_activos,

        ISNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios,

        ISNULL((
          SELECT COUNT(*)
          FROM usuarios
          WHERE estado = 'PENDIENTE'
        ), 0) AS usuarios_pendientes,

        ISNULL((
          SELECT COUNT(*)
          FROM usuarios u
          INNER JOIN roles r ON u.id_rol = r.id_rol
          WHERE r.nombre = 'REVISOR'
        ), 0) AS revisores,

        ISNULL((
          SELECT COUNT(*)
          FROM usuarios u
          INNER JOIN roles r ON u.id_rol = r.id_rol
          WHERE r.nombre = 'ADMIN_AREA'
        ), 0) AS admins_area,

        ISNULL((
          SELECT COUNT(*)
          FROM solicitudes
          WHERE estado = 'REGISTRADO'
        ), 0) AS solicitudes_registradas,

        ISNULL((
          SELECT COUNT(*)
          FROM solicitudes
          WHERE estado = 'DERIVADO'
        ), 0) AS solicitudes_derivadas
    `);

    const tramitesResultado = await pool.request().query(`
      SELECT TOP 5
        t.id_tramite,
        t.codigo,
        t.codigo_publico_tramite,
        t.nombre,
        t.costo,
        t.plazo_dias,
        t.tipo_plazo,
        t.activo,
        c.nombre AS categoria
      FROM tramites t
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      ORDER BY t.id_tramite DESC
    `);

    const usuariosResultado = await pool.request().query(`
      SELECT TOP 5
        u.id_usuario,
        CONCAT('USU-', u.id_usuario) AS codigo_usuario,
        u.nombres,
        u.apellidos,
        u.dni,
        u.correo,
        r.nombre AS rol,
        u.estado,
        u.fecha_registro
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.fecha_registro DESC
    `);

    return res.json({
      resumen: resumenResultado.recordset[0],
      tramitesRecientes: tramitesResultado.recordset,
      usuariosRecientes: usuariosResultado.recordset
    });
  } catch (error) {
    console.error('Error panel Admin General:');
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error interno al cargar el panel del Admin General.',
      detalle: error.message
    });
  }
}

async function listarCategorias(req, res) {
  try {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT
        id_categoria,
        nombre,
        descripcion
      FROM categorias_tramite
      ORDER BY id_categoria ASC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar categorías:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar categorías.',
      detalle: error.message
    });
  }
}

async function listarTramitesAdmin(req, res) {
  try {
    const { categoria, buscar } = req.query;

    const pool = await poolPromise;

    let consulta = `
      SELECT
        t.id_tramite,
        t.codigo,
        t.codigo_publico_tramite,
        t.nombre,
        t.descripcion,
        t.costo,
        t.plazo_dias,
        t.tipo_plazo,
        t.tipo_entrega,
        t.activo,
        c.id_categoria,
        c.nombre AS categoria
      FROM tramites t
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (categoria && categoria !== 'TODOS') {
      consulta += ` AND c.nombre = @categoria`;
      request.input('categoria', sql.NVarChar, categoria);
    }

    if (buscar && buscar.trim() !== '') {
      consulta += `
        AND (
          t.codigo COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR t.codigo_publico_tramite COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR t.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR c.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar
        )
      `;

      request.input('buscar', sql.NVarChar, `%${buscar.trim()}%`);
    }

    consulta += `
      ORDER BY
        c.id_categoria ASC,
        t.id_tramite ASC
    `;

    const resultado = await request.query(consulta);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar trámites Admin:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar trámites.',
      detalle: error.message
    });
  }
}

async function crearTramiteAdmin(req, res) {
  try {
    const {
      id_categoria,
      nombre,
      descripcion,
      costo,
      plazo_dias,
      tipo_plazo,
      tipo_entrega
    } = req.body;

    if (!id_categoria || !nombre || !descripcion) {
      return res.status(400).json({
        mensaje: 'Debe completar categoría, nombre y descripción del trámite.'
      });
    }

    const pool = await poolPromise;

    const categoriaResultado = await pool.request()
      .input('id_categoria', sql.Int, Number(id_categoria))
      .query(`
        SELECT id_categoria, nombre
        FROM categorias_tramite
        WHERE id_categoria = @id_categoria
      `);

    if (categoriaResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Categoría no encontrada.'
      });
    }

    const categoriaNombre = categoriaResultado.recordset[0].nombre;

    const codigo = await generarCodigoUnico(
      pool,
      'tramites',
      'codigo',
      () => generarCodigoTramite(categoriaNombre)
    );

    await pool.request()
      .input('id_categoria', sql.Int, Number(id_categoria))
      .input('codigo', sql.NVarChar, codigo)
      .input('codigo_publico_tramite', sql.NVarChar, codigo)
      .input('nombre', sql.NVarChar, nombre.trim())
      .input('descripcion', sql.NVarChar, descripcion.trim())
      .input('costo', sql.Decimal(10, 2), Number(costo || 0))
      .input('plazo_dias', sql.Int, Number(plazo_dias || 1))
      .input('tipo_plazo', sql.NVarChar, tipo_plazo || 'Días Hábiles')
      .input('tipo_entrega', sql.NVarChar, tipo_entrega || 'MIXTA')
      .query(`
        INSERT INTO tramites (
          id_categoria,
          codigo,
          codigo_publico_tramite,
          nombre,
          descripcion,
          costo,
          plazo_dias,
          tipo_plazo,
          tipo_entrega,
          activo
        )
        VALUES (
          @id_categoria,
          @codigo,
          @codigo_publico_tramite,
          @nombre,
          @descripcion,
          @costo,
          @plazo_dias,
          @tipo_plazo,
          @tipo_entrega,
          1
        )
      `);

    return res.status(201).json({
      mensaje: 'Trámite creado correctamente.',
      codigo
    });
  } catch (error) {
    console.error('Error al crear trámite:', error);

    return res.status(500).json({
      mensaje: 'Error interno al crear el trámite.',
      detalle: error.message
    });
  }
}

async function actualizarTramiteAdmin(req, res) {
  try {
    const { id_tramite } = req.params;

    const {
      id_categoria,
      nombre,
      descripcion,
      costo,
      plazo_dias,
      tipo_plazo,
      tipo_entrega,
      activo
    } = req.body;

    if (!id_categoria || !nombre || !descripcion) {
      return res.status(400).json({
        mensaje: 'Debe completar categoría, nombre y descripción del trámite.'
      });
    }

    const pool = await poolPromise;

    const existe = await pool.request()
      .input('id_tramite', sql.Int, Number(id_tramite))
      .query(`
        SELECT id_tramite
        FROM tramites
        WHERE id_tramite = @id_tramite
      `);

    if (existe.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Trámite no encontrado.'
      });
    }

    await pool.request()
      .input('id_tramite', sql.Int, Number(id_tramite))
      .input('id_categoria', sql.Int, Number(id_categoria))
      .input('nombre', sql.NVarChar, nombre.trim())
      .input('descripcion', sql.NVarChar, descripcion.trim())
      .input('costo', sql.Decimal(10, 2), Number(costo || 0))
      .input('plazo_dias', sql.Int, Number(plazo_dias || 1))
      .input('tipo_plazo', sql.NVarChar, tipo_plazo || 'Días Hábiles')
      .input('tipo_entrega', sql.NVarChar, tipo_entrega || 'MIXTA')
      .input('activo', sql.Bit, activo ? 1 : 0)
      .query(`
        UPDATE tramites
        SET
          id_categoria = @id_categoria,
          nombre = @nombre,
          descripcion = @descripcion,
          costo = @costo,
          plazo_dias = @plazo_dias,
          tipo_plazo = @tipo_plazo,
          tipo_entrega = @tipo_entrega,
          activo = @activo
        WHERE id_tramite = @id_tramite
      `);

    return res.json({
      mensaje: 'Trámite actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar trámite:', error);

    return res.status(500).json({
      mensaje: 'Error interno al actualizar el trámite.',
      detalle: error.message
    });
  }
}

async function cambiarEstadoTramiteAdmin(req, res) {
  try {
    const { id_tramite } = req.params;
    const { activo } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input('id_tramite', sql.Int, Number(id_tramite))
      .input('activo', sql.Bit, activo ? 1 : 0)
      .query(`
        UPDATE tramites
        SET activo = @activo
        WHERE id_tramite = @id_tramite
      `);

    return res.json({
      mensaje: activo
        ? 'Trámite activado correctamente.'
        : 'Trámite desactivado correctamente.'
    });
  } catch (error) {
    console.error('Error al cambiar estado trámite:', error);

    return res.status(500).json({
      mensaje: 'Error interno al cambiar el estado del trámite.',
      detalle: error.message
    });
  }
}

async function listarUsuariosAdmin(req, res) {
  try {
    const { rol, estado, buscar } = req.query;

    const pool = await poolPromise;

    let consulta = `
      SELECT
        u.id_usuario,
        CONCAT('USU-', u.id_usuario) AS codigo_usuario,
        u.nombres,
        u.apellidos,
        u.dni,
        u.correo,
        r.nombre AS rol,
        u.estado,
        u.fecha_registro
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (rol && rol !== 'TODOS') {
      consulta += ` AND r.nombre = @rol`;
      request.input('rol', sql.NVarChar, rol);
    }

    if (estado && estado !== 'TODOS') {
      consulta += ` AND u.estado = @estado`;
      request.input('estado', sql.NVarChar, estado);
    }

    if (buscar && buscar.trim() !== '') {
      consulta += `
        AND (
          u.nombres COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.apellidos COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.dni LIKE @buscar
          OR u.correo COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR CONCAT('USU-', u.id_usuario) LIKE @buscar
        )
      `;

      request.input('buscar', sql.NVarChar, `%${buscar.trim()}%`);
    }

    consulta += `
      ORDER BY u.fecha_registro DESC
    `;

    const resultado = await request.query(consulta);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar usuarios Admin:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar usuarios.',
      detalle: error.message
    });
  }
}

async function crearUsuarioAdmin(req, res) {
  try {
    const {
      nombres,
      apellidos,
      dni,
      correo,
      password,
      rol
    } = req.body;

    if (!nombres || !apellidos || !dni || !correo || !password || !rol) {
      return res.status(400).json({
        mensaje: 'Debe completar todos los campos del usuario.'
      });
    }

    if (!validarCorreoInstitucional(correo)) {
      return res.status(400).json({
        mensaje: 'El correo debe ser institucional: @unsaac.edu.pe'
      });
    }

    if (!validarDni(dni)) {
      return res.status(400).json({
        mensaje: 'El DNI debe tener 8 dígitos.'
      });
    }

    if (!validarPasswordSegura(password)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.'
      });
    }

    const rolesPermitidos = ['REVISOR', 'ADMIN_AREA', 'ADMIN_GENERAL'];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({
        mensaje: 'Solo se pueden crear usuarios administrativos desde este panel.'
      });
    }

    const pool = await poolPromise;

    const existe = await pool.request()
      .input('correo', sql.NVarChar, correo.trim())
      .input('dni', sql.NVarChar, dni.trim())
      .query(`
        SELECT id_usuario
        FROM usuarios
        WHERE correo = @correo OR dni = @dni
      `);

    if (existe.recordset.length > 0) {
      return res.status(409).json({
        mensaje: 'Ya existe un usuario con ese correo o DNI.'
      });
    }

    const rolResultado = await pool.request()
      .input('rol', sql.NVarChar, rol)
      .query(`
        SELECT id_rol
        FROM roles
        WHERE nombre = @rol
      `);

    if (rolResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'El rol seleccionado no existe en la base de datos.'
      });
    }

    const idRol = rolResultado.recordset[0].id_rol;

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('nombres', sql.NVarChar, nombres.trim())
      .input('apellidos', sql.NVarChar, apellidos.trim())
      .input('dni', sql.NVarChar, dni.trim())
      .input('correo', sql.NVarChar, correo.trim())
      .input('password_hash', sql.NVarChar, passwordHash)
      .input('id_rol', sql.Int, idRol)
      .query(`
        INSERT INTO usuarios (
          id_rol,
          nombres,
          apellidos,
          dni,
          correo,
          password_hash,
          estado
        )
        VALUES (
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
      mensaje: 'Usuario administrativo creado correctamente.'
    });
  } catch (error) {
    console.error('Error al crear usuario admin:', error);

    return res.status(500).json({
      mensaje: 'Error interno al crear el usuario.',
      detalle: error.message
    });
  }
}

async function cambiarEstadoUsuarioAdmin(req, res) {
  try {
    const { id_usuario } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = ['ACTIVO', 'PENDIENTE', 'SUSPENDIDO', 'RECHAZADO'];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado no permitido.'
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('estado', sql.NVarChar, estado)
      .query(`
        UPDATE usuarios
        SET estado = @estado
        WHERE id_usuario = @id_usuario
      `);

    return res.json({
      mensaje: 'Estado del usuario actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al cambiar estado usuario:', error);

    return res.status(500).json({
      mensaje: 'Error interno al cambiar el estado del usuario.',
      detalle: error.message
    });
  }
}

module.exports = {
  obtenerPanelAdminGeneral,
  listarCategorias,
  listarTramitesAdmin,
  crearTramiteAdmin,
  actualizarTramiteAdmin,
  cambiarEstadoTramiteAdmin,
  listarUsuariosAdmin,
  crearUsuarioAdmin,
  cambiarEstadoUsuarioAdmin
};