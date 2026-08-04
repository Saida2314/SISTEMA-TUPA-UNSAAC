const { sql, poolPromise } = require('../config/db');
const { generarCodigoPago } = require('../utils/generarCodigos');

async function generarCodigoPagoUnico(pool) {
  let codigoPago = generarCodigoPago();
  let existe = true;

  while (existe) {
    const resultado = await pool.request()
      .input('codigo_pago', sql.NVarChar, codigoPago)
      .query(`
        SELECT id_pago
        FROM pagos_solicitud
        WHERE codigo_pago = @codigo_pago
      `);

    if (resultado.recordset.length === 0) {
      existe = false;
    } else {
      codigoPago = generarCodigoPago();
    }
  }

  return codigoPago;
}

async function generarPago(req, res) {
  try {
    const {
      id_usuario,
      id_tramite,
      metodo_pago
    } = req.body;

    if (!id_usuario || !id_tramite || !metodo_pago) {
      return res.status(400).json({
        mensaje: 'Faltan datos para generar el código de pago.'
      });
    }

    const metodosPermitidos = ['Caja/Banco', 'Tarjeta', 'Billetera Digital'];

    if (!metodosPermitidos.includes(metodo_pago)) {
      return res.status(400).json({
        mensaje: 'Método de pago no válido.'
      });
    }

    const pool = await poolPromise;

    const usuarioResultado = await pool.request()
      .input('id_usuario', sql.Int, Number(id_usuario))
      .query(`
        SELECT 
          id_usuario,
          codigo_usuario,
          estado
        FROM usuarios
        WHERE id_usuario = @id_usuario
      `);

    if (usuarioResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado.'
      });
    }

    const usuario = usuarioResultado.recordset[0];

    if (usuario.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'El usuario no se encuentra activo.'
      });
    }

    const tramiteResultado = await pool.request()
      .input('id_tramite', sql.Int, Number(id_tramite))
      .query(`
        SELECT 
          id_tramite,
          codigo_publico_tramite,
          nombre,
          costo,
          estado
        FROM tramites
        WHERE id_tramite = @id_tramite
      `);

    if (tramiteResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'Trámite no encontrado.'
      });
    }

    const tramite = tramiteResultado.recordset[0];

    if (tramite.estado !== 'ACTIVO') {
      return res.status(400).json({
        mensaje: 'El trámite no se encuentra activo.'
      });
    }

    const codigoPago = await generarCodigoPagoUnico(pool);

    const pagoResultado = await pool.request()
      .input('codigo_pago', sql.NVarChar, codigoPago)
      .input('id_usuario', sql.Int, Number(id_usuario))
      .input('id_tramite', sql.Int, Number(id_tramite))
      .input('metodo_pago', sql.NVarChar, metodo_pago)
      .input('monto', sql.Decimal(10, 2), Number(tramite.costo))
      .query(`
        INSERT INTO pagos_solicitud (
          codigo_pago,
          id_usuario,
          id_tramite,
          metodo_pago,
          monto,
          estado_pago
        )
        OUTPUT INSERTED.id_pago
        VALUES (
          @codigo_pago,
          @id_usuario,
          @id_tramite,
          @metodo_pago,
          @monto,
          'GENERADO'
        )
      `);

    return res.status(201).json({
      mensaje: 'Código de pago generado correctamente.',
      pago: {
        id_pago: pagoResultado.recordset[0].id_pago,
        codigo_pago: codigoPago,
        metodo_pago,
        monto: Number(tramite.costo),
        estado_pago: 'GENERADO',
        usuario: {
          codigo_usuario: usuario.codigo_usuario
        },
        tramite: {
          codigo_publico_tramite: tramite.codigo_publico_tramite,
          nombre: tramite.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error al generar pago:', error);

    return res.status(500).json({
      mensaje: 'Error interno al generar el código de pago.'
    });
  }
}

async function validarPago(req, res) {
  try {
    const {
      id_pago,
      codigo_pago,
      clave_voucher
    } = req.body;

    if (!id_pago || !codigo_pago || !clave_voucher) {
      return res.status(400).json({
        mensaje: 'Debe ingresar el código de pago y la clave del voucher.'
      });
    }

    if (!/^[0-9]{9}$/.test(codigo_pago)) {
      return res.status(400).json({
        mensaje: 'El código de pago debe tener exactamente 9 números.'
      });
    }

    if (!/^[0-9]{5}$/.test(clave_voucher.trim())) {
      return res.status(400).json({
        mensaje: 'La clave del voucher debe tener exactamente 5 números.'
      });
    }

    const pool = await poolPromise;

    const pagoResultado = await pool.request()
      .input('id_pago', sql.Int, Number(id_pago))
      .input('codigo_pago', sql.NVarChar, codigo_pago)
      .query(`
        SELECT 
          id_pago,
          codigo_pago,
          id_usuario,
          id_tramite,
          metodo_pago,
          monto,
          estado_pago
        FROM pagos_solicitud
        WHERE id_pago = @id_pago
          AND codigo_pago = @codigo_pago
      `);

    if (pagoResultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: 'El código de pago no existe.'
      });
    }

    const pago = pagoResultado.recordset[0];

    if (pago.estado_pago === 'VALIDADO') {
      return res.status(400).json({
        mensaje: 'Este pago ya fue validado anteriormente.'
      });
    }

    if (pago.estado_pago !== 'GENERADO') {
      return res.status(400).json({
        mensaje: 'Este pago no se encuentra disponible para validación.'
      });
    }

    const voucherUsado = await pool.request()
      .input('clave_voucher', sql.NVarChar, clave_voucher.trim())
      .query(`
        SELECT id_pago
        FROM pagos_solicitud
        WHERE clave_voucher = @clave_voucher
          AND estado_pago = 'VALIDADO'
      `);

    if (voucherUsado.recordset.length > 0) {
      return res.status(400).json({
        mensaje: 'Esta clave de voucher ya fue utilizada en otro pago.'
      });
    }

    await pool.request()
      .input('id_pago', sql.Int, Number(id_pago))
      .input('clave_voucher', sql.NVarChar, clave_voucher.trim())
      .query(`
        UPDATE pagos_solicitud
        SET
          clave_voucher = @clave_voucher,
          estado_pago = 'VALIDADO',
          fecha_validacion = SYSDATETIME()
        WHERE id_pago = @id_pago
      `);

    return res.json({
      mensaje: 'Pago validado correctamente.',
      pago: {
        id_pago: pago.id_pago,
        codigo_pago: pago.codigo_pago,
        id_usuario: pago.id_usuario,
        id_tramite: pago.id_tramite,
        metodo_pago: pago.metodo_pago,
        monto: Number(pago.monto),
        estado_pago: 'VALIDADO'
      }
    });
  } catch (error) {
    console.error('Error al validar pago:', error);

    return res.status(500).json({
      mensaje: 'Error interno al validar el pago.'
    });
  }
}

module.exports = {
  generarPago,
  validarPago
};