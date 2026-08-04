const { sql, poolPromise } = require('../config/db');

const {
  generarCodigoConversacionAntonia,
  generarCodigoMensaje
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

function limpiarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function guardarMensajeAntonia(pool, idConversacion, emisor, mensaje) {
  const codigoMensaje = await generarCodigoUnico(
    pool,
    'mensajes_antonia',
    'codigo_mensaje',
    generarCodigoMensaje
  );

  await pool.request()
    .input('codigo_mensaje', sql.NVarChar, codigoMensaje)
    .input('id_conversacion', sql.Int, idConversacion)
    .input('emisor', sql.NVarChar, emisor)
    .input('mensaje', sql.NVarChar, mensaje)
    .query(`
      INSERT INTO mensajes_antonia (
        codigo_mensaje,
        id_conversacion,
        emisor,
        mensaje
      )
      VALUES (
        @codigo_mensaje,
        @id_conversacion,
        @emisor,
        @mensaje
      )
    `);

  return codigoMensaje;
}

async function generarRespuestaInteligente(pool, idUsuario, pregunta) {
  const texto = limpiarTexto(pregunta);

  const palabrasTramite = texto
    .split(/\s+/)
    .filter((palabra) => palabra.length > 3)
    .filter((palabra) => ![
      'como',
      'para',
      'donde',
      'cuanto',
      'tramite',
      'trámite',
      'solicitud',
      'necesito',
      'quiero',
      'puedo',
      'hacer',
      'este',
      'esta',
      'eso',
      'que',
      'debo',
      'primero'
    ].includes(palabra));

  const preguntaSobreCosto =
    texto.includes('costo') ||
    texto.includes('cuesta') ||
    texto.includes('pagar') ||
    texto.includes('pago') ||
    texto.includes('monto');

  const preguntaSobrePlazo =
    texto.includes('demora') ||
    texto.includes('tiempo') ||
    texto.includes('dias') ||
    texto.includes('días') ||
    texto.includes('plazo');

  const preguntaSobreDocumentos =
    texto.includes('documento') ||
    texto.includes('requisito') ||
    texto.includes('archivo') ||
    texto.includes('subir') ||
    texto.includes('adjuntar') ||
    texto.includes('presentar');

  const preguntaSobreVoucher =
    texto.includes('voucher') ||
    texto.includes('clave') ||
    texto.includes('validar pago');

  const preguntaSobreEstado =
    texto.includes('estado') ||
    texto.includes('mi solicitud') ||
    texto.includes('seguimiento') ||
    texto.includes('revision') ||
    texto.includes('revisión');

  const preguntaSobrePasos =
    texto.includes('como hago') ||
    texto.includes('cómo hago') ||
    texto.includes('que debo hacer') ||
    texto.includes('qué debo hacer') ||
    texto.includes('que hago primero') ||
    texto.includes('qué hago primero') ||
    texto.includes('por donde empiezo') ||
    texto.includes('iniciar');

  if (preguntaSobreEstado) {
    const solicitudes = await pool.request()
      .input('id_usuario', sql.Int, Number(idUsuario))
      .query(`
        SELECT TOP 3
          s.codigo_solicitud,
          s.estado,
          s.fecha_envio,
          t.nombre AS tramite
        FROM solicitudes s
        INNER JOIN tramites t ON s.id_tramite = t.id_tramite
        WHERE s.id_usuario = @id_usuario
        ORDER BY s.fecha_envio DESC
      `);

    if (solicitudes.recordset.length === 0) {
      return {
        respuesta:
          'Todavía no tienes solicitudes registradas. Para iniciar una, ingresa al catálogo de trámites, elige el procedimiento, genera el código de pago, valida el voucher y sube tus documentos.',
        requiereTicket: false
      };
    }

    const resumen = solicitudes.recordset
      .map((item) => {
        const estadoLimpio = String(item.estado || '').replace(/_/g, ' ');
        return `• ${item.codigo_solicitud}: ${item.tramite} — Estado: ${estadoLimpio}`;
      })
      .join('\n');

    return {
      respuesta:
        `Estas son tus solicitudes más recientes:\n\n${resumen}\n\nPuedes ver el detalle completo en la sección “Mis Solicitudes”.`,
      requiereTicket: false
    };
  }

  if (preguntaSobreVoucher) {
    return {
      respuesta:
        'Para validar tu pago debes generar primero un código de pago de 9 números. Luego ingresa la clave del voucher, que debe tener exactamente 5 números. Después de validarlo, podrás subir tus documentos y enviar la solicitud.',
      requiereTicket: false
    };
  }

  let tramiteEncontrado = null;

  if (palabrasTramite.length > 0) {
    const condiciones = palabrasTramite
      .map((_, index) => `
        (
          t.nombre COLLATE Modern_Spanish_CI_AI LIKE @palabra${index}
          OR t.descripcion COLLATE Modern_Spanish_CI_AI LIKE @palabra${index}
        )
      `)
      .join(' OR ');

    const request = pool.request();

    palabrasTramite.forEach((palabra, index) => {
      request.input(`palabra${index}`, sql.NVarChar, `%${palabra}%`);
    });

    const resultado = await request.query(`
      SELECT TOP 1
        t.nombre,
        t.descripcion,
        t.costo,
        t.plazo_dias,
        t.tipo_plazo,
        t.codigo_publico_tramite,
        c.nombre AS categoria
      FROM tramites t
      INNER JOIN categorias_tramite c ON t.id_categoria = c.id_categoria
      WHERE t.estado = 'ACTIVO'
        AND (${condiciones})
      ORDER BY t.nombre ASC
    `);

    tramiteEncontrado = resultado.recordset[0];
  }

  if (tramiteEncontrado) {
    if (preguntaSobreCosto) {
      return {
        respuesta:
          `El trámite “${tramiteEncontrado.nombre}” tiene un costo registrado de S/ ${Number(tramiteEncontrado.costo).toFixed(2)}.`,
        requiereTicket: false
      };
    }

    if (preguntaSobrePlazo) {
      return {
        respuesta:
          `El trámite “${tramiteEncontrado.nombre}” tiene un plazo estimado de ${tramiteEncontrado.plazo_dias} ${tramiteEncontrado.tipo_plazo}.`,
        requiereTicket: false
      };
    }

    if (preguntaSobreDocumentos) {
      return {
        respuesta:
          `Para el trámite “${tramiteEncontrado.nombre}” debes preparar tus documentos en PDF, JPG o PNG. En esta versión se solicita al menos un documento requerido y el voucher de pago. Revisa que cada archivo sea legible antes de enviar la solicitud.`,
        requiereTicket: false
      };
    }

    if (preguntaSobrePasos) {
      return {
        respuesta:
          `Para iniciar el trámite “${tramiteEncontrado.nombre}”, sigue estos pasos:\n\n1. Ingresa al catálogo de trámites.\n2. Selecciona el trámite.\n3. Revisa el costo y plazo.\n4. Genera el código de pago.\n5. Valida la clave del voucher.\n6. Sube tus documentos.\n7. Envía la solicitud y descarga tu constancia.`,
        requiereTicket: false
      };
    }

    return {
      respuesta:
        `Encontré este trámite relacionado:\n\n${tramiteEncontrado.nombre}\nCódigo: ${tramiteEncontrado.codigo_publico_tramite}\nCategoría: ${tramiteEncontrado.categoria}\nCosto: S/ ${Number(tramiteEncontrado.costo).toFixed(2)}\nPlazo: ${tramiteEncontrado.plazo_dias} ${tramiteEncontrado.tipo_plazo}\n\nPuedes iniciarlo desde el catálogo de trámites.`,
      requiereTicket: false
    };
  }

  if (
    texto.includes('error') ||
    texto.includes('problema') ||
    texto.includes('no puedo') ||
    texto.includes('no me deja') ||
    texto.includes('falla') ||
    texto.includes('observado') ||
    texto.includes('no funciona') ||
    texto.includes('no aparece')
  ) {
    return {
      respuesta:
        'Parece que tu caso requiere revisión de un encargado. Te recomiendo crear un ticket de soporte para que el área correspondiente pueda revisar tu problema. Puedo ayudarte a crearlo con el resumen de esta conversación.',
      requiereTicket: true
    };
  }

  return {
    respuesta:
      'Puedo ayudarte con información sobre trámites, costos, plazos, documentos, pagos, vouchers y estado de solicitudes. Si tu problema requiere revisión humana, puedes crear un ticket de soporte.',
    requiereTicket: false
  };
}

async function iniciarConversacion(req, res) {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({
        mensaje: 'Debe enviar el usuario para iniciar la conversación.'
      });
    }

    const pool = await poolPromise;

    const abierta = await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT TOP 1
          id_conversacion,
          codigo_conversacion,
          titulo,
          estado,
          fecha_inicio
        FROM conversaciones_antonia
        WHERE id_usuario = @id_usuario
          AND estado = 'ABIERTA'
        ORDER BY fecha_inicio DESC
      `);

    if (abierta.recordset.length > 0) {
      return res.json({
        mensaje: 'Ya existe una conversación abierta.',
        conversacion: abierta.recordset[0]
      });
    }

    const codigoConversacion = await generarCodigoUnico(
      pool,
      'conversaciones_antonia',
      'codigo_conversacion',
      generarCodigoConversacionAntonia
    );

    const resultado = await pool.request()
      .input('codigo_conversacion', sql.NVarChar, codigoConversacion)
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        INSERT INTO conversaciones_antonia (
          codigo_conversacion,
          id_usuario,
          titulo,
          estado
        )
        OUTPUT INSERTED.id_conversacion
        VALUES (
          @codigo_conversacion,
          @id_usuario,
          'Conversación con Antonia',
          'ABIERTA'
        )
      `);

    const idConversacion = resultado.recordset[0].id_conversacion;

    await guardarMensajeAntonia(
      pool,
      idConversacion,
      'ANTONIA',
      'Hola, soy Antonia, tu asistente virtual del Sistema TUPA UNSAAC. Puedes preguntarme sobre trámites, pagos, documentos o el estado de tus solicitudes.'
    );

    return res.status(201).json({
      mensaje: 'Conversación iniciada correctamente.',
      conversacion: {
        id_conversacion: idConversacion,
        codigo_conversacion: codigoConversacion,
        estado: 'ABIERTA'
      }
    });
  } catch (error) {
    console.error('Error al iniciar conversación con Antonia:', error);

    return res.status(500).json({
      mensaje: 'Error interno al iniciar la conversación.'
    });
  }
}

