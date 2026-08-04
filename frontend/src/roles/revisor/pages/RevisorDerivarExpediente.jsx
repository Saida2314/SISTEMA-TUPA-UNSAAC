import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import RevisorLayout from '../components/RevisorLayout';
import api from '../../../services/api';

function RevisorDerivarExpediente() {
  const { idSolicitud } = useParams();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [solicitud, setSolicitud] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  const [oficinaDestino, setOficinaDestino] = useState('');
  const [motivoDerivacion, setMotivoDerivacion] = useState('');

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const oficinasDestino = [
    {
      grupo: 'Área académica',
      opciones: [
        'Dirección de Registro y Servicios Académicos',
        'Unidad de Grados y Títulos',
        'Facultad correspondiente',
        'Escuela Profesional correspondiente'
      ]
    },
    {
      grupo: 'Área administrativa',
      opciones: [
        'Dirección General de Administración - DIGA',
        'Unidad de Recursos Humanos',
        'Unidad de Tesorería',
        'Área de Abastecimientos',
        'Asesoría Jurídica'
      ]
    },
    {
      grupo: 'Área de apoyo institucional',
      opciones: [
        'Dirección de Bienestar Universitario',
        'Unidad de Trámite Documentario',
        'Oficina de Tecnologías de Información',
        'Unidad de Estadística',
        'Cooperación Técnica',
        'Ingeniería de Obras'
      ]
    }
  ];

  async function cargarExpediente() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get(`/revisor/solicitudes/${idSolicitud}`);

      const documentosBD = response.data.documentos || [];

      setSolicitud(response.data.solicitud);
      setDocumentos(documentosBD);
      setDocumentoSeleccionado(documentosBD[0] || null);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo cargar el expediente.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarExpediente();
  }, [idSolicitud]);

  const voucher = useMemo(() => {
    return documentos.find((doc) => doc.tipo_documento === 'voucher') || null;
  }, [documentos]);

  const documentosRequeridos = useMemo(() => {
    return documentos.filter((doc) => doc.tipo_documento !== 'voucher');
  }, [documentos]);

  function responsableActual() {
    const nombres = usuario?.nombres || 'Revisor';
    const apellidos = usuario?.apellidos || '';
    return `${nombres} ${apellidos}`.trim();
  }

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  function abrirDocumentoNuevaPestana(documento) {
    if (!documento) return;

    window.open(
      `http://localhost:3001/api/revisor/documentos/${documento.id_documento}/ver`,
      '_blank'
    );
  }

  async function confirmarDerivacion() {
    if (!oficinaDestino) {
      setMensaje('Debe seleccionar la dependencia de destino.');
      return;
    }

    if (!motivoDerivacion.trim()) {
      setMensaje('Debe escribir el motivo de derivación.');
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmas derivar el expediente a "${oficinaDestino}"?`
    );

    if (!confirmar) return;

    try {
      setProcesando(true);
      setMensaje('');

      const response = await api.post(`/revisor/solicitudes/${idSolicitud}/derivar`, {
        oficina_destino: oficinaDestino,
        motivo: motivoDerivacion.trim(),
        responsable: responsableActual()
      });

      navigate('/revisor/derivacion-exitosa', {
        state: {
          codigoSolicitud: solicitud.codigo_solicitud,
          codigoDerivacion: response.data.codigo_derivacion,
          oficinaDestino,
          estado: response.data.estado
        }
      });
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo derivar el expediente.');
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <RevisorLayout>
        <div className="derivation-loading">
          <h2>Cargando derivación...</h2>
          <p>Recuperando información del expediente.</p>
        </div>
      </RevisorLayout>
    );
  }

  if (!solicitud) {
    return (
      <RevisorLayout>
        <div className="derivation-loading">
          <h2>No se encontró el expediente</h2>
          <p>{mensaje || 'Verifique que la solicitud exista.'}</p>

          <Link to="/revisor/bandeja" className="revisor-primary-button">
            Volver a bandeja
          </Link>
        </div>
      </RevisorLayout>
    );
  }

  return (
    <RevisorLayout>
      <section className="derivation-page">
        <div className="derivation-breadcrumb">
          <Link to="/revisor/bandeja">Procedimientos</Link>
          <span>›</span>
          <Link to={`/revisor/solicitudes/${idSolicitud}`}>Expediente</Link>
          <span>›</span>
          <strong>Derivación de expediente</strong>
        </div>

        <header className="derivation-header">
          <div>
            <h1>Derivación de Expediente</h1>
            <p>
              Seleccione la dependencia que continuará el trámite. El revisor no finaliza
              el proceso; solo deriva el expediente al área correspondiente.
            </p>
          </div>

          <button
            type="button"
            className="derivation-print-button"
            onClick={() => window.print()}
          >
            Imprimir expediente
          </button>
        </header>

        {mensaje && (
          <div className="derivation-message">
            {mensaje}
          </div>
        )}

        <div className="derivation-layout">
          <main className="derivation-left">
            <section className="derivation-summary-card">
              <div className="derivation-card-title">
                <h2>Resumen de solicitud</h2>
                <span>{limpiarEstado(solicitud.estado)}</span>
              </div>

              <div className="derivation-summary-grid">
                <div>
                  <small>Solicitante</small>
                  <strong>{solicitud.nombres} {solicitud.apellidos}</strong>
                  <p>DNI: {solicitud.dni || '-'}</p>
                </div>

                <div>
                  <small>Tipo de procedimiento</small>
                  <strong>{solicitud.tramite}</strong>
                  <p>Código: {solicitud.codigo_publico_tramite || solicitud.codigo_tramite}</p>
                </div>

                <div>
                  <small>Código expediente</small>
                  <strong>{solicitud.codigo_solicitud}</strong>
                  <p>Categoría: {solicitud.categoria}</p>
                </div>

                <div>
                  <small>Plazo TUPA</small>
                  <strong>
                    {solicitud.plazo_dias} {solicitud.tipo_plazo}
                  </strong>
                  <p>Monto: S/ {Number(solicitud.costo_total || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="derivation-reason-box">
                <small>Motivo del trámite</small>
                <p>
                  Solicitud presentada por el usuario para continuar el procedimiento
                  administrativo correspondiente a <strong>{solicitud.tramite}</strong>.
                </p>
              </div>
            </section>

            <section className="derivation-documents-card">
              <div className="derivation-card-title">
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

              <div className="derivation-documents-layout">
                <aside className="derivation-documents-list">
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
                    <p>No hay documentos adjuntos.</p>
                  )}
                </aside>

                <div className="derivation-preview">
                  {documentoSeleccionado ? (
                    <>
                      <div className="derivation-preview-paper">
                        <div className="paper-row title"></div>
                        <div className="paper-row"></div>
                        <div className="paper-row"></div>
                        <div className="paper-seal">UNSAAC</div>
                        <div className="paper-row short"></div>
                        <div className="paper-row"></div>
                      </div>

                      <div className="derivation-preview-footer">
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

          <aside className="derivation-right">
            <section className="derivation-actions-card">
              <h2>Acciones de derivación</h2>

              <label>Dependencia de destino</label>

              <select
                value={oficinaDestino}
                onChange={(e) => setOficinaDestino(e.target.value)}
              >
                <option value="">Seleccione la oficina destino</option>

                {oficinasDestino.map((grupo) => (
                  <optgroup key={grupo.grupo} label={grupo.grupo}>
                    {grupo.opciones.map((oficina) => (
                      <option key={oficina} value={oficina}>
                        {oficina}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <small>
                La dependencia seleccionada será la responsable de continuar el proceso.
              </small>

              <label>Motivo de derivación</label>

              <textarea
                value={motivoDerivacion}
                onChange={(e) => setMotivoDerivacion(e.target.value)}
                placeholder="Ejemplo: Se deriva para validación académica, revisión de requisitos o emisión del documento correspondiente."
              />

              <button
                type="button"
                className="derivation-confirm-button"
                onClick={confirmarDerivacion}
                disabled={procesando}
              >
                {procesando ? 'Derivando...' : 'Confirmar derivación'}
              </button>

              <Link
                to={`/revisor/solicitudes/${idSolicitud}`}
                className="derivation-cancel-link"
              >
                Cancelar y volver al expediente
              </Link>
            </section>

            <section className="derivation-system-info">
              <strong>Información del sistema</strong>
              <p>
                Este trámite tiene un plazo máximo de atención de{' '}
                <b>{solicitud.plazo_dias} {solicitud.tipo_plazo}</b> según la
                información registrada en el TUPA.
              </p>
            </section>

            <section className="derivation-guide-card">
              <strong>Criterio de derivación</strong>

              <ul>
                <li>Académico: Registro, Grados y Títulos, Facultad o Escuela Profesional.</li>
                <li>Administrativo: DIGA, Recursos Humanos, Tesorería o Abastecimientos.</li>
                <li>Soporte institucional: Trámite Documentario, OTI, Bienestar o Estadística.</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </RevisorLayout>
  );
}

export default RevisorDerivarExpediente;