const { sql, poolPromise } = require('../config/db');

const {
  generarCodigoTicket,
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

async function guardarMensajeTicket(pool, idTicket, idUsuario, emisor, mensaje) {
  const codigoMensaje = await generarCodigoUnico(
    pool,
    'mensajes_ticket',
    'codigo_mensaje',
    generarCodigoMensaje
  );

  await pool.request()
    .input('codigo_mensaje', sql.NVarChar, codigoMensaje)
    .input('id_ticket', sql.Int, Number(idTicket))
    .input('id_usuario', sql.Int, idUsuario ? Number(idUsuario) : null)
    .input('emisor', sql.NVarChar, emisor)
    .input('mensaje', sql.NVarChar, mensaje)
    .query(`
      INSERT INTO mensajes_ticket (
        codigo_mensaje,
        id_ticket,
        id_usuario,
        emisor,
        mensaje
      )
      VALUES (
        @codigo_mensaje,
        @id_ticket,
        @id_usuario,
        @emisor,
        @mensaje
      )
    `);

  return codigoMensaje;
}

async function crearTicket(req, res) {
  try {
    const {
      id_usuario,
      asunto,
      categoria,
      prioridad,
      mensaje,
      id_conversacion_antonia
    } = req.body;

    if (!id_usuario || !asunto || !categoria || !mensaje) {
      return res.status(400).json({
        mensaje: 'Debe completar asunto, categoría y mensaje del ticket.'
      });
    }

    const prioridadFinal = prioridad || 'MEDIA';

    if (!['BAJA', 'MEDIA', 'ALTA'].includes(prioridadFinal)) {
      return res.status(400).json({
        mensaje: 'Prioridad no válida.'
      });
    }

    const pool = await poolPromise;

    const codigoTicket = await generarCodigoUnico(
      pool,
      'tickets_soporte',
      'codigo_ticket',
      generarCodigoTicket
    );

    const resultado = await pool.request()
      .input('codigo_ticket', sql.NVarChar, codigoTicket)
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('asunto', sql.NVarChar, asunto.trim())
      .input('categoria', sql.NVarChar, categoria)
      .input('prioridad', sql.NVarChar, prioridadFinal)
      .input(
        'id_conversacion_antonia',
        sql.Int,
        id_conversacion_antonia ? Number(id_conversacion_antonia) : null
      )
      .query(`
        INSERT INTO tickets_soporte (
          codigo_ticket,
          id_usuario,
          asunto,
          categoria,
          prioridad,
          estado,
          id_conversacion_antonia
        )
        OUTPUT INSERTED.id_ticket
        VALUES (
          @codigo_ticket,
          @id_usuario,
          @asunto,
          @categoria,
          @prioridad,
          'ABIERTO',
          @id_conversacion_antonia
        )
      `);

    const idTicket = resultado.recordset[0].id_ticket;

    await guardarMensajeTicket(
      pool,
      idTicket,
      Number(id_usuario),
      'USUARIO',
      mensaje.trim()
    );

    await guardarMensajeTicket(
      pool,
      idTicket,
      null,
      'SISTEMA',
      'Ticket registrado correctamente. Un encargado revisará el caso y responderá en esta conversación.'
    );

    return res.status(201).json({
      mensaje: 'Ticket creado correctamente.',
      ticket: {
        id_ticket: idTicket,
        codigo_ticket: codigoTicket,
        estado: 'ABIERTO'
      }
    });
  } catch (error) {
    console.error('Error al crear ticket:', error);

    return res.status(500).json({
      mensaje: 'Error interno al crear el ticket.'
    });
  }
}

async function listarTicketsUsuario(req, res) {
  try {
    const { id_usuario } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT
          id_ticket,
          codigo_ticket,
          asunto,
          categoria,
          prioridad,
          estado,
          fecha_creacion,
          fecha_cierre
        FROM tickets_soporte
        WHERE id_usuario = @id_usuario
        ORDER BY fecha_creacion DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar tickets:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar tickets.'
    });
  }
}

