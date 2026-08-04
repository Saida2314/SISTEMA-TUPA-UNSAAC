import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTramiteDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [tramite, setTramite] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarTramite() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get(`/public/tramites/${id}`);
      setTramite(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar la información del trámite.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTramite();
  }, [id]);

  if (cargando) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>Cargando trámite...</h3>
        </div>
      </UsuarioLayout>
    );
  }

  if (mensaje || !tramite) {
    return (
      <UsuarioLayout>
        <div className="empty-state">
          <h3>{mensaje || 'Trámite no encontrado.'}</h3>

          <Link to="/usuario/tramites" className="btn-primary">
            Volver al catálogo
          </Link>
        </div>
      </UsuarioLayout>
    );
  }

  return (
    <UsuarioLayout>
      <div className="stepper">
        <div className="active">
          <span>1</span>
          <strong>Información</strong>
        </div>

        <div>
          <span>2</span>
          <strong>Pago y documentos</strong>
        </div>

        <div>
          <span>3</span>
          <strong>Confirmación</strong>
        </div>
      </div>

      <section className="procedure-detail-layout">
        <article className="detail-panel compact">
          <div className="detail-heading">
            <div className="detail-icon">📄</div>

            <div>
              <span className="procedure-badge">
                {tramite.codigo_publico_tramite || tramite.codigo}
              </span>

              <h1>{tramite.nombre}</h1>
              <p>{tramite.descripcion}</p>
            </div>
          </div>

          <div className="requirements-box">
            <h3>Requisitos obligatorios</h3>

            <ul>
              <li>Solicitud dirigida a la autoridad correspondiente.</li>
              <li>Documento de identidad vigente.</li>
              <li>Recibo o voucher de pago correspondiente.</li>
              <li>Documentos sustentatorios según el trámite seleccionado.</li>
            </ul>
          </div>

          <div className="cost-duration-grid">
            <div>
              <small>Costo total</small>
              <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
            </div>

            <div>
              <small>Duración</small>
              <strong>
                {tramite.plazo_dias} {tramite.tipo_plazo}
              </strong>
            </div>
          </div>

          <div className="help-inline">
            <strong>¿Necesitas ayuda?</strong>
            <p>
              Revisa soporte antes de iniciar el trámite para evitar observaciones
              en tu expediente.
            </p>
          </div>
        </article>

        <article className="start-request-panel">
          <header>Iniciar Solicitud</header>

          <div className="start-request-body">
            <div className="large-soft-icon">▤</div>

            <h2>Preparación de Expediente</h2>

            <p>
              Antes de continuar, verifica que cuentas con tus documentos en formato
              digital y que podrás validar el pago mediante una clave de voucher.
            </p>

            <div className="precheck-card">
              <h3>Antes de empezar</h3>

              <div>
                <span>1</span>
                <p>El sistema generará un código de pago único de 9 números.</p>
              </div>

              <div>
                <span>2</span>
                <p>Deberás validar una clave de voucher de 5 números.</p>
              </div>

              <div>
                <span>3</span>
                <p>Solo después del pago validado podrás enviar documentos.</p>
              </div>
            </div>
          </div>

          <footer>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/usuario/tramites')}
            >
              Cancelar
            </button>

            <Link
              to={`/usuario/tramites/${tramite.id_tramite}/documentos`}
              className="btn-primary"
            >
              Continuar →
            </Link>
          </footer>
        </article>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioTramiteDetalle;