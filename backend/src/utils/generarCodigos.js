function obtenerAnioCorto() {
  return new Date().getFullYear().toString().slice(-2);
}

function generarBloqueAleatorio(longitud = 6) {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let resultado = '';

  for (let i = 0; i < longitud; i++) {
    const posicion = Math.floor(Math.random() * caracteres.length);
    resultado += caracteres[posicion];
  }

  return resultado;
}

function generarCodigoPublico(prefijo) {
  const anio = obtenerAnioCorto();
  const bloque = generarBloqueAleatorio(6);

  return `${prefijo}-${anio}-${bloque}`;
}

function generarCodigoUsuario() {
  return generarCodigoPublico('USU');
}

function generarCodigoSolicitud() {
  return generarCodigoPublico('SOL');
}

function generarCodigoDocumento() {
  return generarCodigoPublico('DOC');
}

function generarCodigoHistorial() {
  return generarCodigoPublico('HIS');
}

function generarCodigoNotificacion() {
  return generarCodigoPublico('NOT');
}

function generarCodigoTicket() {
  return generarCodigoPublico('TCK');
}

function generarCodigoMensaje() {
  return generarCodigoPublico('MSG');
}

function generarCodigoConversacionAntonia() {
  return generarCodigoPublico('ANT');
}

function generarCodigoPago() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

module.exports = {
  generarCodigoUsuario,
  generarCodigoSolicitud,
  generarCodigoDocumento,
  generarCodigoHistorial,
  generarCodigoNotificacion,
  generarCodigoTicket,
  generarCodigoMensaje,
  generarCodigoConversacionAntonia,
  generarCodigoPago
};