import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import RevisorLayout from '../components/RevisorLayout';
import api from '../../../services/api';

function RevisorExpedienteDetalle() {
  const { idSolicitud } = useParams();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [solicitud, setSolicitud] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [derivaciones, setDerivaciones] = useState([]);

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  const [pestanaDerecha, setPestanaDerecha] = useState('REVISION');

  const [observacion, setObservacion] = useState('');
  const [tipoObservacion, setTipoObservacion] = useState('DOCUMENTOS');

  const [motivoRechazo, setMotivoRechazo] = useState('');

  async function cargarDetalle() {
    try {
      setCargando(true);
      setMensaje('');
      setTipoMensaje('');

      const response = await api.get(`/revisor/solicitudes/${idSolicitud}`);

      const documentosBD = response.data.documentos || [];

      setSolicitud(response.data.solicitud);
      setDocumentos(documentosBD);
      setHistorial(response.data.historial || []);
      setObservaciones(response.data.observaciones || []);
      setDerivaciones(response.data.derivaciones || []);
      setDocumentoSeleccionado(documentosBD[0] || null);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo cargar el expediente.');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDetalle();
  }, [idSolicitud]);

  const voucher = useMemo(() => {
    return documentos.find((doc) => doc.tipo_documento === 'voucher') || null;
  }, [documentos]);

  const documentosRequeridos = useMemo(() => {
    return documentos.filter((doc) => doc.tipo_documento !== 'voucher');
  }, [documentos]);

  function formatearFecha(fecha) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  function claseEstado(estado) {
    if (estado === 'REGISTRADO') return 'registered';
    if (estado === 'EN_REVISION') return 'review';
    if (estado === 'OBSERVADO') return 'observed';
    if (estado === 'RECHAZADO') return 'rejected';
    if (estado === 'DERIVADO') return 'derived';
    if (estado === 'FINALIZADO') return 'validated';

    return 'neutral';
  }

  function responsableActual() {
    const nombres = usuario?.nombres || 'Revisor';
    const apellidos = usuario?.apellidos || '';

    return `${nombres} ${apellidos}`.trim();
  }

  async function tomarEnRevision() {
    try {
      await api.put(`/revisor/solicitudes/${idSolicitud}/estado`, {
        nuevo_estado: 'EN_REVISION',
        descripcion: 'El expediente fue tomado en revisión para verificar datos, documentos y voucher.',
        responsable: responsableActual()
      });

      setMensaje('El expediente fue tomado en revisión correctamente.');
      setTipoMensaje('success');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo tomar el expediente en revisión.');
      setTipoMensaje('error');
    }
  }

  async function enviarObservacion() {
    if (!observacion.trim()) {
      setMensaje('Debe escribir la observación antes de enviarla.');
      setTipoMensaje('error');
      return;
    }

    try {
      await api.post(`/revisor/solicitudes/${idSolicitud}/observar`, {
        descripcion: observacion.trim(),
        tipo_observacion: tipoObservacion,
        responsable: responsableActual()
      });

      setMensaje('La observación fue registrada. El expediente quedó como OBSERVADO.');
      setTipoMensaje('success');

      setObservacion('');
      setTipoObservacion('DOCUMENTOS');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo registrar la observación.');
      setTipoMensaje('error');
    }
  }

  async function rechazarSolicitud() {
    if (!motivoRechazo.trim()) {
      setMensaje('Debe indicar el motivo del rechazo.');
      setTipoMensaje('error');
      return;
    }

    const confirmar = window.confirm(
      '¿Seguro que deseas rechazar este expediente? Esta acción cambiará el estado a RECHAZADO.'
    );

    if (!confirmar) return;

    try {
      await api.post(`/revisor/solicitudes/${idSolicitud}/rechazar`, {
        descripcion: motivoRechazo.trim(),
        responsable: responsableActual()
      });

      setMensaje('El expediente fue rechazado correctamente.');
      setTipoMensaje('success');

      setMotivoRechazo('');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo rechazar el expediente.');
      setTipoMensaje('error');
    }
  }

  function abrirDocumento(documento) {
    setDocumentoSeleccionado(documento);
  }

  function abrirDocumentoNuevaPestana(documento) {
    if (!documento) return;

    window.open(
      `http://localhost:3001/api/revisor/documentos/${documento.id_documento}/ver`,
      '_blank'
    );
  }

  if (cargando) {
    return (
      <RevisorLayout>
        <div className="revisor-loading-card">
          <h2>Cargando expediente...</h2>
          <p>Recuperando información desde la base de datos.</p>
        </div>
      </RevisorLayout>
    );
  }

  if (!solicitud) {
    return (
      <RevisorLayout>
        <div className="revisor-loading-card">
          <h2>No se encontró el expediente</h2>
          <p>{mensaje || 'Verifique que la solicitud exista.'}</p>

          <Link to="/revisor/bandeja" className="revisor-primary-button">
            Volver a la bandeja
          </Link>
        </div>
      </RevisorLayout>
    );
  }

  return (
    <RevisorLayout>
      <section className="exp-review-page">
        <div className="exp-review-left">
          <section className="exp-summary-card">
            <div>
              <Link to="/revisor/bandeja" className="review-back-link">
                ← Volver a bandeja
              </Link>

              <span>Código expediente</span>
              <strong>{solicitud.codigo_solicitud}</strong>
              <p>{solicitud.tramite}</p>
            </div>

            <div className="exp-current-status">
              <span>Estado actual</span>

              <strong className={`review-status ${claseEstado(solicitud.estado)}`}>
                {limpiarEstado(solicitud.estado)}
              </strong>
            </div>
          </section>

          <section className="review-flow-card">
            <h2>Flujo del expediente</h2>

            <div className="review-flow-steps reviewer-flow">
              <div className={solicitud.estado === 'REGISTRADO' ? 'active' : ''}>
                <span>1</span>
                <strong>Registrado</strong>
                <small>El usuario envió el trámite.</small>
              </div>

              <div className={solicitud.estado === 'EN_REVISION' ? 'active' : ''}>
                <span>2</span>
                <strong>En revisión</strong>
                <small>El revisor analiza documentos y voucher.</small>
              </div>

              <div className={solicitud.estado === 'OBSERVADO' ? 'active observed' : ''}>
                <span>3</span>
                <strong>Observado</strong>
                <small>El usuario debe corregir.</small>
              </div>

              <div className={solicitud.estado === 'DERIVADO' ? 'active derived' : ''}>
                <span>4</span>
                <strong>Derivado</strong>
                <small>El expediente pasa al área correspondiente.</small>
              </div>

              <div className={solicitud.estado === 'FINALIZADO' ? 'active finalized' : ''}>
                <span>5</span>
                <strong>Finalizado</strong>
                <small>El área responsable terminó el proceso.</small>
              </div>
            </div>
          </section>

          {mensaje && (
            <div
              className={
                tipoMensaje === 'success'
                  ? 'review-message success'
                  : 'review-message error'
              }
            >
              {mensaje}
            </div>
          )}

          <section className="exp-applicant-card">
            <h2>Datos del solicitante</h2>

            <div className="exp-applicant-grid">
              <div>
                <span>Nombre completo</span>
                <strong>
                  {solicitud.apellidos}, {solicitud.nombres}
                </strong>
              </div>

              <div>
                <span>DNI / CE</span>
                <strong>{solicitud.dni}</strong>
              </div>

              <div>
                <span>Correo electrónico</span>
                <strong className="exp-email">{solicitud.correo}</strong>
              </div>

              <div>
                <span>Categoría</span>
                <strong>{solicitud.categoria}</strong>
              </div>

              <div>
                <span>Código TUPA</span>
                <strong>
                  {solicitud.codigo_publico_tramite || solicitud.codigo_tramite}
                </strong>
              </div>

              <div>
                <span>Plazo TUPA</span>
                <strong>
                  {solicitud.plazo_dias} {solicitud.tipo_plazo}
                </strong>
              </div>
            </div>
          </section>

          <section className="exp-documents-card">
            <header>
              <h2>Documentos y voucher</h2>

              {documentoSeleccionado && (
                <button
                  type="button"
                  onClick={() => abrirDocumentoNuevaPestana(documentoSeleccionado)}
                >
                  Abrir archivo real
                </button>
              )}
            </header>

            <div className="exp-documents-body">
              <aside className="exp-documents-list">
                {documentos.length === 0 && (
                  <p className="empty-text">No hay documentos registrados.</p>
                )}

                {documentosRequeridos.map((documento, index) => (
                  <button
                    key={documento.id_documento}
                    type="button"
                    className={
                      documentoSeleccionado?.id_documento === documento.id_documento
                        ? 'active'
                        : ''
                    }
                    onClick={() => abrirDocumento(documento)}
                  >
                    <span>Documento {String(index + 1).padStart(2, '0')}</span>
                    <strong>{documento.nombre_original}</strong>
                    <small>Requisito adjunto</small>
                  </button>
                ))}

                {voucher && (
                  <button
                    type="button"
                    className={
                      documentoSeleccionado?.id_documento === voucher.id_documento
                        ? 'active voucher'
                        : 'voucher'
                    }
                    onClick={() => abrirDocumento(voucher)}
                  >
                    <span>Voucher</span>
                    <strong>{voucher.nombre_original}</strong>
                    <small>Comprobante de pago</small>
                  </button>
                )}
              </aside>

              <div className="exp-document-preview">
                {documentoSeleccionado ? (
                  <>
                    <div className="exp-preview-sheet">
                      <div className="sheet-line big"></div>
                      <div className="sheet-line"></div>
                      <div className="sheet-line"></div>
                      <div className="sheet-stamp">UNSAAC</div>
                      <div className="sheet-line short"></div>
                      <div className="sheet-line"></div>
                    </div>

                    <div className="exp-preview-toolbar">
                      <span>{documentoSeleccionado.nombre_original}</span>

                      <button
                        type="button"
                        onClick={() => abrirDocumentoNuevaPestana(documentoSeleccionado)}
                      >
                        Ver real
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="exp-preview-empty">
                    Seleccione un documento para revisarlo.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="exp-review-right">
          <div className="exp-right-tabs">
            <button
              type="button"
              className={pestanaDerecha === 'REVISION' ? 'active' : ''}
              onClick={() => setPestanaDerecha('REVISION')}
            >
              Revisión
            </button>

            <button
              type="button"
              className={pestanaDerecha === 'CONSULTA' ? 'active' : ''}
              onClick={() => setPestanaDerecha('CONSULTA')}
            >
              Consulta
            </button>
          </div>

          {pestanaDerecha === 'REVISION' && (
            <div className="exp-right-content">
              <section className="review-logic-box">
                <h3>Rol del revisor</h3>
                <p>
                  El revisor verifica datos, documentos y voucher. No aprueba ni
                  finaliza el trámite. Si corresponde continuar, debe derivar el
                  expediente al área responsable.
                </p>
              </section>

              <h3>Validación de pago</h3>

              <div className="exp-payment-mini">
                <div>
                  <span>Código pago</span>
                  <strong>{solicitud.codigo_pago || '-'}</strong>
                </div>

                <div>
                  <span>Clave voucher</span>
                  <strong>{solicitud.clave_voucher || '-'}</strong>
                </div>

                <div>
                  <span>Método</span>
                  <strong>{solicitud.metodo_pago || '-'}</strong>
                </div>

                <div>
                  <span>Monto</span>
                  <strong>S/ {Number(solicitud.costo_total || 0).toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="exp-take-review"
                onClick={tomarEnRevision}
              >
                Tomar expediente en revisión
              </button>

              <h3>Observar expediente</h3>

              <select
                className="exp-action-select"
                value={tipoObservacion}
                onChange={(e) => setTipoObservacion(e.target.value)}
              >
                <option value="DOCUMENTOS">Documentos incompletos o ilegibles</option>
                <option value="PAGO">Problema con voucher o pago</option>
                <option value="DATOS">Datos del solicitante incorrectos</option>
                <option value="REQUISITOS">Requisitos no cumplen el TUPA</option>
              </select>

              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Explique qué debe corregir el usuario..."
              />

              <button
                type="button"
                className="exp-observe-button"
                onClick={enviarObservacion}
              >
                Registrar observación
              </button>

              <h3>Rechazar expediente</h3>

              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Motivo del rechazo definitivo..."
              />

              <button
                type="button"
                className="exp-reject-button"
                onClick={rechazarSolicitud}
              >
                Rechazar expediente
              </button>

              <h3>Derivar expediente</h3>

              <p className="exp-action-note">
                Si el expediente debe continuar, la derivación se realiza en una
                pantalla separada para revisar el resumen, los documentos y
                seleccionar la dependencia de destino de manera ordenada.
              </p>

              <Link
                to={`/revisor/solicitudes/${idSolicitud}/derivar`}
                className="exp-derive-link-button"
              >
                Ir a derivación del expediente
              </Link>
            </div>
          )}

          {pestanaDerecha === 'CONSULTA' && (
            <div className="exp-right-content">
              <h3>Reporte de historial del trámite</h3>

              <div className="exp-consulta-help">
                Esta sección muestra el recorrido administrativo del expediente:
                cambios de estado, observaciones, derivaciones y acciones realizadas
                durante el proceso del trámite.
              </div>

              <h3>Historial del expediente</h3>

              <div className="exp-consult-list">
                {historial.length === 0 && (
                  <p>No hay historial registrado para este expediente.</p>
                )}

                {historial.map((item) => (
                  <article key={item.codigo_historial}>
                    <strong>{limpiarEstado(item.estado)}</strong>
                    <p>{item.descripcion}</p>
                    <small>
                      Responsable: {item.responsable} ·{' '}
                      {formatearFecha(item.fecha_evento)}
                    </small>
                  </article>
                ))}
              </div>

              <h3>Observaciones registradas</h3>

              <div className="exp-consult-list">
                {observaciones.length === 0 && (
                  <p>No hay observaciones registradas.</p>
                )}

                {observaciones.map((item) => (
                  <article key={item.codigo_observacion}>
                    <strong>
                      {item.codigo_observacion} · {item.tipo_observacion}
                    </strong>

                    <p>{item.descripcion}</p>

                    <small>
                      Estado: {item.estado} · Responsable: {item.responsable} ·{' '}
                      {formatearFecha(item.fecha_observacion)}
                    </small>
                  </article>
                ))}
              </div>

              <h3>Derivaciones realizadas</h3>

              <div className="exp-consult-list">
                {derivaciones.length === 0 && (
                  <p>No hay derivaciones registradas.</p>
                )}

                {derivaciones.map((item) => (
                  <article key={item.codigo_derivacion}>
                    <strong>
                      {item.codigo_derivacion} · {item.oficina_destino}
                    </strong>

                    <p>{item.motivo}</p>

                    <small>
                      Responsable: {item.responsable} ·{' '}
                      {formatearFecha(item.fecha_derivacion)}
                    </small>
                  </article>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </RevisorLayout>
  );
}

export default RevisorExpedienteDetalle;