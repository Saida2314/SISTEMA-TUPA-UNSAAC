import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTramiteConfirmacion() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const idSolicitud = searchParams.get('idSolicitud');

  const [tramite, setTramite] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState('');

  async function cargarDatos() {
    try {
      const tramiteResponse = await api.get(`/public/tramites/${id}`);
      setTramite(tramiteResponse.data);

      if (idSolicitud) {
        const detalleResponse = await api.get(`/solicitudes/${idSolicitud}`);
        setDetalle(detalleResponse.data);
      }
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar el resumen de la solicitud.');
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [id, idSolicitud]);

  function descargarConstancia() {
    if (!idSolicitud) {
      alert('No se encontró el número de solicitud.');
      return;
    }

    window.open(`http://localhost:3001/api/solicitudes/${idSolicitud}/constancia`, '_blank');
  }

  if (!tramite) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>Cargando confirmación...</h3>
        </div>
      </UsuarioLayout>
    );
  }

  const solicitud = detalle?.solicitud;
  const documentos = detalle?.documentos || [];
  const historial = detalle?.historial || [];

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

        <div className="active">
          <span>3</span>
          <strong>Confirmación</strong>
        </div>
      </div>

      <section className="confirmation-card wide-confirmation">
        <div className="confirmation-icon">✓</div>

        <h1>¡Solicitud enviada correctamente!</h1>

        <p>
          Tu solicitud para <strong>{tramite.nombre}</strong> fue registrada
          y pasará a revisión por el área correspondiente.
        </p>

        {mensaje && <p className="auth-error">{mensaje}</p>}

        <div className="confirmation-summary">
          <div>
            <small>Código de solicitud</small>
            <strong>{solicitud?.codigo_solicitud || 'Registrada'}</strong>
          </div>

          <div>
            <small>Estado actual</small>
            <strong>{solicitud?.estado || 'EN_REVISION'}</strong>
          </div>

          <div>
            <small>Costo total</small>
            <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
          </div>
        </div>

        {solicitud && (
          <div className="confirmation-data-grid">
            <article>
              <h3>Datos del pago</h3>
              <p><strong>Código:</strong> {solicitud.codigo_pago}</p>
              <p><strong>Método:</strong> {solicitud.metodo_pago}</p>
              <p><strong>Voucher:</strong> {solicitud.clave_voucher}</p>
              <p><strong>Monto:</strong> S/ {Number(solicitud.costo_total).toFixed(2)}</p>
            </article>

            <article>
              <h3>Datos del trámite</h3>
              <p><strong>Código:</strong> {solicitud.codigo_publico_tramite}</p>
              <p><strong>Categoría:</strong> {solicitud.categoria}</p>
              <p><strong>Plazo:</strong> {solicitud.plazo_dias} {solicitud.tipo_plazo}</p>
            </article>
          </div>
        )}

        <div className="uploaded-section">
          <h3>Documentos registrados</h3>

          {documentos.length === 0 && (
            <div className="uploaded-item">
              <span>No se cargó el detalle de documentos.</span>
            </div>
          )}

          {documentos.map((documento) => (
            <div className="uploaded-item" key={documento.codigo_documento}>
              <span>
                📄 {documento.nombre_original}
                <small> {documento.codigo_documento}</small>
              </span>
              <b>✓</b>
            </div>
          ))}
        </div>

        <div className="mini-timeline">
          <h3>Historial inicial</h3>

          {historial.map((evento) => (
            <div className="timeline-item done" key={evento.codigo_historial}>
              <span></span>
              <div>
                <strong>{evento.estado}</strong>
                <p>{evento.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="confirmation-actions">
          <Link to="/usuario" className="btn-secondary">
            ← Volver al inicio
          </Link>

          <Link to="/usuario/solicitudes" className="btn-secondary">
            Ver mis solicitudes
          </Link>

          <button type="button" className="btn-primary" onClick={descargarConstancia}>
            Descargar constancia
          </button>
        </div>

        <div className="info-note">
          Una copia de la constancia fue registrada como envío simulado al correo institucional.
          En una siguiente versión podrá enviarse automáticamente por correo real.
        </div>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioTramiteConfirmacion;