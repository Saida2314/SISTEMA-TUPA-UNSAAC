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

function generarCodigoArchivoArea() {
  return generarCodigoSimple('ARA');
}

function generarCodigoMensajeArea() {
  return generarCodigoSimple('MAR');
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

async function obtenerResumenAdminArea(req, res) {
  try {
    const pool = await poolPromise;

    const resumenResultado = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'DERIVADO' THEN 1 ELSE 0 END) AS derivados,
        SUM(CASE WHEN estado = 'EN_VALIDACION_AREA' THEN 1 ELSE 0 END) AS en_validacion,
        SUM(CASE WHEN estado = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizados,
        SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados
      FROM solicitudes
      WHERE estado IN ('DERIVADO', 'EN_VALIDACION_AREA', 'FINALIZADO', 'RECHAZADO')
    `);

    const recientesResultado = await pool.request().query(`
      SELECT TOP 6
        s.id_solicitud,
        s.codigo_solicitud,
        s.estado,
        s.fecha_envio,
        t.nombre AS tramite,
        c.nombre AS categoria,
        u.nombres,
        u.apellidos,
        d.oficina_destino,
        d.fecha_derivacion
      FROM solicitudes s
      INNER JOIN tramites t ON s.id_tramite = t.id_tramite
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      OUTER APPLY (
        SELECT TOP 1
          oficina_destino,
          fecha_derivacion
        FROM derivaciones_solicitud
        WHERE id_solicitud = s.id_solicitud
        ORDER BY fecha_derivacion DESC
      ) d
      WHERE s.estado IN ('DERIVADO', 'EN_VALIDACION_AREA', 'FINALIZADO', 'RECHAZADO')
      ORDER BY ISNULL(d.fecha_derivacion, s.fecha_envio) DESC
    `);

    return res.json({
      resumen: resumenResultado.recordset[0],
      recientes: recientesResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener resumen Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el resumen del Admin de Área.'
    });
  }
}

async function listarSolicitudesAdminArea(req, res) {
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

        d.codigo_derivacion,
        d.oficina_destino,
        d.motivo AS motivo_derivacion,
        d.responsable AS responsable_derivacion,
        d.fecha_derivacion,

        (
          SELECT COUNT(*)
          FROM documentos_solicitud ds
          WHERE ds.id_solicitud = s.id_solicitud
        ) AS total_documentos,

        (
          SELECT COUNT(*)
          FROM archivos_admin_area aa
          WHERE aa.id_solicitud = s.id_solicitud
        ) AS total_archivos_area

      FROM solicitudes s
      INNER JOIN tramites t ON s.id_tramite = t.id_tramite
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      OUTER APPLY (
        SELECT TOP 1
          codigo_derivacion,
          oficina_destino,
          motivo,
          responsable,
          fecha_derivacion
        FROM derivaciones_solicitud
        WHERE id_solicitud = s.id_solicitud
        ORDER BY fecha_derivacion DESC
      ) d
      WHERE s.estado IN ('DERIVADO', 'EN_VALIDACION_AREA', 'FINALIZADO', 'RECHAZADO')
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
          OR c.nombre COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.nombres COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.apellidos COLLATE Modern_Spanish_CI_AI LIKE @buscar
          OR u.dni LIKE @buscar
          OR d.oficina_destino COLLATE Modern_Spanish_CI_AI LIKE @buscar
        )
      `;

      request.input('buscar', sql.NVarChar, `%${buscar.trim()}%`);
    }

    consulta += `
      ORDER BY
        CASE
          WHEN s.estado = 'DERIVADO' THEN 1
          WHEN s.estado = 'EN_VALIDACION_AREA' THEN 2
          WHEN s.estado = 'FINALIZADO' THEN 3
          WHEN s.estado = 'RECHAZADO' THEN 4
          ELSE 5
        END,
        ISNULL(d.fecha_derivacion, s.fecha_envio) DESC
    `;

    const resultado = await request.query(consulta);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar solicitudes Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar solicitudes derivadas.'
    });
  }
}

async function obtenerDetalleSolicitudAdminArea(req, res) {
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
          u.correo,

          d.codigo_derivacion,
          d.oficina_destino,
          d.motivo AS motivo_derivacion,
          d.responsable AS responsable_derivacion,
          d.fecha_derivacion
        FROM solicitudes s
        INNER JOIN tramites t ON s.id_tramite = t.id_tramite
        INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
        INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
        OUTER APPLY (
          SELECT TOP 1
            codigo_derivacion,
            oficina_destino,
            motivo,
            responsable,
            fecha_derivacion
          FROM derivaciones_solicitud
          WHERE id_solicitud = s.id_solicitud
          ORDER BY fecha_derivacion DESC
        ) d
        WHERE s.id_solicitud = @id_solicitud
          AND s.estado IN ('DERIVADO', 'EN_VALIDACION_AREA', 'FINALIZADO', 'RECHAZADO')
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud derivada no encontrada.'
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
          CASE WHEN tipo_documento = 'voucher' THEN 2 ELSE 1 END,
          fecha_subida ASC
      `);

    const archivosAreaResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          id_archivo_area,
          codigo_archivo,
          nombre_original,
          nombre_archivo,
          ruta_archivo,
          tipo_archivo,
          descripcion,
          responsable,
          fecha_subida
        FROM archivos_admin_area
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_subida DESC
      `);

    const mensajesAreaResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT
          id_mensaje_area,
          codigo_mensaje,
          mensaje,
          tipo_mensaje,
          responsable,
          fecha_mensaje
        FROM mensajes_admin_area
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_mensaje DESC
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
          fecha_observacion
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
      archivosArea: archivosAreaResultado.recordset,
      mensajesArea: mensajesAreaResultado.recordset,
      historial: historialResultado.recordset,
      observaciones: observacionesResultado.recordset,
      derivaciones: derivacionesResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener detalle Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el expediente derivado.'
    });
  }
}

async function tomarEnValidacionArea(req, res) {
  try {
    const { id_solicitud } = req.params;
    const { responsable } = req.body;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud, estado
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado = 'DERIVADO'
      `);

    if (resultado.recordset.length === 0) {
      return res.status(400).json({
        mensaje: 'Solo se pueden tomar en validación las solicitudes derivadas.'
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
      'El Admin de Área tomó el expediente para validación final.',
      responsable || 'Admin de Área'
    );

    return res.json({
      mensaje: 'El expediente fue tomado en validación de área.',
      estado: 'EN_VALIDACION_AREA'
    });
  } catch (error) {
    console.error('Error al tomar en validación:', error);

    return res.status(500).json({
      mensaje: 'Error interno al tomar el expediente en validación.'
    });
  }
}

async function subirArchivoArea(req, res) {
  try {
    const { id_solicitud } = req.params;
    const {
      descripcion,
      responsable
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        mensaje: 'Debe subir un archivo.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud, estado
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado IN ('DERIVADO', 'EN_VALIDACION_AREA')
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(400).json({
        mensaje: 'Solo se pueden subir archivos en expedientes derivados o en validación.'
      });
    }

    const codigoArchivo = await generarCodigoUnico(
      pool,
      'archivos_admin_area',
      'codigo_archivo',
      generarCodigoArchivoArea
    );

    const rutaArchivo = String(req.file.path || '').replace(/\\/g, '/');

    await pool.request()
      .input('codigo_archivo', sql.NVarChar, codigoArchivo)
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .input('nombre_original', sql.NVarChar, req.file.originalname)
      .input('nombre_archivo', sql.NVarChar, req.file.filename)
      .input('ruta_archivo', sql.NVarChar, rutaArchivo)
      .input('tipo_archivo', sql.NVarChar, 'RESPUESTA_AREA')
      .input('descripcion', sql.NVarChar, descripcion || 'Archivo adjuntado por el Admin de Área.')
      .input('responsable', sql.NVarChar, responsable || 'Admin de Área')
      .query(`
        INSERT INTO archivos_admin_area (
          codigo_archivo,
          id_solicitud,
          nombre_original,
          nombre_archivo,
          ruta_archivo,
          tipo_archivo,
          descripcion,
          responsable
        )
        VALUES (
          @codigo_archivo,
          @id_solicitud,
          @nombre_original,
          @nombre_archivo,
          @ruta_archivo,
          @tipo_archivo,
          @descripcion,
          @responsable
        )
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'EN_VALIDACION_AREA',
      `El Admin de Área adjuntó un archivo: ${req.file.originalname}.`,
      responsable || 'Admin de Área'
    );

    return res.json({
      mensaje: 'Archivo subido correctamente.',
      codigo_archivo: codigoArchivo
    });
  } catch (error) {
    console.error('Error al subir archivo de área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al subir el archivo del área.'
    });
  }
}

