const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const { sql, poolPromise } = require('../config/db');

const {
  generarCodigoSolicitud,
  generarCodigoDocumento,
  generarCodigoHistorial,
  generarCodigoNotificacion
} = require('../utils/generarCodigos');

function formatearFecha(fecha) {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatearFechaCorta(fecha) {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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
    .input('id_solicitud', sql.Int, idSolicitud)
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

async function crearSolicitud(req, res) {
  try {
    const {
      id_usuario,
      id_tramite,
      id_pago
    } = req.body;

    if (!id_usuario || !id_tramite || !id_pago) {
      return res.status(400).json({
        mensaje: 'Faltan datos obligatorios para registrar la solicitud.'
      });
    }

    const pool = await poolPromise;

    const pagoResultado = await pool.request()
      .input('id_pago', sql.Int, Number(id_pago))
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('id_tramite', sql.Int, Number(id_tramite))
      .query(`
        SELECT 
          p.id_pago,
          p.codigo_pago,
          p.id_usuario,
          p.id_tramite,
          p.metodo_pago,
          p.monto,
          p.clave_voucher,
          p.estado_pago,
          p.fecha_validacion
        FROM pagos_solicitud p
        WHERE p.id_pago = @id_pago
          AND p.id_usuario = @id_usuario
          AND p.id_tramite = @id_tramite
      `);

    if (pagoResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'No se encontró un pago asociado a esta solicitud.'
      });
    }

    const pago = pagoResultado.recordset[0];

    if (pago.estado_pago !== 'VALIDADO') {
      return res.status(400).json({
        mensaje: 'El pago debe estar validado antes de enviar la solicitud.'
      });
    }

    const solicitudExistente = await pool.request()
      .input('id_pago', sql.Int, Number(id_pago))
      .query(`
        SELECT id_solicitud
        FROM solicitudes
        WHERE id_pago = @id_pago
      `);

    if (solicitudExistente.recordset.length > 0) {
      return res.status(400).json({
        mensaje: 'Ya existe una solicitud registrada con este pago.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe subir los documentos requeridos y el voucher de pago.'
      });
    }

    const tieneVoucher = req.files.some((archivo) => archivo.fieldname === 'voucher');
    const tieneDocumentos = req.files.some((archivo) => archivo.fieldname === 'documentos');

    if (!tieneVoucher || !tieneDocumentos) {
      return res.status(400).json({
        mensaje: 'Debe subir al menos un documento requerido y el voucher de pago.'
      });
    }

    const tramiteResultado = await pool.request()
      .input('id_tramite', sql.Int, Number(id_tramite))
      .query(`
        SELECT 
          t.id_tramite,
          t.nombre,
          t.codigo,
          t.codigo_publico_tramite,
          t.descripcion,
          t.costo,
          t.plazo_dias,
          t.tipo_plazo,
          c.nombre AS categoria
        FROM tramites t
        INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
        WHERE t.id_tramite = @id_tramite
      `);

    if (tramiteResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Trámite no encontrado.'
      });
    }

    const usuarioResultado = await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT 
          id_usuario,
          codigo_usuario,
          nombres,
          apellidos,
          dni,
          correo
        FROM usuarios
        WHERE id_usuario = @id_usuario
      `);

    if (usuarioResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado.'
      });
    }

    const usuario = usuarioResultado.recordset[0];

    const codigoSolicitud = await generarCodigoUnico(
      pool,
      'solicitudes',
      'codigo_solicitud',
      generarCodigoSolicitud
    );

    const solicitudResultado = await pool.request()
      .input('codigo_solicitud', sql.NVarChar, codigoSolicitud)
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('id_tramite', sql.Int, Number(id_tramite))
      .input('id_pago', sql.Int, Number(id_pago))
      .input('codigo_pago', sql.NVarChar, pago.codigo_pago)
      .input('metodo_pago', sql.NVarChar, pago.metodo_pago)
      .input('clave_voucher', sql.NVarChar, pago.clave_voucher)
      .input('costo_total', sql.Decimal(10, 2), Number(pago.monto))
      .query(`
        INSERT INTO solicitudes (
          codigo_solicitud,
          id_usuario,
          id_tramite,
          id_pago,
          codigo_pago,
          metodo_pago,
          clave_voucher,
          costo_total,
          estado
        )
        OUTPUT INSERTED.id_solicitud
        VALUES (
          @codigo_solicitud,
          @id_usuario,
          @id_tramite,
          @id_pago,
          @codigo_pago,
          @metodo_pago,
          @clave_voucher,
          @costo_total,
          'EN_REVISION'
        )
      `);

    const idSolicitud = solicitudResultado.recordset[0].id_solicitud;

    for (const archivo of req.files) {
      const codigoDocumento = await generarCodigoUnico(
        pool,
        'documentos_solicitud',
        'codigo_documento',
        generarCodigoDocumento
      );

      await pool.request()
        .input('codigo_documento', sql.NVarChar, codigoDocumento)
        .input('id_solicitud', sql.Int, idSolicitud)
        .input('nombre_original', sql.NVarChar, archivo.originalname)
        .input('nombre_archivo', sql.NVarChar, archivo.filename)
        .input('ruta_archivo', sql.NVarChar, archivo.path)
        .input('tipo_documento', sql.NVarChar, archivo.fieldname)
        .query(`
          INSERT INTO documentos_solicitud (
            codigo_documento,
            id_solicitud,
            nombre_original,
            nombre_archivo,
            ruta_archivo,
            tipo_documento
          )
          VALUES (
            @codigo_documento,
            @id_solicitud,
            @nombre_original,
            @nombre_archivo,
            @ruta_archivo,
            @tipo_documento
          )
        `);
    }

    await registrarHistorial(
      pool,
      idSolicitud,
      'REGISTRADO',
      'La solicitud fue registrada correctamente por el usuario.',
      'Usuario solicitante'
    );

    await registrarHistorial(
      pool,
      idSolicitud,
      'PAGO_VALIDADO',
      'El pago asociado a la solicitud fue validado correctamente.',
      'Sistema de pagos TUPA'
    );

    await registrarHistorial(
      pool,
      idSolicitud,
      'DOCUMENTOS_RECIBIDOS',
      'Los documentos requeridos y el voucher fueron cargados al expediente digital.',
      'Sistema TUPA'
    );

    await registrarHistorial(
      pool,
      idSolicitud,
      'EN_REVISION',
      'La solicitud pasó al estado EN REVISIÓN para ser evaluada por el revisor correspondiente.',
      'Sistema TUPA'
    );

    const codigoNotificacion = await generarCodigoUnico(
      pool,
      'notificaciones_correo',
      'codigo_notificacion',
      generarCodigoNotificacion
    );

    await pool.request()
      .input('codigo_notificacion', sql.NVarChar, codigoNotificacion)
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('id_solicitud', sql.Int, idSolicitud)
      .input('correo_destino', sql.NVarChar, usuario.correo)
      .input('asunto', sql.NVarChar, `Constancia de registro ${codigoSolicitud}`)
      .input('estado_envio', sql.NVarChar, 'SIMULADO')
      .query(`
        INSERT INTO notificaciones_correo (
          codigo_notificacion,
          id_usuario,
          id_solicitud,
          correo_destino,
          asunto,
          estado_envio
        )
        VALUES (
          @codigo_notificacion,
          @id_usuario,
          @id_solicitud,
          @correo_destino,
          @asunto,
          @estado_envio
        )
      `);

    return res.status(201).json({
      mensaje: 'Solicitud registrada correctamente.',
      solicitud: {
        id_solicitud: idSolicitud,
        codigo_solicitud: codigoSolicitud,
        estado: 'EN_REVISION'
      },
      correo: {
        enviado: false,
        estado: 'SIMULADO',
        destino: usuario.correo,
        codigo_notificacion: codigoNotificacion
      }
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al registrar la solicitud.'
    });
  }
}

async function listarMisSolicitudes(req, res) {
  try {
    const { id_usuario } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
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
          c.nombre AS categoria
        FROM solicitudes s
        INNER JOIN tramites t ON s.id_tramite = t.id_tramite
        INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
        WHERE s.id_usuario = @id_usuario
        ORDER BY s.fecha_envio DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar solicitudes:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar solicitudes.'
    });
  }
}

async function obtenerDetalleSolicitud(req, res) {
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
          codigo_documento,
          nombre_original,
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
        ORDER BY fecha_evento ASC
      `);

    return res.json({
      solicitud: solicitudResultado.recordset[0],
      documentos: documentosResultado.recordset,
      historial: historialResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener detalle de solicitud:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener el detalle de la solicitud.'
    });
  }
}

