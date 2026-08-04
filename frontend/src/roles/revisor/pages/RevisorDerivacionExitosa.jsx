import { Link, useLocation } from 'react-router-dom';
import RevisorLayout from '../components/RevisorLayout';

function RevisorDerivacionExitosa() {
  const location = useLocation();

  const datos = location.state || {};

  return (
    <RevisorLayout>
      <section className="review-success-page">
        <article className="review-success-card">
          <div className="success-mark">OK</div>

          <h1>Derivación Exitosa</h1>

          <p>
            El expediente fue derivado correctamente. Esta pantalla solo aparece
            después de confirmar la acción de derivación desde el análisis del expediente.
          </p>

          <div className="success-info-grid">
            <div>
              <span>Expediente</span>
              <strong>{datos.codigoSolicitud || '-'}</strong>
            </div>

            <div>
              <span>Código de derivación</span>
              <strong>{datos.codigoDerivacion || '-'}</strong>
            </div>

            <div>
              <span>Oficina destino</span>
              <strong>{datos.oficinaDestino || '-'}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{datos.estado || 'DERIVADO'}</strong>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/revisor/bandeja" className="revisor-primary-button">
              Volver a la bandeja
            </Link>

            <Link to="/revisor" className="revisor-outline-button">
              Ir al inicio
            </Link>
          </div>
        </article>
      </section>
    </RevisorLayout>
  );
}

export default RevisorDerivacionExitosa;