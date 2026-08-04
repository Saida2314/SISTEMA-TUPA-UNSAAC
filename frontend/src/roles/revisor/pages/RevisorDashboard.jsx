import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RevisorLayout from '../components/RevisorLayout';
import api from '../../../services/api';

function RevisorDashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarResumen() {
    try {
      setCargando(true);

      const response = await api.get('/revisor/resumen');

      setResumen(response.data.resumen);
      setRecientes(response.data.recientes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarResumen();
  }, []);

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  return (
    <RevisorLayout>
      <section className="revisor-page-heading">
        <div>
          <h1>Bienvenido {usuario?.nombres || 'Revisor'}</h1>
          <p>Gestión centralizada de procedimientos y métricas de cumplimiento.</p>
        </div>

        <Link to="/revisor/bandeja" className="revisor-primary-button">
          Ir a Bandeja
        </Link>
      </section>

      <section className="revisor-dashboard-grid">
        <article className="revisor-metric-card">
          <div className="metric-label-row">
            <span className="metric-icon">COLA</span>
            <small>+ hoy</small>
          </div>

          <h2>Trámites en mi cola</h2>

          <div className="metric-number">
            {cargando ? '-' : resumen?.en_revision || 0}
            <span>procedimientos pendientes</span>
          </div>

          <div className="metric-list">
            <p>
              <b className="dot red"></b>
              Observados
              <strong>{resumen?.observados || 0}</strong>
            </p>

            <p>
              <b className="dot yellow"></b>
              Registrados
              <strong>{resumen?.registrados || 0}</strong>
            </p>
          </div>
        </article>

        <article className="revisor-metric-card">
          <div className="metric-label-row">
            <span className="metric-icon amber">TMP</span>
            <small className="green">12%</small>
          </div>

          <h2>Promedio de Respuesta</h2>

          <div className="metric-number">
            3.2
            <span>días hábiles</span>
          </div>

          <div className="progress-track">
            <div style={{ width: '64%' }}></div>
          </div>

          <p className="metric-note">Meta institucional: 5.0 días</p>
        </article>

        <article className="revisor-office-card">
          <h2>Carga por Oficina</h2>

          <div className="office-load">
            <p>
              Grados y Títulos
              <strong>45%</strong>
            </p>
            <div>
              <span style={{ width: '45%' }}></span>
            </div>
          </div>

          <div className="office-load">
            <p>
              Registros Académicos
              <strong>30%</strong>
            </p>
            <div>
              <span style={{ width: '30%' }}></span>
            </div>
          </div>

          <div className="office-load">
            <p>
              Bienestar Universitario
              <strong>25%</strong>
            </p>
            <div>
              <span style={{ width: '25%' }}></span>
            </div>
          </div>
        </article>
      </section>

      <section className="revisor-content-grid">
        <article className="revisor-observed-card">
          <header>
            <h2>Trámites observados</h2>

            <Link to="/revisor/bandeja">
              Gestionar todos
            </Link>
          </header>

          <div className="observed-grid">
            <div>
              <small>Documentación</small>
              <h3>Falta de legibilidad</h3>
              <p>
                Se solicita al recurrente adjuntar una copia legible del documento
                de identidad o certificado.
              </p>
            </div>

            <div>
              <small>Tasas</small>
              <h3>Error en pago de tasa</h3>
              <p>
                El voucher adjunto no corresponde al código tarifario del TUPA
                vigente.
              </p>
            </div>

            <div>
              <small>Firmas</small>
              <h3>Firma no coincidente</h3>
              <p>
                Se observa que la firma digital o manuscrita no coincide con los
                registros oficiales.
              </p>
            </div>

            <div>
              <small>Requisitos</small>
              <h3>Falta de fotografía</h3>
              <p>
                Para la emisión del carné universitario es indispensable cumplir
                con el formato solicitado.
              </p>
            </div>
          </div>
        </article>

        <aside className="revisor-activity-card">
          <h2>Actividad reciente</h2>

          {recientes.length === 0 && (
            <p className="empty-text">No hay actividad reciente.</p>
          )}

          {recientes.map((item) => (
            <div className="activity-item" key={item.id_solicitud}>
              <span></span>

              <div>
                <strong>{item.codigo_solicitud} - {limpiarEstado(item.estado)}</strong>
                <p>{item.tramite}</p>
              </div>
            </div>
          ))}

          <Link to="/revisor/bandeja" className="revisor-outline-button full">
            Ver bitácora completa
          </Link>
        </aside>
      </section>

      <section className="revisor-guide-banner">
        <h2>Guía rápida para Revisores</h2>

        <p>
          Revisa los expedientes enviados, registra observaciones, aprueba o deriva
          solicitudes según corresponda.
        </p>

        <button type="button">
          Descargar Guía PDF
        </button>
      </section>
    </RevisorLayout>
  );
}

export default RevisorDashboard;