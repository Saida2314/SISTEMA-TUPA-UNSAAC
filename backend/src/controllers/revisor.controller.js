const { sql, poolPromise } = require('../config/db');

const {
  generarCodigoHistorial
} = require('../utils/generarCodigos');

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

async function registrarHistorial(pool, idSolicitud, estado, descripcion, responsable) {
  const codigoHistorial = await generarCodigoUnico(
    pool,
    'historial_solicitud',
    'codigo_historial',
    generarCodigoHistorial
  );

  await pool.request()
    .input('codigo_historial', sql.NVarChar, codigoHistorial)
    .input('id_solicitud', sql.Int, Number(idSolicitud))
    .input('estado', sql.NVarChar, estado)
    .input('descripcion', sql.NVarChar, descripcion)
    .input('responsable', sql.NVarChar, responsable)
    .query(`
      INSERT INTO historial_solicitud (
        codigo_historial,
        id_solicitud,
        estado,
        descripcion,
        responsable
      )
      VALUES (
        @codigo_historial,
        @id_solicitud,
        @estado,
        @descripcion,
        @responsable
      )
    `);
}

async function obtenerResumenRevisor(req, res) {
  try {
    const pool = await poolPromise;

    const resumenResultado = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'REGISTRADO' THEN 1 ELSE 0 END) AS registrados,
        SUM(CASE WHEN estado = 'EN_REVISION' THEN 1 ELSE 0 END) AS en_revision,
        SUM(CASE WHEN estado = 'OBSERVADO' THEN 1 ELSE 0 END) AS observados,
        SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados,
        SUM(CASE WHEN estado = 'DERIVADO' THEN 1 ELSE 0 END) AS derivados,
        SUM(CASE WHEN estado = 'EN_VALIDACION_AREA' THEN 1 ELSE 0 END) AS en_validacion_area,
        SUM(CASE WHEN estado = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizados
      FROM solicitudes
    `);

    const recientesResultado = await pool.request().query(`
      SELECT TOP 5
        s.id_solicitud,
        s.codigo_solicitud,
        s.estado,
        s.fecha_envio,
        t.nombre AS tramite,
        u.nombres,
        u.apellidos
      FROM solicitudes s
      INNER JOIN tramites t ON s.id_tramite = t.id_tramite
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      ORDER BY s.fecha_envio DESC
    `);

    return res.json({
      resumen: resumenResultado.recordset[0],
      recientes: recientesResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener resumen del revisor:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el resumen del revisor.'
    });
  }
}

async function listarSolicitudesRevisor(req, res) {
  try {
    const { estado, buscar } = req.query;

    const pool = await poolPromise;

    let consulta = `
      SELECT
        s.id_solicitud,
        s.codigo_solicitud,
        s.estado,
        s.fecha_envio,
        s.costo_total,
        s.codigo_pago,
        s.metodo_pago,

        t.nombre AS tramite,
        t.codigo AS codigo_tramite,
        t.codigo_publico_tramite,
        t.plazo_dias,
        t.tipo_plazo,

        c.nombre AS categoria,

        u.codigo_usuario,
        u.nombres,
        u.apellidos,
        u.dni,
        u.correo
      FROM solicitudes s
      INNER JOIN tramites t ON s.id_tramite = t.id_tramite
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (estado && estado !== 'TODOS') {
      consulta += ` AND s.estado = @estado`;
      request.input('estado', sql.NVarChar, estado);
    }

    if (buscar && buscar.trim() !== '') {
      consulta += `
        AND (
          s.codigo_solicitud COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR t.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR t.codigo COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.nombres COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.apellidos COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.dni LIKE @buscar
          OR u.correo COLLATE Modern_Spanish_CI_AI LIKE @buscar
        )
      `;

      request.input('buscar', sql.NVarChar, `%${buscar.trim()}%`);
    }

    consulta += `
      ORDER BY 
        CASE 
          WHEN s.estado = 'EN_REVISION' THEN 1
          WHEN s.estado = 'REGISTRADO' THEN 2
          WHEN s.estado = 'OBSERVADO' THEN 3
          ELSE 4
        END,
        s.fecha_envio DESC
    `;

    const resultado = await request.query(consulta);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar solicitudes del revisor:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar solicitudes.'
    });
  }
}

async function obtenerDetalleSolicitudRevisor(req, res) {
  try {
    const { id_solicitud } = req.params;

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT 
          s.id_solicitud,
          s.codigo_solicitud,
          s.estado,
          s.fecha_envio,
          s.costo_total,
          s.codigo_pago,
          s.metodo_pago,
          s.clave_voucher,

          t.id_tramite,
          t.nombre AS tramite,
          t.codigo AS codigo_tramite,
          t.codigo_publico_tramite,
          t.descripcion AS descripcion_tramite,
          t.plazo_dias,
          t.tipo_plazo,

          c.nombre AS categoria,

          u.codigo_usuario,
          u.nombres,
          u.apellidos,
          u.dni,
          u.correo
        FROM solicitudes s
        INNER JOIN tramites t ON s.id_tramite = t.id_tramite
        INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
        INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
        WHERE s.id_solicitud = @id_solicitud
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    const documentosResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          id_documento,
          codigo_documento,
          nombre_original,
          nombre_archivo,
          ruta_archivo,
          tipo_documento,
          fecha_subida
        FROM documentos_solicitud
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_subida ASC
      `);

    const historialResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          codigo_historial,
          estado,
          descripcion,
          responsable,
          fecha_evento
        FROM historial_solicitud
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_evento DESC
      `);

    return res.json({
      solicitud: solicitudResultado.recordset[0],
      documentos: documentosResultado.recordset,
      historial: historialResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener detalle del revisor:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el detalle de la solicitud.'
    });
  }
}

async function cambiarEstadoSolicitud(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      nuevo_estado,
      descripcion,
      responsable
    } = req.body;

    if (!nuevo_estado || !descripcion) {
      return res.status(400).json({
        mensaje: 'Debe enviar el nuevo estado y la descripción.'
      });
    }

    const estadosPermitidos = [
      'EN_REVISION',
      'OBSERVADO',
      'RECHAZADO',
      'DERIVADO',
      'EN_VALIDACION_AREA'
    ];

    if (!estadosPermitidos.includes(nuevo_estado)) {
      return res.status(400).json({
        mensaje: 'Estado no válido para revisión.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud, codigo_solicitud, estado
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .input('estado', sql.NVarChar, nuevo_estado)
      .query(`
        UPDATE solicitudes
        SET estado = @estado
        WHERE id_solicitud = @id_solicitud
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      nuevo_estado,
      descripcion,
      responsable || 'Revisor'
    );

    return res.json({
      mensaje: 'Estado de solicitud actualizado correctamente.',
      estado: nuevo_estado
    });
  } catch (error) {
    console.error('Error al cambiar estado de solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al actualizar el estado.'
    });
  }
}

module.exports = {
  obtenerResumenRevisor,
  listarSolicitudesRevisor,
  obtenerDetalleSolicitudRevisor,
  cambiarEstadoSolicitud
};