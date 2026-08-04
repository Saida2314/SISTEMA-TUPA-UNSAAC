import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTramiteDocumentos() {
  const navigate = useNavigate();
  const { id } = useParams();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [tramite, setTramite] = useState(null);

  const [metodoPago, setMetodoPago] = useState('Caja/Banco');
  const [pagoGenerado, setPagoGenerado] = useState(null);
  const [claveVoucher, setClaveVoucher] = useState('');
  const [pagoValidado, setPagoValidado] = useState(false);

  const [documentos, setDocumentos] = useState([]);
  const [archivoVoucher, setArchivoVoucher] = useState(null);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [cargandoTramite, setCargandoTramite] = useState(true);
  const [generandoPago, setGenerandoPago] = useState(false);
  const [validandoPago, setValidandoPago] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  async function cargarTramite() {
    try {
      setCargandoTramite(true);
      setMensaje('');

      const response = await api.get(`/public/tramites/${id}`);
      setTramite(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar la información del trámite.');
      setTipoMensaje('error');
    } finally {
      setCargandoTramite(false);
    }
  }

  useEffect(() => {
    cargarTramite();
  }, [id]);

  function formatearPeso(bytes) {
    if (!bytes) return '0 KB';

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${kb.toFixed(1)} KB`;
  }

  function abrirArchivo(archivo) {
    if (!archivo) return;

    const urlTemporal = URL.createObjectURL(archivo);

    window.open(urlTemporal, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(urlTemporal);
    }, 60000);
  }

  function quitarDocumento(indexDocumento) {
    const nuevosDocumentos = documentos.filter((_, index) => index !== indexDocumento);
    setDocumentos(nuevosDocumentos);
  }

  function quitarVoucher() {
    setArchivoVoucher(null);
  }

  async function generarCodigoPago() {
    if (!usuario?.id_usuario) {
      setMensaje('No se pudo identificar al usuario. Inicie sesión nuevamente.');
      setTipoMensaje('error');
      return;
    }

    try {
      setGenerandoPago(true);
      setMensaje('');
      setTipoMensaje('');

      const response = await api.post('/pagos/generar', {
        id_usuario: usuario.id_usuario,
        id_tramite: Number(id),
        metodo_pago: metodoPago
      });

      setPagoGenerado(response.data.pago);
      setPagoValidado(false);
      setClaveVoucher('');

      setMensaje('Código de pago generado correctamente.');
      setTipoMensaje('success');
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo generar el código de pago.');
      setTipoMensaje('error');
    } finally {
      setGenerandoPago(false);
    }
  }

  async function validarPago() {
    if (!pagoGenerado) {
      setMensaje('Primero debe generar un código de pago.');
      setTipoMensaje('error');
      return;
    }

    if (!/^[0-9]{5}$/.test(claveVoucher)) {
      setMensaje('La clave del voucher debe tener exactamente 5 números.');
      setTipoMensaje('error');
      return;
    }

    try {
      setValidandoPago(true);
      setMensaje('');
      setTipoMensaje('');

      const response = await api.post('/pagos/validar', {
        id_pago: pagoGenerado.id_pago,
        codigo_pago: pagoGenerado.codigo_pago,
        clave_voucher: claveVoucher
      });

      setPagoGenerado(response.data.pago);
      setPagoValidado(true);

      setMensaje('Pago validado correctamente. Ahora puedes subir y revisar tus documentos.');
      setTipoMensaje('success');
    } catch (error) {
      console.error(error);
      setPagoValidado(false);
      setMensaje(error.response?.data?.mensaje || 'No se pudo validar el pago.');
      setTipoMensaje('error');
    } finally {
      setValidandoPago(false);
    }
  }

  function manejarDocumentos(e) {
    const archivosSeleccionados = Array.from(e.target.files);

    const archivosValidos = archivosSeleccionados.filter((archivo) => {
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
      const pesoMaximo = 5 * 1024 * 1024;

      return tiposPermitidos.includes(archivo.type) && archivo.size <= pesoMaximo;
    });

    if (archivosValidos.length !== archivosSeleccionados.length) {
      setMensaje('Algunos archivos fueron rechazados. Solo se permite PDF, JPG o PNG de máximo 5 MB.');
      setTipoMensaje('error');
    }

    setDocumentos((anteriores) => [...anteriores, ...archivosValidos]);

    e.target.value = '';
  }

  function manejarVoucher(e) {
    const archivo = e.target.files[0];

    if (!archivo) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    const pesoMaximo = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      setMensaje('El voucher debe ser PDF, JPG o PNG.');
      setTipoMensaje('error');
      e.target.value = '';
      return;
    }

    if (archivo.size > pesoMaximo) {
      setMensaje('El voucher no debe superar los 5 MB.');
      setTipoMensaje('error');
      e.target.value = '';
      return;
    }

    setArchivoVoucher(archivo);
    e.target.value = '';
  }

  async function enviarSolicitud(e) {
    e.preventDefault();

    if (!usuario?.id_usuario) {
      setMensaje('No se pudo identificar al usuario. Inicie sesión nuevamente.');
      setTipoMensaje('error');
      return;
    }

    if (!pagoGenerado || !pagoValidado) {
      setMensaje('Debe generar y validar el pago antes de enviar la solicitud.');
      setTipoMensaje('error');
      return;
    }

    if (documentos.length === 0) {
      setMensaje('Debe subir al menos un documento requerido.');
      setTipoMensaje('error');
      return;
    }

    if (!archivoVoucher) {
      setMensaje('Debe subir el archivo del voucher de pago.');
      setTipoMensaje('error');
      return;
    }

    try {
      setEnviandoSolicitud(true);
      setMensaje('');
      setTipoMensaje('');

      const formData = new FormData();

      formData.append('id_usuario', usuario.id_usuario);
      formData.append('id_tramite', Number(id));
      formData.append('id_pago', pagoGenerado.id_pago);

      documentos.forEach((archivo) => {
        formData.append('documentos', archivo);
      });

      formData.append('voucher', archivoVoucher);

      const response = await api.post('/solicitudes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const idSolicitud = response.data.solicitud.id_solicitud;

      navigate(`/usuario/tramites/${id}/confirmacion?idSolicitud=${idSolicitud}`);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo enviar la solicitud.');
      setTipoMensaje('error');
    } finally {
      setEnviandoSolicitud(false);
    }
  }

  if (cargandoTramite) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>Cargando trámite...</h3>
          <p>Consultando información desde la base de datos.</p>
        </div>
      </UsuarioLayout>
    );
  }

  if (!tramite) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>No se encontró el trámite solicitado.</h3>
          <Link to="/usuario/tramites" className="btn-primary">
            Volver al catálogo
          </Link>
        </div>
      </UsuarioLayout>
    );
  }

  const puedeEnviar =
    pagoGenerado &&
    pagoValidado &&
    documentos.length > 0 &&
    archivoVoucher &&
    !enviandoSolicitud;

  return (
    <UsuarioLayout>
      <div className="stepper">
        <div className="active">
          <span>1</span>
          <strong>Información</strong>
        </div>

        <div className="active">
          <span>2</span>
          <strong>Pago y documentos</strong>
        </div>

        <div>
          <span>3</span>
          <strong>Confirmación</strong>
        </div>
      </div>

      <form onSubmit={enviarSolicitud}>
        <section className="documents-layout">
          <aside className="summary-panel">
            <span className="procedure-badge">
              {tramite.codigo_publico_tramite || tramite.codigo}
            </span>

            <h1>{tramite.nombre}</h1>

            <p>{tramite.descripcion}</p>

            <h3>Resumen del trámite</h3>

            <div className="mini-summary">
              <div>
                <small>Costo</small>
                <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
              </div>

              <div>
                <small>Duración</small>
                <strong>
                  {tramite.plazo_dias} {tramite.tipo_plazo}
                </strong>
              </div>
            </div>

            <div className="process-note">
              <strong>Revisión antes de enviar</strong>
              <p>
                Puedes abrir cada archivo cargado antes de enviar la solicitud.
                Así verificas que el documento sea correcto, legible y corresponda
                al trámite.
              </p>
            </div>
          </aside>

          <article className="request-form-panel">
            <header>Completar Solicitud</header>

            <div className="request-section">
              <h3>1. Generar código de pago</h3>

              <p>
                Selecciona un método de pago y genera un código único. Este código
                reemplaza la búsqueda manual del concepto de pago.
              </p>

              <div className="payment-grid">
                {['Caja/Banco', 'Tarjeta', 'Billetera Digital'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={metodoPago === item ? 'active' : ''}
                    onClick={() => {
                      if (!pagoGenerado) {
                        setMetodoPago(item);
                      }
                    }}
                    disabled={Boolean(pagoGenerado)}
                  >
                    {item === 'Caja/Banco' && '🏦'}
                    {item === 'Tarjeta' && '💳'}
                    {item === 'Billetera Digital' && '▦'}
                    <span>{item}</span>
                  </button>
                ))}
              </div>

              {!pagoGenerado && (
                <button
                  type="button"
                  className="btn-primary fit payment-action"
                  onClick={generarCodigoPago}
                  disabled={generandoPago}
                >
                  {generandoPago ? 'Generando...' : 'Generar código de pago'}
                </button>
              )}

              {pagoGenerado && (
                <div className="payment-code-card">
                  <small>Código de pago generado</small>
                  <strong>{pagoGenerado.codigo_pago}</strong>

                  <div>
                    <span>Método:</span>
                    <b>{metodoPago}</b>
                  </div>

                  <div>
                    <span>Monto:</span>
                    <b>S/ {Number(pagoGenerado.monto).toFixed(2)}</b>
                  </div>

                  <div>
                    <span>Estado:</span>
                    <b className={pagoValidado ? 'text-success' : 'text-warning'}>
                      {pagoValidado ? 'VALIDADO' : 'GENERADO'}
                    </b>
                  </div>
                </div>
              )}
            </div>

            <div className={`request-section ${!pagoGenerado ? 'disabled-section' : ''}`}>
              <h3>2. Validar pago</h3>

              <p>
                Ingresa la clave del voucher. Por ahora la validación es simulada,
                pero ya queda preparada para integrarse luego con recaudación.
              </p>

              <label>Clave de voucher</label>

              <div className="voucher-row">
                <input
                  placeholder="5 números"
                  value={claveVoucher}
                  maxLength="5"
                  inputMode="numeric"
                  disabled={!pagoGenerado || pagoValidado}
                  onChange={(e) => {
                    setClaveVoucher(e.target.value.replace(/\D/g, ''));
                  }}
                />

                <button
                  type="button"
                  onClick={validarPago}
                  disabled={!pagoGenerado || pagoValidado || validandoPago}
                >
                  {pagoValidado ? 'Validado' : validandoPago ? 'Validando...' : 'Validar'}
                </button>
              </div>

              {pagoValidado && (
                <p className="success-message">
                  Pago validado correctamente. Ya puedes cargar tus documentos.
                </p>
              )}
            </div>

            <div className={`request-section ${!pagoValidado ? 'disabled-section' : ''}`}>
              <h3>3. Subir y revisar documentos</h3>

              <p>
                Adjunta tus documentos y revísalos antes de enviar. Puedes abrirlos
                o quitarlos si seleccionaste un archivo incorrecto.
              </p>

              <label>Documentos requeridos</label>

              <label className="upload-area">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={!pagoValidado}
                  onChange={manejarDocumentos}
                />

                <span>☁</span>
                <strong>Haz clic para subir documentos</strong>
                <small>PDF, JPG o PNG. Máximo 5 MB por archivo.</small>
              </label>

              {documentos.length > 0 && (
                <div className="preview-panel">
                  <div className="preview-header">
                    <h4>Documentos seleccionados</h4>
                    <small>{documentos.length} archivo(s)</small>
                  </div>

                  {documentos.map((file, index) => (
                    <div className="preview-file-card" key={`${file.name}-${index}`}>
                      <div className="file-main-info">
                        <span className="file-icon">
                          {file.type === 'application/pdf' ? '📄' : '🖼'}
                        </span>

                        <div>
                          <strong>{file.name}</strong>
                          <small>{file.type || 'Archivo'} · {formatearPeso(file.size)}</small>
                        </div>
                      </div>

                      <div className="file-actions">
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() => abrirArchivo(file)}
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          className="mini-button danger"
                          onClick={() => quitarDocumento(index)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label>Archivo del voucher</label>

              <label className="upload-area compact">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={!pagoValidado}
                  onChange={manejarVoucher}
                />

                <span>▤</span>
                <strong>Subir voucher de pago</strong>
                <small>Debe coincidir con la clave validada.</small>
              </label>

              {archivoVoucher && (
                <div className="preview-panel">
                  <div className="preview-header">
                    <h4>Voucher seleccionado</h4>
                    <small>1 archivo</small>
                  </div>

                  <div className="preview-file-card">
                    <div className="file-main-info">
                      <span className="file-icon">
                        {archivoVoucher.type === 'application/pdf' ? '📄' : '🖼'}
                      </span>

                      <div>
                        <strong>{archivoVoucher.name}</strong>
                        <small>
                          {archivoVoucher.type || 'Archivo'} · {formatearPeso(archivoVoucher.size)}
                        </small>
                      </div>
                    </div>

                    <div className="file-actions">
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => abrirArchivo(archivoVoucher)}
                      >
                        Ver
                      </button>

                      <button
                        type="button"
                        className="mini-button danger"
                        onClick={quitarVoucher}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mensaje && (
                <p className={tipoMensaje === 'success' ? 'success-message' : 'auth-error'}>
                  {mensaje}
                </p>
              )}
            </div>

            <footer>
              <Link to={`/usuario/tramites/${id}`} className="btn-secondary">
                Regresar
              </Link>

              <button type="submit" className="btn-primary" disabled={!puedeEnviar}>
                {enviandoSolicitud ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </footer>
          </article>
        </section>
      </form>
    </UsuarioLayout>
  );
}

export default UsuarioTramiteDocumentos;