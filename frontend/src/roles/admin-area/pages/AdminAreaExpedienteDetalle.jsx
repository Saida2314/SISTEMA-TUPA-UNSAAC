import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AdminAreaLayout from '../components/AdminAreaLayout';
import api from '../../../services/api';

function AdminAreaExpedienteDetalle() {
  const { idSolicitud } = useParams();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [solicitud, setSolicitud] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [archivosArea, setArchivosArea] = useState([]);
  const [mensajesArea, setMensajesArea] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [observaciones, setObservaciones] = useState([]);
  const [derivaciones, setDerivaciones] = useState([]);

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  const [archivoArea, setArchivoArea] = useState(null);
  const [descripcionArchivo, setDescripcionArchivo] = useState('');

  const [mensajeRecojo, setMensajeRecojo] = useState(
    'Su trámite fue aceptado. Puede acercarse a la oficina correspondiente para el recojo presencial del documento, portando su DNI y constancia de solicitud.'
  );

  const [descripcionFinalizacion, setDescripcionFinalizacion] = useState(
    'El expediente fue validado por el Admin de Área. Se acepta el trámite y se registra como finalizado.'
  );

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  const [pestanaDerecha, setPestanaDerecha] = useState('ACCIONES');

  async function cargarDetalle() {
    try {
      setCargando(true);
      setMensaje('');
      setTipoMensaje('');

      const response = await api.get(`/admin-area/solicitudes/${idSolicitud}`);

      const documentosBD = response.data.documentos || [];

      setSolicitud(response.data.solicitud);
      setDocumentos(documentosBD);
      setArchivosArea(response.data.archivosArea || []);
      setMensajesArea(response.data.mensajesArea || []);
      setHistorial(response.data.historial || []);
      setObservaciones(response.data.observaciones || []);
      setDerivaciones(response.data.derivaciones || []);
      setDocumentoSeleccionado(documentosBD[0] || null);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo cargar el expediente derivado.');
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

  function responsableActual() {
    const nombres = usuario?.nombres || 'Admin';
    const apellidos = usuario?.apellidos || 'Área';

    return `${nombres} ${apellidos}`.trim();
  }

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  function claseEstado(estado) {
    if (estado === 'DERIVADO') return 'derived';
    if (estado === 'EN_VALIDACION_AREA') return 'review';
    if (estado === 'FINALIZADO') return 'done';
    if (estado === 'RECHAZADO') return 'rejected';

    return 'neutral';
  }

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

  function abrirDocumentoNuevaPestana(documento) {
    if (!documento) return;

    window.open(
      `http://localhost:3001/api/admin-area/documentos/${documento.id_documento}/ver`,
      '_blank'
    );
  }

  function abrirArchivoArea(archivo) {
    if (!archivo) return;

    window.open(
      `http://localhost:3001/api/admin-area/archivos/${archivo.id_archivo_area}/ver`,
      '_blank'
    );
  }

  async function tomarEnValidacion() {
    const confirmar = window.confirm(
      '¿Deseas tomar este expediente en validación de área?'
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      await api.put(`/admin-area/solicitudes/${idSolicitud}/tomar-validacion`, {
        responsable: responsableActual()
      });

      setMensaje('El expediente fue tomado en validación de área.');
      setTipoMensaje('success');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo tomar en validación.');
      setTipoMensaje('error');
    } finally {
      setProcesando(false);
    }
  }

  async function subirArchivoRespuesta(e) {
    e.preventDefault();

    if (!archivoArea) {
      setMensaje('Debe seleccionar un archivo PDF, JPG o PNG.');
      setTipoMensaje('error');
      return;
    }

    try {
      setProcesando(true);

      const formData = new FormData();
      formData.append('archivo', archivoArea);
      formData.append('descripcion', descripcionArchivo || 'Archivo de respuesta del Admin de Área.');
      formData.append('responsable', responsableActual());

      await api.post(`/admin-area/solicitudes/${idSolicitud}/archivos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMensaje('Archivo de respuesta subido correctamente.');
      setTipoMensaje('success');
      setArchivoArea(null);
      setDescripcionArchivo('');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo subir el archivo.');
      setTipoMensaje('error');
    } finally {
      setProcesando(false);
    }
  }

  async function enviarMensajeRecojo() {
    if (!mensajeRecojo.trim()) {
      setMensaje('Debe escribir el mensaje de recojo presencial.');
      setTipoMensaje('error');
      return;
    }

    try {
      setProcesando(true);

      await api.post(`/admin-area/solicitudes/${idSolicitud}/mensaje-recojo`, {
        mensaje: mensajeRecojo.trim(),
        responsable: responsableActual()
      });

      setMensaje('Mensaje de recojo presencial registrado correctamente.');
      setTipoMensaje('success');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo registrar el mensaje.');
      setTipoMensaje('error');
    } finally {
      setProcesando(false);
    }
  }

  async function finalizarTramite() {
    if (!descripcionFinalizacion.trim()) {
      setMensaje('Debe escribir la descripción de aceptación del trámite.');
      setTipoMensaje('error');
      return;
    }

    const confirmar = window.confirm(
      '¿Confirmas aceptar y finalizar este trámite?'
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      await api.post(`/admin-area/solicitudes/${idSolicitud}/finalizar`, {
        descripcion: descripcionFinalizacion.trim(),
        responsable: responsableActual()
      });

      setMensaje('El trámite fue aceptado y finalizado correctamente.');
      setTipoMensaje('success');

      await cargarDetalle();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo finalizar el trámite.');
      setTipoMensaje('error');
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <AdminAreaLayout>
        <div className="admin-area-card">
          Cargando expediente derivado...
        </div>
      </AdminAreaLayout>
    );
  }

  if (!solicitud) {
    return (
      <AdminAreaLayout>
        <div className="admin-area-card">
          <h2>No se encontró el expediente</h2>
          <p>{mensaje || 'Verifique que la solicitud exista.'}</p>

          <Link to="/admin-area/solicitudes" className="admin-area-primary-button">
            Volver a derivaciones
          </Link>
        </div>
      </AdminAreaLayout>
    );
  }

  return (
    <AdminAreaLayout>
      <section className="admin-area-exp-page">
        <header className="admin-area-exp-header">
          <div>
            <Link to="/admin-area/solicitudes" className="admin-area-back-link">
              ← Volver a derivaciones
            </Link>

            <span>Expediente derivado</span>
            <h1>{solicitud.codigo_solicitud}</h1>
            <p>{solicitud.tramite}</p>
          </div>

          <div className="admin-area-current-status">
            <span>Estado actual</span>
            <strong className={`admin-area-status ${claseEstado(solicitud.estado)}`}>
              {limpiarEstado(solicitud.estado)}
            </strong>
          </div>
        </header>

        {mensaje && (
          <div className={`admin-area-message ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        <div className="admin-area-exp-layout">
          <main className="admin-area-exp-left">
            <section className="admin-area-exp-summary">
              <div className="admin-area-exp-summary-title">
                <h2>Resumen de solicitud</h2>
                <span>{limpiarEstado(solicitud.estado)}</span>
              </div>

              <div className="admin-area-exp-grid">
                <div>
                  <small>Solicitante</small>
                  <strong>{solicitud.apellidos}, {solicitud.nombres}</strong>
                  <p>DNI: {solicitud.dni || '-'}</p>
                </div>

                <div>
                  <small>Tipo de procedimiento</small>
                  <strong>{solicitud.tramite}</strong>
                  <p>Código: {solicitud.codigo_publico_tramite || solicitud.codigo_tramite}</p>
                </div>

                <div>
                  <small>Correo institucional</small>
                  <strong>{solicitud.correo}</strong>
                  <p>Categoría: {solicitud.categoria}</p>
                </div>

                <div>
                  <small>Plazo TUPA</small>
                  <strong>{solicitud.plazo_dias} {solicitud.tipo_plazo}</strong>
                  <p>Monto: S/ {Number(solicitud.costo_total || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="admin-area-derivation-summary">
                <small>Derivación recibida</small>
                <strong>{solicitud.oficina_destino || 'Oficina no registrada'}</strong>
                <p>{solicitud.motivo_derivacion || 'Sin motivo de derivación registrado.'}</p>
                <span>
                  Derivado por {solicitud.responsable_derivacion || '-'} ·{' '}
                  {formatearFecha(solicitud.fecha_derivacion)}
                </span>
              </div>
            </section>

            <section className="admin-area-exp-documents">
              <div className="admin-area-exp-documents-header">
                <h2>Previsualización de documentos</h2>

                {documentoSeleccionado && (
                  <button
                    type="button"
                    onClick={() => abrirDocumentoNuevaPestana(documentoSeleccionado)}
                  >
                    Abrir archivo real
                  </button>
                )}
              </div>

              <div className="admin-area-exp-documents-body">
                <aside>
                  {documentosRequeridos.map((documento, index) => (
                    <button
                      key={documento.id_documento}
                      type="button"
                      className={
                        documentoSeleccionado?.id_documento === documento.id_documento
                          ? 'active'
                          : ''
                      }
                      onClick={() => setDocumentoSeleccionado(documento)}
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
                      onClick={() => setDocumentoSeleccionado(voucher)}
                    >
                      <span>Voucher</span>
                      <strong>{voucher.nombre_original}</strong>
                      <small>Comprobante de pago</small>
                    </button>
                  )}

                  {documentos.length === 0 && (
                    <p>No hay documentos registrados.</p>
                  )}
                </aside>

                <div className="admin-area-exp-preview">
                  {documentoSeleccionado ? (
                    <>
                      <div className="admin-area-exp-paper">
                        <div className="paper-line big"></div>
                        <div className="paper-line"></div>
                        <div className="paper-line"></div>
                        <div className="paper-seal-area">UNSAAC</div>
                        <div className="paper-line short"></div>
                        <div className="paper-line"></div>
                      </div>

                      <div className="admin-area-exp-preview-footer">
                        <strong>{documentoSeleccionado.nombre_original}</strong>

                        <button
                          type="button"
                          onClick={() => abrirDocumentoNuevaPestana(documentoSeleccionado)}
                        >
                          Ver real
                        </button>
                      </div>
                    </>
                  ) : (
                    <p>Seleccione un documento para revisarlo.</p>
                  )}
                </div>
              </div>
            </section>
          </main>

          <aside className="admin-area-exp-right">
            <div className="admin-area-exp-tabs">
              <button
                type="button"
                className={pestanaDerecha === 'ACCIONES' ? 'active' : ''}
                onClick={() => setPestanaDerecha('ACCIONES')}
              >
                Acciones
              </button>

              <button
                type="button"
                className={pestanaDerecha === 'HISTORIAL' ? 'active' : ''}
                onClick={() => setPestanaDerecha('HISTORIAL')}
              >
                Historial
              </button>
            </div>

            {pestanaDerecha === 'ACCIONES' && (
              <div className="admin-area-exp-actions">
                <section className="admin-area-role-box">
                  <h3>Rol del Admin de Área</h3>
                  <p>
                    Verifica los archivos recibidos, adjunta documentos de respuesta
                    si corresponde, registra mensaje de recojo presencial y finaliza el trámite.
                  </p>
                </section>

                <button
                  type="button"
                  className="admin-area-primary-action"
                  onClick={tomarEnValidacion}
                  disabled={procesando || solicitud.estado !== 'DERIVADO'}
                >
                  Tomar en validación
                </button>

                <h3>Archivos del expediente</h3>

                <div className="admin-area-side-file-list">
                  {documentos.map((documento) => (
                    <button
                      key={documento.id_documento}
                      type="button"
                      onClick={() => abrirDocumentoNuevaPestana(documento)}
                    >
                      Ver {documento.nombre_original}
                    </button>
                  ))}
                </div>

                <h3>Subir archivo de respuesta</h3>

                <form onSubmit={subirArchivoRespuesta}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setArchivoArea(e.target.files[0] || null)}
                    disabled={solicitud.estado === 'FINALIZADO'}
                  />

                  <textarea
                    value={descripcionArchivo}
                    onChange={(e) => setDescripcionArchivo(e.target.value)}
                    placeholder="Descripción del archivo adjunto..."
                    disabled={solicitud.estado === 'FINALIZADO'}
                  />

                  <button
                    type="submit"
                    className="admin-area-upload-button"
                    disabled={procesando || solicitud.estado === 'FINALIZADO'}
                  >
                    Subir archivo
                  </button>
                </form>

                <div className="admin-area-area-files">
                  {archivosArea.length > 0 && <strong>Archivos subidos por el área</strong>}

                  {archivosArea.map((archivo) => (
                    <button
                      key={archivo.id_archivo_area}
                      type="button"
                      onClick={() => abrirArchivoArea(archivo)}
                    >
                      {archivo.nombre_original}
                    </button>
                  ))}
                </div>

                <h3>Mensaje de recojo presencial</h3>

                <textarea
                  value={mensajeRecojo}
                  onChange={(e) => setMensajeRecojo(e.target.value)}
                  disabled={solicitud.estado === 'RECHAZADO'}
                />

                <button
                  type="button"
                  className="admin-area-message-button"
                  onClick={enviarMensajeRecojo}
                  disabled={procesando || solicitud.estado === 'RECHAZADO'}
                >
                  Registrar mensaje de recojo
                </button>

                <h3>Aceptar trámite</h3>

                <textarea
                  value={descripcionFinalizacion}
                  onChange={(e) => setDescripcionFinalizacion(e.target.value)}
                  disabled={solicitud.estado === 'FINALIZADO'}
                />

                <button
                  type="button"
                  className="admin-area-finish-button"
                  onClick={finalizarTramite}
                  disabled={
                    procesando ||
                    solicitud.estado === 'FINALIZADO' ||
                    solicitud.estado === 'RECHAZADO'
                  }
                >
                  {procesando ? 'Procesando...' : 'Aceptar trámite y finalizar'}
                </button>
              </div>
            )}

            {pestanaDerecha === 'HISTORIAL' && (
              <div className="admin-area-exp-actions">
                <h3>Mensajes de recojo</h3>

                <div className="admin-area-history-list">
                  {mensajesArea.length === 0 && (
                    <p>No hay mensajes de recojo registrados.</p>
                  )}

                  {mensajesArea.map((item) => (
                    <article key={item.codigo_mensaje}>
                      <strong>{item.tipo_mensaje}</strong>
                      <p>{item.mensaje}</p>
                      <small>
                        {item.responsable} · {formatearFecha(item.fecha_mensaje)}
                      </small>
                    </article>
                  ))}
                </div>

                <h3>Historial del expediente</h3>

                <div className="admin-area-history-list">
                  {historial.length === 0 && (
                    <p>No hay historial registrado.</p>
                  )}

                  {historial.map((item) => (
                    <article key={item.codigo_historial}>
                      <strong>{limpiarEstado(item.estado)}</strong>
                      <p>{item.descripcion}</p>
                      <small>
                        {item.responsable} · {formatearFecha(item.fecha_evento)}
                      </small>
                    </article>
                  ))}
                </div>

                <h3>Observaciones previas</h3>

                <div className="admin-area-history-list">
                  {observaciones.length === 0 && (
                    <p>No hay observaciones previas.</p>
                  )}

                  {observaciones.map((item) => (
                    <article key={item.codigo_observacion}>
                      <strong>{item.codigo_observacion} · {item.tipo_observacion}</strong>
                      <p>{item.descripcion}</p>
                      <small>
                        {item.responsable} · {formatearFecha(item.fecha_observacion)}
                      </small>
                    </article>
                  ))}
                </div>

                <h3>Derivaciones</h3>

                <div className="admin-area-history-list">
                  {derivaciones.length === 0 && (
                    <p>No hay derivaciones.</p>
                  )}

                  {derivaciones.map((item) => (
                    <article key={item.codigo_derivacion}>
                      <strong>{item.codigo_derivacion}</strong>
                      <p>{item.motivo}</p>
                      <small>
                        {item.oficina_destino} · {formatearFecha(item.fecha_derivacion)}
                      </small>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </AdminAreaLayout>
  );
}

export default AdminAreaExpedienteDetalle;