async function enviarMensajeRecojo(req, res) {
  try {
    const { id_solicitud } = req.params;
    const {
      mensaje,
      responsable
    } = req.body;

    if (!mensaje || mensaje.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe escribir el mensaje de recojo presencial.'
      });
    }

    const pool = await poolPromise;

    const solicitudResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud, estado
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado IN ('DERIVADO', 'EN_VALIDACION_AREA', 'FINALIZADO')
      `);

    if (solicitudResultado.recordset.length === 0) {
      return res.status(400).json({
        mensaje: 'No se puede registrar mensaje para este expediente.'
      });
    }

    const codigoMensaje = await generarCodigoUnico(
      pool,
      'mensajes_admin_area',
      'codigo_mensaje',
      generarCodigoMensajeArea
    );

    await pool.request()
      .input('codigo_mensaje', sql.NVarChar, codigoMensaje)
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .input('mensaje', sql.NVarChar, mensaje.trim())
      .input('tipo_mensaje', sql.NVarChar, 'RECOJO_PRESENCIAL')
      .input('responsable', sql.NVarChar, responsable || 'Admin de Área')
      .query(`
        INSERT INTO mensajes_admin_area (
          codigo_mensaje,
          id_solicitud,
          mensaje,
          tipo_mensaje,
          responsable
        )
        VALUES (
          @codigo_mensaje,
          @id_solicitud,
          @mensaje,
          @tipo_mensaje,
          @responsable
        )
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'EN_VALIDACION_AREA',
      `Mensaje de recojo presencial registrado: ${mensaje.trim()}`,
      responsable || 'Admin de Área'
    );

    return res.json({
      mensaje: 'Mensaje de recojo presencial registrado correctamente.',
      codigo_mensaje: codigoMensaje
    });
  } catch (error) {
    console.error('Error al enviar mensaje de recojo:', error);

    return res.status(500).json({
      mensaje: 'Error interno al registrar el mensaje de recojo presencial.'
    });
  }
}

async function finalizarTramite(req, res) {
  try {
    const { id_solicitud } = req.params;

    const {
      descripcion,
      responsable
    } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe indicar la descripción de aceptación o finalización.'
      });
    }

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT id_solicitud, estado
        FROM solicitudes
        WHERE id_solicitud = @id_solicitud
          AND estado IN ('DERIVADO', 'EN_VALIDACION_AREA')
      `);

    if (resultado.recordset.length === 0) {
      return res.status(400).json({
        mensaje: 'Solo se pueden finalizar solicitudes derivadas o en validación de área.'
      });
    }

    await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        UPDATE solicitudes
        SET estado = 'FINALIZADO'
        WHERE id_solicitud = @id_solicitud
      `);

    await registrarHistorial(
      pool,
      Number(id_solicitud),
      'FINALIZADO',
      descripcion.trim(),
      responsable || 'Admin de Área'
    );

    return res.json({
      mensaje: 'El trámite fue aceptado y finalizado correctamente.',
      estado: 'FINALIZADO'
    });
  } catch (error) {
    console.error('Error al finalizar trámite:', error);

    return res.status(500).json({
      mensaje: 'Error interno al finalizar el trámite.'
    });
  }
}

async function verDocumentoAdminArea(req, res) {
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
    console.error('Error al abrir documento Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al abrir el documento.'
    });
  }
}

async function verArchivoArea(req, res) {
  try {
    const { id_archivo_area } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_archivo_area', sql.Int, Number(id_archivo_area))
      .query(`
        SELECT
          id_archivo_area,
          nombre_original,
          ruta_archivo
        FROM archivos_admin_area
        WHERE id_archivo_area = @id_archivo_area
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Archivo del área no encontrado.'
      });
    }

    const archivo = resultado.recordset[0];

    const rutaRelativa = String(archivo.ruta_archivo || '').replace(/\\/g, '/');
    const rutaAbsoluta = path.resolve(process.cwd(), rutaRelativa);

    if (!fs.existsSync(rutaAbsoluta)) {
      return res.status(404).json({
        mensaje: 'El archivo físico no existe en el servidor.'
      });
    }

    return res.sendFile(rutaAbsoluta);
  } catch (error) {
    console.error('Error al abrir archivo del área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al abrir el archivo del área.'
    });
  }
}

module.exports = {
  obtenerResumenAdminArea,
  listarSolicitudesAdminArea,
  obtenerDetalleSolicitudAdminArea,
  tomarEnValidacionArea,
  subirArchivoArea,
  enviarMensajeRecojo,
  finalizarTramite,
  verDocumentoAdminArea,
  verArchivoArea
};