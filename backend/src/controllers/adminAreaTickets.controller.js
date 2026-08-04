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

function generarCodigoMensajeSeguro() {
  return generarCodigoSimple('MSG');
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

async function listarTicketsAdminArea(req, res) {
  try {
    const pool = await poolPromise;

    const resultado = await pool.request().query(`
      SELECT
        t.id_ticket,
        t.codigo_ticket,
        t.id_usuario,
        t.asunto,
        t.categoria,
        t.prioridad,
        t.estado,
        t.fecha_creacion,
        t.fecha_cierre,

        u.codigo_usuario,
        u.nombres,
        u.apellidos,
        u.dni,
        u.correo,

        ultimo.mensaje AS ultimo_mensaje,
        ultimo.fecha_envio AS fecha_ultimo_mensaje,

        (
          SELECT COUNT(*)
          FROM mensajes_ticket mt
          WHERE mt.id_ticket = t.id_ticket
        ) AS total_mensajes

      FROM tickets_soporte t
      LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario

      OUTER APPLY (
        SELECT TOP 1
          mt.mensaje,
          mt.fecha_envio
        FROM mensajes_ticket mt
        WHERE mt.id_ticket = t.id_ticket
        ORDER BY mt.fecha_envio DESC
      ) ultimo

      ORDER BY
        CASE
          WHEN t.estado = 'ABIERTO' THEN 1
          WHEN t.estado = 'EN_ATENCION' THEN 2
          WHEN t.estado = 'RESUELTO' THEN 3
          WHEN t.estado = 'CERRADO' THEN 4
          ELSE 5
        END,
        ISNULL(ultimo.fecha_envio, t.fecha_creacion) DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al listar tickets Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al listar consultas del Admin de Área.'
    });
  }
}

async function obtenerTicketAdminArea(req, res) {
  try {
    const { id_ticket } = req.params;

    const pool = await poolPromise;

    const ticketResultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        SELECT
          t.id_ticket,
          t.codigo_ticket,
          t.id_usuario,
          t.asunto,
          t.categoria,
          t.prioridad,
          t.estado,
          t.fecha_creacion,
          t.fecha_cierre,

          u.codigo_usuario,
          u.nombres,
          u.apellidos,
          u.dni,
          u.correo
        FROM tickets_soporte t
        LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
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
          id_mensaje_ticket,
          codigo_mensaje,
          id_ticket,
          id_usuario,
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
    console.error('Error al obtener ticket Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener la consulta.'
    });
  }
}

async function responderTicketAdminArea(req, res) {
  try {
    const { id_ticket } = req.params;
    const { mensaje, id_usuario } = req.body;

    if (!mensaje || mensaje.trim() === '') {
      return res.status(400).json({
        mensaje: 'Debe escribir una respuesta.'
      });
    }

    const pool = await poolPromise;

    const ticketResultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        SELECT id_ticket, estado
        FROM tickets_soporte
        WHERE id_ticket = @id_ticket
      `);

    if (ticketResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Ticket no encontrado.'
      });
    }

    const codigoMensaje = await generarCodigoUnico(
      pool,
      'mensajes_ticket',
      'codigo_mensaje',
      generarCodigoMensajeSeguro
    );

    await pool.request()
      .input('codigo_mensaje', sql.NVarChar, codigoMensaje)
      .input('id_ticket', sql.Int, Number(id_ticket))
      .input('id_usuario', sql.Int, id_usuario ? Number(id_usuario) : null)
      .input('emisor', sql.NVarChar, 'ENCARGADO')
      .input('mensaje', sql.NVarChar, mensaje.trim())
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

    await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        UPDATE tickets_soporte
        SET estado = 'EN_ATENCION'
        WHERE id_ticket = @id_ticket
          AND estado NOT IN ('RESUELTO', 'CERRADO')
      `);

    return res.json({
      mensaje: 'Respuesta enviada correctamente.',
      codigo_mensaje: codigoMensaje
    });
  } catch (error) {
    console.error('Error al responder ticket Admin Área:', error);

    return res.status(500).json({
      mensaje: 'Error interno al responder la consulta.'
    });
  }
}

async function finalizarAtencionTicket(req, res) {
  try {
    const { id_ticket } = req.params;

    const pool = await poolPromise;

    const resultado = await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        SELECT id_ticket
        FROM tickets_soporte
        WHERE id_ticket = @id_ticket
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Ticket no encontrado.'
      });
    }

    await pool.request()
      .input('id_ticket', sql.Int, Number(id_ticket))
      .query(`
        UPDATE tickets_soporte
        SET estado = 'RESUELTO',
            fecha_cierre = SYSDATETIME()
        WHERE id_ticket = @id_ticket
      `);

    return res.json({
      mensaje: 'Atención finalizada correctamente.',
      estado: 'RESUELTO'
    });
  } catch (error) {
    console.error('Error al finalizar atención:', error);

    return res.status(500).json({
      mensaje: 'Error interno al finalizar la atención.'
    });
  }
}

module.exports = {
  listarTicketsAdminArea,
  obtenerTicketAdminArea,
  responderTicketAdminArea,
  finalizarAtencionTicket
};