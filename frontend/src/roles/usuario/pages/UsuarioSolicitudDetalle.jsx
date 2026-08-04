import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioSolicitudDetalle() {
  const { idSolicitud } = useParams();

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarDetalle() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get(`/solicitudes/${idSolicitud}`);
      setDetalle(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar el detalle de la solicitud.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDetalle();
  }, [idSolicitud]);

  function descargarConstancia() {
    window.open(`http://localhost:3001/api/solicitudes/${idSolicitud}/constancia`, '_blank');
  }

  function claseEstado(estado) {
    if (estado === 'FINALIZADO' || estado === 'APROBADO') return 'done';
    if (estado === 'OBSERVADO' || estado === 'RECHAZADO') return 'observed';
    return 'process';
  }

  if (cargando) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>Cargando detalle...</h3>
        </div>
      </UsuarioLayout>
    );
  }

  if (mensaje || !detalle) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>{mensaje || 'Solicitud no encontrada.'}</h3>
          <Link to="/usuario/solicitudes" className="btn-primary">
            Volver a mis solicitudes
          </Link>
        </div>
      </UsuarioLayout>
    );
  }

  const { solicitud, documentos, historial } = detalle;

  return (
    <UsuarioLayout>
      <section className="page-heading">
        <div>
          <h1>Detalle de Solicitud</h1>
          <p>
            Revisa el historial completo, documentos enviados y datos del pago.
          </p>
        </div>

        <div className="heading-actions">
          <Link to="/usuario/solicitudes" className="btn-secondary">
            ← Volver
          </Link>

          <button type="button" className="btn-primary" onClick={descargarConstancia}>
            Descargar constancia
          </button>
        </div>
      </section>

      <section className="detail-request-grid">
        <article className="detail-request-main">
          <div className="detail-request-header">
            <div>
              <span className="procedure-badge">{solicitud.codigo_solicitud}</span>
              <h2>{solicitud.tramite}</h2>
              <p>{solicitud.descripcion_tramite}</p>
            </div>

            <span className={`status ${claseEstado(solicitud.estado)}`}>
              {solicitud.estado}
            </span>
          </div>

          <div className="detail-info-grid">
            <div>
              <small>Código usuario</small>
              <strong>{solicitud.codigo_usuario}</strong>
            </div>

            <div>
              <small>Código trámite</small>
              <strong>{solicitud.codigo_publico_tramite}</strong>
            </div>

            <div>
              <small>Fecha de envío</small>
              <strong>{new Date(solicitud.fecha_envio).toLocaleString('es-PE')}</strong>
            </div>

            <div>
              <small>Plazo estimado</small>
              <strong>{solicitud.plazo_dias} {solicitud.tipo_plazo}</strong>
            </div>
          </div>

          <div className="timeline-panel">
            <h3>Historial del proceso</h3>

            {historial.map((evento, index) => (
              <div className="timeline-item done" key={evento.codigo_historial}>
                <span>{index + 1}</span>

                <div>
                  <strong>{evento.estado}</strong>
                  <p>{evento.descripcion}</p>
                  <small>
                    {evento.responsable} · {new Date(evento.fecha_evento).toLocaleString('es-PE')}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="detail-request-side">
          <article>
            <h3>Datos del pago</h3>
            <p><strong>Código:</strong> {solicitud.codigo_pago}</p>
            <p><strong>Método:</strong> {solicitud.metodo_pago}</p>
            <p><strong>Voucher:</strong> {solicitud.clave_voucher}</p>
            <p><strong>Monto:</strong> S/ {Number(solicitud.costo_total).toFixed(2)}</p>
          </article>

          <article>
            <h3>Solicitante</h3>
            <p><strong>Nombre:</strong> {solicitud.nombres} {solicitud.apellidos}</p>
            <p><strong>DNI:</strong> {solicitud.dni}</p>
            <p><strong>Correo:</strong> {solicitud.correo}</p>
          </article>

          <article>
            <h3>Documentos enviados</h3>

            {documentos.length === 0 && (
              <p>No hay documentos registrados.</p>
            )}

            {documentos.map((documento) => (
              <div className="document-mini-card" key={documento.codigo_documento}>
                <strong>{documento.nombre_original}</strong>
                <span>{documento.codigo_documento}</span>
                <small>{documento.tipo_documento}</small>
              </div>
            ))}
          </article>
        </aside>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioSolicitudDetalle;