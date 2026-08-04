import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PublicNavbar from '../../layouts/PublicNavbar';
import api from '../../services/api';

function ProcedureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tramite, setTramite] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function cargarDetalle() {
      try {
        setCargando(true);
        setMensaje('');

        const response = await api.get(`/public/tramites/${id}`);
        setTramite(response.data);
      } catch (error) {
        console.error(error);
        setMensaje('No se pudo cargar el detalle del trámite.');
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [id]);

  function continuarTramite() {
    alert('Para realizar este trámite debe iniciar sesión con su cuenta institucional.');
    navigate('/login');
  }

  if (cargando) {
    return (
      <div className="public-page">
        <PublicNavbar />
        <main className="procedure-detail-page">
          <p>Cargando detalle del trámite...</p>
        </main>
      </div>
    );
  }

  if (mensaje || !tramite) {
    return (
      <div className="public-page">
        <PublicNavbar />
        <main className="procedure-detail-page">
          <p className="catalog-message">{mensaje || 'Trámite no encontrado.'}</p>
          <Link to="/tramites" className="back-catalog-link">
            ← Volver al catálogo
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="procedure-detail-page">
        <section className="procedure-steps">
          <div className="procedure-step active">
            <span>1</span>
            <strong>Información</strong>
          </div>

          <div className="procedure-step-line"></div>

          <div className="procedure-step">
            <span>2</span>
            <strong>Solicitud y Documentos</strong>
          </div>

          <div className="procedure-step-line"></div>

          <div className="procedure-step">
            <span>3</span>
            <strong>Confirmación</strong>
          </div>
        </section>

        <section className="procedure-detail-grid">
          <aside className="procedure-info-card">
            <div className="procedure-card-top-line"></div>

            <div className="procedure-title-row">
              <div className="procedure-file-icon">▤</div>

              <div>
                <span className={`pill ${tramite.categoria.toLowerCase()}`}>
                  {tramite.categoria}
                </span>

                <h1>{tramite.nombre}</h1>
              </div>
            </div>

            <p className="procedure-description">
              {tramite.descripcion}
            </p>

            <div className="procedure-separator"></div>

            <h3>Información del procedimiento</h3>

            <ul className="requirement-list">
              <li>
                <span>✓</span>
                Código del trámite: <strong>{tramite.codigo}</strong>
              </li>

              <li>
                <span>✓</span>
                Modalidad de entrega: <strong>{tramite.tipo_entrega}</strong>
              </li>

              <li>
                <span>✓</span>
                El trámite será revisado por el área correspondiente.
              </li>

              <li>
                <span>✓</span>
                Los documentos deberán presentarse en formato PDF cuando se inicie la solicitud.
              </li>
            </ul>

            <div className="procedure-cost-box">
              <div>
                <span>COSTO TOTAL</span>
                <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
              </div>

              <div>
                <span>DURACIÓN</span>
                <strong>{tramite.plazo_dias} {tramite.tipo_plazo}</strong>
              </div>
            </div>

            <div className="procedure-help-box">
              <strong>¿Necesitas ayuda?</strong>
              <p>
                Ingresa a la sección de ayuda o comunícate con el área administrativa
                antes de iniciar el proceso de trámite.
              </p>
            </div>
          </aside>

          <section className="procedure-start-card">
            <div className="procedure-start-header">
              <h2>Iniciar Solicitud</h2>
            </div>

            <div className="procedure-start-body">
              <div className="procedure-box-icon">▣</div>

              <h3>Preparación de Expediente</h3>

              <p>
                Antes de continuar, asegúrese de contar con la información básica
                del trámite y los documentos solicitados por el procedimiento.
              </p>

              <div className="before-start-box">
                <strong>Antes de empezar:</strong>

                <ol>
                  <li>Tenga sus documentos escaneados en PDF.</li>
                  <li>Verifique el costo y plazo estimado del trámite.</li>
                  <li>Inicie sesión para registrar formalmente la solicitud.</li>
                </ol>
              </div>
            </div>

            <div className="procedure-start-footer">
              <Link to="/tramites" className="cancel-button">
                Cancelar
              </Link>

              <button type="button" onClick={continuarTramite}>
                Continuar →
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default ProcedureDetail;