async function obtenerMensajes(req, res) {
  try {
    const { id_conversacion } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_conversacion', sql.Int, Number(id_conversacion))
      .query(`
        SELECT
          codigo_mensaje,
          emisor,
          mensaje,
          fecha_envio
        FROM mensajes_antonia
        WHERE id_conversacion = @id_conversacion
        ORDER BY fecha_envio ASC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al obtener mensajes de Antonia:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener mensajes.'
    });
  }
}

async function enviarMensaje(req, res) {
  try {
    const {
      id_usuario,
      id_conversacion,
      mensaje
    } = req.body;

    if (!id_usuario || !id_conversacion || !mensaje) {
      return res.status(400).json({
        mensaje: 'Faltan datos para enviar el mensaje.'
      });
    }

    const pool = await poolPromise;

    const conversacionResultado = await pool.request()
      .input('id_conversacion', sql.Int, Number(id_conversacion))
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT id_conversacion, estado
        FROM conversaciones_antonia
        WHERE id_conversacion = @id_conversacion
          AND id_usuario = @id_usuario
      `);

    if (conversacionResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Conversación no encontrada.'
      });
    }

    const conversacion = conversacionResultado.recordset[0];

    if (conversacion.estado !== 'ABIERTA') {
      return res.status(400).json({
        mensaje: 'La conversación ya está cerrada.'
      });
    }

    await guardarMensajeAntonia(
      pool,
      Number(id_conversacion),
      'USUARIO',
      mensaje.trim()
    );

    const respuesta = await generarRespuestaInteligente(
      pool,
      Number(id_usuario),
      mensaje.trim()
    );

    await guardarMensajeAntonia(
      pool,
      Number(id_conversacion),
      'ANTONIA',
      respuesta.respuesta
    );

    return res.json({
      mensaje: 'Mensaje enviado correctamente.',
      respuesta: respuesta.respuesta,
      requiereTicket: respuesta.requiereTicket
    });
  } catch (error) {
    console.error('Error al enviar mensaje a Antonia:', error);

    return res.status(500).json({
      mensaje: 'Error interno al enviar el mensaje.'
    });
  }
}

async function cerrarConversacion(req, res) {
  try {
    const { id_conversacion } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input('id_conversacion', sql.Int, Number(id_conversacion))
      .query(`
        UPDATE conversaciones_antonia
        SET
          estado = 'CERRADA',
          fecha_cierre = SYSDATETIME()
        WHERE id_conversacion = @id_conversacion
      `);

    return res.json({
      mensaje: 'Conversación cerrada correctamente.'
    });
  } catch (error) {
    console.error('Error al cerrar conversación:', error);

    return res.status(500).json({
      mensaje: 'Error interno al cerrar conversación.'
    });
  }
}

module.exports = {
  iniciarConversacion,
  obtenerMensajes,
  enviarMensaje,
  cerrarConversacion
};