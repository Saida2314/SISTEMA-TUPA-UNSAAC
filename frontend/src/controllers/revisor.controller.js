const path = require('path');
const fs = require('fs');

const { sql, poolPromise } = require('../config/db');

const {
  generarCodigoHistorial
} = require('../utils/generarCodigos');

function generarCodigoSimple(prefijo) {
  const anio = new Date().getFullYear().toString().slice(-2);
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let bloque = '';

  for (let i = 0; i < 6; i++) {
    bloque += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  return `${prefijo}-${anio}-${bloque}`;
}

function generarCodigoObservacion() {
  return generarCodigoSimple('OBS');
}

function generarCodigoDerivacion() {
  return generarCodigoSimple('DER');
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
      WHERE estado <> 'BORRADOR'
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
      WHERE s.estado <> 'BORRADOR'
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
        s.clave_voucher,

        t.id_tramite,
        t.nombre AS tramite,
        t.codigo AS codigo_tramite,
        t.codigo_publico_tramite,
        t.plazo_dias,
        t.tipo_plazo,

        c.nombre AS categoria,

        u.id_usuario,
        u.codigo_usuario,
        u.nombres,
        u.apellidos,
        u.dni,
        u.correo,

        (
          SELECT COUNT(*)
          FROM documentos_solicitud ds
          WHERE ds.id_solicitud = s.id_solicitud
        ) AS total_documentos,

        (
          SELECT COUNT(*)
          FROM documentos_solicitud ds
          WHERE ds.id_solicitud = s.id_solicitud
            AND ds.tipo_documento = 'voucher'
        ) AS total_vouchers

      FROM solicitudes s
      INNER JOIN tramites t ON s.id_tramite = t.id_tramite
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      WHERE s.estado <> 'BORRADOR'
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
          OR c.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar
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
          WHEN s.estado = 'REGISTRADO' THEN 1
          WHEN s.estado = 'EN_REVISION' THEN 2
          WHEN s.estado = 'OBSERVADO' THEN 3
          WHEN s.estado = 'EN_VALIDACION_AREA' THEN 4
          WHEN s.estado = 'DERIVADO' THEN 5
          WHEN s.estado = 'RECHAZADO' THEN 6
          WHEN s.estado = 'FINALIZADO' THEN 7
          ELSE 8
        END,
        s.fecha_envio DESC
    `;

    const resultado = await request.query(consulta);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar solicitudes del revisor:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar solicitudes reales para revisión.'
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

          u.id_usuario,
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
          AND s.estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada o aún no enviada por el usuario.'
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
        ORDER BY 
          CASE 
            WHEN tipo_documento = 'voucher' THEN 2
            ELSE 1
          END,
          fecha_subida ASC
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

    const observacionesResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          codigo_observacion,
          descripcion,
          tipo_observacion,
          estado,
          responsable,
          fecha_observacion,
          fecha_subsanacion
        FROM observaciones_solicitud
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_observacion DESC
      `);

    const derivacionesResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          codigo_derivacion,
          oficina_origen,
          oficina_destino,
          motivo,
          responsable,
          fecha_derivacion
        FROM derivaciones_solicitud
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_derivacion DESC
      `);

    return res.json({
      solicitud: solicitudResultado.recordset[0],
      documentos: documentosResultado.recordset,
      historial: historialResultado.recordset,
      observaciones: observacionesResultado.recordset,
      derivaciones: derivacionesResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener detalle del expediente:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el expediente real desde la base de datos.'
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
      'EN_VALIDACION_AREA',
      'FINALIZADO'
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
          AND estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada o aún no enviada.'
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
      mensaje: 'Estado actualizado correctamente.',
      estado: nuevo_estado
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);

    return res.status(500).json({
      mensaje: 'Error interno al actualizar el estado.'
    });
  }
}

async function observarSolicitud(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      descripcion,
      tipo_observacion,
      responsable
    } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe escribir la observación.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    const codigoObservacion = await generarCodigoUnico(
      pool,
      'observaciones_solicitud',
      'codigo_observacion',
      generarCodigoObservacion
    );

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        UPDATE solicitudes
        SET estado = 'OBSERVADO'
        WHERE id_solicitud = @id_solicitud
      `);

    await pool.request()
      .input('codigo_observacion', sql.NVarChar, codigoObservacion)
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .input('descripcion', sql.NVarChar, descripcion.trim())
      .input('tipo_observacion', sql.NVarChar, tipo_observacion || 'DOCUMENTOS')
      .input('responsable', sql.NVarChar, responsable || 'Revisor')
      .query(`
        INSERT INTO observaciones_solicitud (
          codigo_observacion,
          id_solicitud,
          descripcion,
          tipo_observacion,
          responsable
        )
        VALUES (
          @codigo_observacion,
          @id_solicitud,
          @descripcion,
          @tipo_observacion,
          @responsable
        )
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'OBSERVADO',
      descripcion.trim(),
      responsable || 'Revisor'
    );

    return res.json({
      mensaje: 'Observación registrada correctamente.',
      codigo_observacion: codigoObservacion,
      estado: 'OBSERVADO'
    });
  } catch (error) {
    console.error('Error al observar solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al registrar la observación.'
    });
  }
}

async function aprobarSolicitud(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      descripcion,
      responsable
    } = req.body;

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        UPDATE solicitudes
        SET estado = 'EN_VALIDACION_AREA'
        WHERE id_solicitud = @id_solicitud
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'EN_VALIDACION_AREA',
      descripcion || 'Solicitud aprobada por el revisor y enviada a validación del Admin de Área.',
      responsable || 'Revisor'
    );

    return res.json({
      mensaje: 'Solicitud aprobada y enviada a validación de área.',
      estado: 'EN_VALIDACION_AREA'
    });
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al aprobar la solicitud.'
    });
  }
}

async function rechazarSolicitud(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      descripcion,
      responsable
    } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe indicar el motivo del rechazo.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        UPDATE solicitudes
        SET estado = 'RECHAZADO'
        WHERE id_solicitud = @id_solicitud
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'RECHAZADO',
      descripcion.trim(),
      responsable || 'Revisor'
    );

    return res.json({
      mensaje: 'Solicitud rechazada correctamente.',
      estado: 'RECHAZADO'
    });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al rechazar la solicitud.'
    });
  }
}

async function derivarSolicitud(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      oficina_destino,
      motivo,
      responsable
    } = req.body;

    if (!oficina_destino || !motivo) {
      return res.status(400).json({
        mensaje: 'Debe indicar oficina destino y motivo de derivación.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado <> 'BORRADOR'
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    const codigoDerivacion = await generarCodigoUnico(
      pool,
      'derivaciones_solicitud',
      'codigo_derivacion',
      generarCodigoDerivacion
    );

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        UPDATE solicitudes
        SET estado = 'DERIVADO'
        WHERE id_solicitud = @id_solicitud
      `);

    await pool.request()
      .input('codigo_derivacion', sql.NVarChar, codigoDerivacion)
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .input('oficina_destino', sql.NVarChar, oficina_destino)
      .input('motivo', sql.NVarChar, motivo)
      .input('responsable', sql.NVarChar, responsable || 'Revisor')
      .query(`
        INSERT INTO derivaciones_solicitud (
          codigo_derivacion,
          id_solicitud,
          oficina_destino,
          motivo,
          responsable
        )
        VALUES (
          @codigo_derivacion,
          @id_solicitud,
          @oficina_destino,
          @motivo,
          @responsable
        )
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'DERIVADO',
      `Solicitud derivada a ${oficina_destino}. Motivo: ${motivo}`,
      responsable || 'Revisor'
    );

    return res.json({
      mensaje: 'Solicitud derivada correctamente.',
      estado: 'DERIVADO',
      codigo_derivacion: codigoDerivacion,
      oficina_destino
    });
  } catch (error) {
    console.error('Error al derivar solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al derivar la solicitud.'
    });
  }
}

async function verDocumentoSolicitud(req, res) {
  try {
    const { id_documento } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_documento', sql.Int, Number(id_documento))
      .query(`
        SELECT
          id_documento,
          nombre_original,
          ruta_archivo
        FROM documentos_solicitud
        WHERE id_documento = @id_documento
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Documento no encontrado.'
      });
    }

    const documento = resultado.recordset[0];

    const rutaRelativa = String(documento.ruta_archivo || '').replace(/\\/g, '/');
    const rutaAbsoluta = path.resolve(process.cwd(), rutaRelativa);

    if (!fs.existsSync(rutaAbsoluta)) {
      return res.status(404).json({
        mensaje: 'El archivo físico no existe en el servidor.'
      });
    }

    return res.sendFile(rutaAbsoluta);
  } catch (error) {
    console.error('Error al ver documento:', error);

    return res.status(500).json({
      mensaje: 'Error interno al abrir el documento.'
    });
  }
}

module.exports = {
  obtenerResumenRevisor,
  listarSolicitudesRevisor,
  obtenerDetalleSolicitudRevisor,
  cambiarEstadoSolicitud,
  observarSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  derivarSolicitud,
  verDocumentoSolicitud
};