async function descargarConstancia(req, res) {
  try {
    const { id_solicitud } = req.params;

    const pool = await poolPromise;

    const detalleResultado = await pool.request()
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
        WHERE s.id_solicitud = @id_solicitud
      `);

    if (detalleResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Solicitud no encontrada.'
      });
    }

    const solicitud = detalleResultado.recordset[0];

    const documentosResultado = await pool.request()
      .input('id_solicitud', sql.Int, Number(id_solicitud))
      .query(`
        SELECT 
          codigo_documento,
          nombre_original,
          tipo_documento,
          fecha_subida
        FROM documentos_solicitud
        WHERE id_solicitud = @id_solicitud
        ORDER BY fecha_subida ASC
      `);

    const logoPath = path.join(__dirname, '../../assets/logo-unsaac.png');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=constancia-${solicitud.codigo_solicitud}.pdf`
    );

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 36,
        bottom: 46,
        left: 42,
        right: 42
      }
    });

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginLeft = 42;
    const marginRight = 42;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const footerLimitY = pageHeight - 70;

    function estadoVisual(estado) {
      return String(estado || '')
        .replace(/_/g, ' ')
        .toUpperCase();
    }

    function footer() {
      const footerY = pageHeight - 42;

      doc
        .moveTo(marginLeft, footerY - 10)
        .lineTo(pageWidth - marginRight, footerY - 10)
        .strokeColor('#d9c4c8')
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(7)
        .fillColor('#666666')
        .text(
          'Sistema TUPA UNSAAC - Documento generado automáticamente. Verificable mediante código de solicitud.',
          marginLeft,
          footerY,
          {
            width: contentWidth,
            align: 'center'
          }
        );
    }

    function nuevaPaginaSiHaceFalta(altoNecesario = 80) {
      if (doc.y + altoNecesario > footerLimitY) {
        footer();
        doc.addPage();
        doc.y = 42;
      }
    }

    function drawBox(x, y, width, height, options = {}) {
      doc
        .roundedRect(x, y, width, height, options.radius || 8)
        .fillAndStroke(options.fill || '#ffffff', options.stroke || '#e5d2d6');
    }

    function labelValue(label, value, x, y, width, options = {}) {
      doc
        .fontSize(options.labelSize || 7.6)
        .fillColor(options.labelColor || '#755e64')
        .text(label, x, y, {
          width,
          continued: false
        });

      doc
        .fontSize(options.valueSize || 9)
        .fillColor(options.valueColor || '#222222')
        .text(value || '-', x, y + 12, {
          width,
          lineGap: 1
        });
    }

    function tituloSeccion(numero, titulo) {
      nuevaPaginaSiHaceFalta(46);

      const y = doc.y + 2;

      doc
        .fontSize(10.8)
        .fillColor('#7a001b')
        .text(`${numero}. ${titulo}`, marginLeft, y, {
          width: contentWidth,
          lineGap: 1
        });

      doc
        .moveTo(marginLeft, y + 18)
        .lineTo(pageWidth - marginRight, y + 18)
        .strokeColor('#7a001b')
        .lineWidth(0.7)
        .stroke();

      doc.y = y + 30;
    }

    function drawEstadoBadge(x, y, estado) {
      doc
        .roundedRect(x, y, 118, 30, 15)
        .fill('#fff2d0');

      doc
        .fontSize(8.4)
        .fillColor('#7a001b')
        .text(estadoVisual(estado), x, y + 10, {
          width: 118,
          align: 'center'
        });
    }

    function drawHeader() {
      /*
        Encabezado corregido:
        - El logo queda arriba a la izquierda.
        - El texto tiene ancho limitado para no chocar con el estado.
        - Los subtítulos se colocan debajo del título calculando su altura real.
        - La línea granate empieza después del logo, así no atraviesa la insignia.
      */

      const headerTop = 34;

      const logoSize = 64;
      const logoX = marginLeft;
      const logoY = headerTop;

      const textX = logoX + logoSize + 26;

      const badgeW = 118;
      const badgeX = pageWidth - marginRight - badgeW;
      const badgeY = headerTop + 16;

      const textWidth = badgeX - textX - 28;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, logoX, logoY, {
          width: logoSize,
          height: logoSize
        });
      }

      const tituloUniversidad = 'UNIVERSIDAD NACIONAL DE SAN ANTONIO ABAD DEL CUSCO';

      doc.fontSize(12.2).fillColor('#111111');

      const titleHeight = doc.heightOfString(tituloUniversidad, {
        width: textWidth,
        lineGap: 2
      });

      doc.text(tituloUniversidad, textX, headerTop + 2, {
        width: textWidth,
        align: 'left',
        lineGap: 2
      });

      const subTitleY = headerTop + 2 + titleHeight + 8;

      doc
        .fontSize(8.8)
        .fillColor('#555555')
        .text(
          'Sistema de Gestión de Trámites Administrativos TUPA',
          textX,
          subTitleY,
          {
            width: textWidth,
            align: 'left'
          }
        );

      doc
        .fontSize(8)
        .fillColor('#777777')
        .text(
          'Constancia generada automáticamente por el sistema institucional',
          textX,
          subTitleY + 17,
          {
            width: textWidth,
            align: 'left'
          }
        );

      drawEstadoBadge(badgeX, badgeY, solicitud.estado);

      const lineY = logoY + logoSize + 18;
      const lineStartX = textX;
      const lineEndX = pageWidth - marginRight;

      doc
        .moveTo(lineStartX, lineY)
        .lineTo(lineEndX, lineY)
        .strokeColor('#7a001b')
        .lineWidth(1.2)
        .stroke();

      doc.y = lineY + 26;

      doc
        .fontSize(16.2)
        .fillColor('#7a001b')
        .text('CONSTANCIA DE REGISTRO DE SOLICITUD', marginLeft, doc.y, {
          width: contentWidth,
          align: 'center',
          lineGap: 2
        });

      doc.y += 30;

      doc
        .fontSize(9.2)
        .fillColor('#444444')
        .text(
          'Este documento acredita el registro de la solicitud y la recepción inicial del expediente digital.',
          marginLeft + 36,
          doc.y,
          {
            width: contentWidth - 72,
            align: 'center',
            lineGap: 1
          }
        );

      doc.y += 36;

      const boxY = doc.y;
      const boxHeight = 62;

      drawBox(marginLeft, boxY, contentWidth, boxHeight, {
        fill: '#fff7e5',
        stroke: '#f0cf8a',
        radius: 9
      });

      labelValue(
        'CÓDIGO DE SOLICITUD',
        solicitud.codigo_solicitud,
        marginLeft + 18,
        boxY + 14,
        150,
        {
          valueSize: 10
        }
      );

      labelValue(
        'FECHA DE REGISTRO',
        formatearFecha(solicitud.fecha_envio),
        marginLeft + 196,
        boxY + 14,
        155
      );

      labelValue(
        'CÓDIGO DE PAGO',
        solicitud.codigo_pago,
        marginLeft + 380,
        boxY + 14,
        115,
        {
          valueSize: 10
        }
      );

      doc.y = boxY + boxHeight + 26;
    }

    function drawDatosPrincipales() {
      tituloSeccion('1', 'Datos principales');

      const startY = doc.y;
      const gap = 14;
      const colW = (contentWidth - gap) / 2;
      const boxH = 138;

      drawBox(marginLeft, startY, colW, boxH, {
        fill: '#ffffff',
        stroke: '#e5d2d6'
      });

      drawBox(marginLeft + colW + gap, startY, colW, boxH, {
        fill: '#ffffff',
        stroke: '#e5d2d6'
      });

      doc
        .fontSize(10)
        .fillColor('#7a001b')
        .text('Solicitud y trámite', marginLeft + 16, startY + 15, {
          width: colW - 32
        });

      labelValue(
        'TRÁMITE',
        solicitud.tramite,
        marginLeft + 16,
        startY + 39,
        colW - 32
      );

      labelValue(
        'CÓDIGO PÚBLICO DEL TRÁMITE',
        solicitud.codigo_publico_tramite,
        marginLeft + 16,
        startY + 76,
        colW - 32
      );

      labelValue(
        'CATEGORÍA Y PLAZO',
        `${solicitud.categoria} - ${solicitud.plazo_dias} ${solicitud.tipo_plazo}`,
        marginLeft + 16,
        startY + 108,
        colW - 32
      );

      const rightX = marginLeft + colW + gap;

      doc
        .fontSize(10)
        .fillColor('#7a001b')
        .text('Solicitante', rightX + 16, startY + 15, {
          width: colW - 32
        });

      labelValue(
        'CÓDIGO DE USUARIO',
        solicitud.codigo_usuario,
        rightX + 16,
        startY + 39,
        colW - 32
      );

      labelValue(
        'NOMBRES Y APELLIDOS',
        `${solicitud.nombres} ${solicitud.apellidos}`,
        rightX + 16,
        startY + 76,
        colW - 32
      );

      labelValue(
        'DNI / CORREO INSTITUCIONAL',
        `${solicitud.dni} - ${solicitud.correo}`,
        rightX + 16,
        startY + 108,
        colW - 32
      );

      doc.y = startY + boxH + 26;
    }

    function drawPago() {
      tituloSeccion('2', 'Validación del pago');

      const y = doc.y;
      const boxH = 82;

      drawBox(marginLeft, y, contentWidth, boxH, {
        fill: '#fbfbfb',
        stroke: '#e5d2d6'
      });

      labelValue('CÓDIGO DE PAGO', solicitud.codigo_pago, marginLeft + 18, y + 18, 112);
      labelValue('MÉTODO DE PAGO', solicitud.metodo_pago, marginLeft + 152, y + 18, 130);
      labelValue('CLAVE DE VOUCHER', solicitud.clave_voucher, marginLeft + 306, y + 18, 112);
      labelValue(
        'MONTO PAGADO',
        `S/ ${Number(solicitud.costo_total).toFixed(2)}`,
        marginLeft + 438,
        y + 18,
        88
      );

      doc
        .fontSize(8.4)
        .fillColor('#19733b')
        .text('Estado del pago: VALIDADO', marginLeft + 18, y + 58, {
          width: contentWidth - 36
        });

      doc.y = y + boxH + 26;
    }

    function formatTipoDocumento(tipo) {
      if (tipo === 'voucher') return 'Voucher de pago';
      if (tipo === 'documentos') return 'Documento requerido';
      return tipo || 'Documento';
    }

    function drawDocumentos() {
      tituloSeccion('3', 'Documentos presentados');

      const documentos = documentosResultado.recordset;
      const headerH = 26;
      const rowH = 28;

      nuevaPaginaSiHaceFalta(headerH + rowH + 20);

      const tableTop = doc.y;

      doc
        .roundedRect(marginLeft, tableTop, contentWidth, headerH, 6)
        .fillAndStroke('#7a001b', '#7a001b');

      doc
        .fontSize(8)
        .fillColor('#ffffff')
        .text('Código', marginLeft + 10, tableTop + 9, { width: 95 })
        .text('Archivo', marginLeft + 110, tableTop + 9, { width: 238 })
        .text('Tipo', marginLeft + 354, tableTop + 9, { width: 95 })
        .text('Fecha', marginLeft + 454, tableTop + 9, { width: 72 });

      doc.y = tableTop + headerH;

      if (documentos.length === 0) {
        doc
          .rect(marginLeft, doc.y, contentWidth, rowH)
          .fillAndStroke('#ffffff', '#ead9dc');

        doc
          .fontSize(8.5)
          .fillColor('#444444')
          .text('No se registraron documentos.', marginLeft + 10, doc.y + 9, {
            width: contentWidth - 20
          });

        doc.y += rowH + 18;
        return;
      }

      documentos.forEach((documento) => {
        nuevaPaginaSiHaceFalta(rowH + 12);

        const y = doc.y;

        doc
          .rect(marginLeft, y, contentWidth, rowH)
          .fillAndStroke('#ffffff', '#ead9dc');

        doc
          .fontSize(7.4)
          .fillColor('#222222')
          .text(documento.codigo_documento, marginLeft + 10, y + 9, { width: 95 })
          .text(documento.nombre_original, marginLeft + 110, y + 9, { width: 238 })
          .text(formatTipoDocumento(documento.tipo_documento), marginLeft + 354, y + 9, { width: 95 })
          .text(formatearFechaCorta(documento.fecha_subida), marginLeft + 454, y + 9, { width: 72 });

        doc.y = y + rowH;
      });

      doc.y += 22;
    }

    function drawNotaFinal() {
      nuevaPaginaSiHaceFalta(84);

      const y = doc.y;

      drawBox(marginLeft, y, contentWidth, 62, {
        fill: '#fff7e5',
        stroke: '#f0cf8a',
        radius: 8
      });

      doc
        .fontSize(8.3)
        .fillColor('#7a001b')
        .text(
          'NOTA: Esta constancia acredita el registro de la solicitud y la recepción inicial del expediente digital. No constituye aprobación final del trámite. La evaluación queda sujeta a revisión del área correspondiente.',
          marginLeft + 16,
          y + 15,
          {
            width: contentWidth - 32,
            align: 'justify',
            lineGap: 2
          }
        );

      doc.y = y + 82;
    }

    drawHeader();
    drawDatosPrincipales();
    drawPago();
    drawDocumentos();
    drawNotaFinal();
    footer();

    doc.end();
  } catch (error) {
    console.error('Error al generar constancia:', error);

    return res.status(500).json({
      mensaje: 'Error interno al generar la constancia.'
    });
  }
}

module.exports = {
  crearSolicitud,
  listarMisSolicitudes,
  obtenerDetalleSolicitud,
  descargarConstancia
};