async function obtenerTicket(req, res) {
  try {
    const { id_ticket } = req.params;

    const pool = await poolPromise;

    const ticketResultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        SELECT
          t.id_ticket,
          t.codigo_ticket,
          t.asunto,
          t.categoria,
          t.prioridad,
          t.estado,
          t.fecha_creacion,
          t.fecha_cierre,
          u.codigo_usuario,
          u.nombres,
          u.apellidos,
          u.correo
        FROM tickets_soporte t
        INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
        WHERE t.id_ticket = @id_ticket
      `);

    if (ticketResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Ticket no encontrado.'
      });
    }

    const mensajesResultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        SELECT
          codigo_mensaje,
          emisor,
          mensaje,
          fecha_envio,
          leido
        FROM mensajes_ticket
        WHERE id_ticket = @id_ticket
        ORDER BY fecha_envio ASC
      `);

    return res.json({
      ticket: ticketResultado.recordset[0],
      mensajes: mensajesResultado.recordset
    });
  } catch (error) {
    console.error('Error al obtener ticket:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener ticket.'
    });
  }
}

async function enviarMensajeTicket(req, res) {
  try {
    const {
      id_usuario,
      mensaje
    } = req.body;

    const { id_ticket } = req.params;

    if (!id_usuario || !mensaje) {
      return res.status(400).json({
        mensaje: 'Debe escribir un mensaje.'
      });
    }

    const pool = await poolPromise;

    const ticketResultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT id_ticket, estado
        FROM tickets_soporte
        WHERE id_ticket = @id_ticket
          AND id_usuario = @id_usuario
      `);

    if (ticketResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Ticket no encontrado.'
      });
    }

    const ticket = ticketResultado.recordset[0];

    if (ticket.estado === 'CERRADO') {
      return res.status(400).json({
        mensaje: 'El ticket está cerrado.'
      });
    }

    await guardarMensajeTicket(
      pool,
      Number(id_ticket),
      Number(id_usuario),
      'USUARIO',
      mensaje.trim()
    );

    await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        UPDATE tickets_soporte
        SET estado = 'EN_ATENCION'
        WHERE id_ticket = @id_ticket
          AND estado = 'ABIERTO'
      `);

    return res.json({
      mensaje: 'Mensaje enviado correctamente.'
    });
  } catch (error) {
    console.error('Error al enviar mensaje del ticket:', error);

    return res.status(500).json({
      mensaje: 'Error interno al enviar mensaje.'
    });
  }
}

async function cerrarTicket(req, res) {
  try {
    const { id_ticket } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        UPDATE tickets_soporte
        SET
          estado = 'CERRADO',
          fecha_cierre = SYSDATETIME()
        WHERE id_ticket = @id_ticket
      `);

    await guardarMensajeTicket(
      pool,
      Number(id_ticket),
      null,
      'SISTEMA',
      'El ticket fue cerrado por el usuario.'
    );

    return res.json({
      mensaje: 'Ticket cerrado correctamente.'
    });
  } catch (error) {
    console.error('Error al cerrar ticket:', error);

    return res.status(500).json({
      mensaje: 'Error interno al cerrar ticket.'
    });
  }
}

/*
  Endpoint opcional para pruebas.
  Más adelante esto lo usará el panel del encargado/revisor/admin.
*/
async function responderComoEncargado(req, res) {
  try {
    const { id_ticket } = req.params;
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({
        mensaje: 'Debe escribir una respuesta.'
      });
    }

    const pool = await poolPromise;

    await guardarMensajeTicket(
      pool,
      Number(id_ticket),
      null,
      'ENCARGADO',
      mensaje.trim()
    );

    await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        UPDATE tickets_soporte
        SET estado = 'EN_ATENCION'
        WHERE id_ticket = @id_ticket
      `);

    return res.json({
      mensaje: 'Respuesta del encargado registrada correctamente.'
    });
  } catch (error) {
    console.error('Error al responder como encargado:', error);

    return res.status(500).json({
      mensaje: 'Error interno al responder ticket.'
    });
  }
}

module.exports = {
  crearTicket,
  listarTicketsUsuario,
  obtenerTicket,
  enviarMensajeTicket,
  cerrarTicket,
  responderComoEncargado
};