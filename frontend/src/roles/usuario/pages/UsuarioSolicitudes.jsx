import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioSolicitudes() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get(`/solicitudes/usuario/${usuario.id_usuario}`);
      setSolicitudes(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar tus solicitudes.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarSolicitudes();
    }
  }, []);

  const enRevision = useMemo(() => {
    return solicitudes.filter((item) => item.estado === 'EN_REVISION').length;
  }, [solicitudes]);

  const observados = useMemo(() => {
    return solicitudes.filter((item) => item.estado === 'OBSERVADO').length;
  }, [solicitudes]);

  const finalizados = useMemo(() => {
    return solicitudes.filter((item) => item.estado === 'FINALIZADO').length;
  }, [solicitudes]);

  function descargarConstancia(idSolicitud) {
    window.open(`http://localhost:3001/api/solicitudes/${idSolicitud}/constancia`, '_blank');
  }

  function claseEstado(estado) {
    if (estado === 'FINALIZADO' || estado === 'APROBADO') return 'done';
    if (estado === 'OBSERVADO' || estado === 'RECHAZADO') return 'observed';
    return 'process';
  }

  return (
    <UsuarioLayout>
      <section className="page-heading">
        <div>
          <h1>Mis Solicitudes</h1>
          <p>Consulta el estado, historial y constancia de tus trámites.</p>
        </div>

        <Link to="/usuario/tramites" className="btn-primary">
          + Nuevo trámite
        </Link>
      </section>

      <section className="stats-grid">
        <article>
          <small>En revisión</small>
          <strong>{enRevision}</strong>
          <span>📋</span>
        </article>

        <article>
          <small>Observados</small>
          <strong>{observados}</strong>
          <span>●</span>
        </article>

        <article>
          <small>Finalizados</small>
          <strong>{finalizados}</strong>
          <span>✓</span>
        </article>
      </section>

      {mensaje && (
        <div className="empty-state">
          <h3>{mensaje}</h3>
        </div>
      )}

      <section className="requests-layout one-column">
        <article className="requests-table-card">
          <header>
            <h2>Solicitudes recientes</h2>
          </header>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Trámite</th>
                  <th>Categoría</th>
                  <th>Pago</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan="7">Cargando solicitudes...</td>
                  </tr>
                )}

                {!cargando && solicitudes.length === 0 && (
                  <tr>
                    <td colSpan="7">Todavía no tienes solicitudes registradas.</td>
                  </tr>
                )}

                {!cargando && solicitudes.map((solicitud) => (
                  <tr key={solicitud.id_solicitud}>
                    <td>
                      <strong className="code-text">{solicitud.codigo_solicitud}</strong>
                    </td>

                    <td>{solicitud.tramite}</td>

                    <td>{solicitud.categoria}</td>

                    <td>{solicitud.codigo_pago}</td>

                    <td>{new Date(solicitud.fecha_envio).toLocaleDateString('es-PE')}</td>

                    <td>
                      <span className={`status ${claseEstado(solicitud.estado)}`}>
                        {solicitud.estado}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/usuario/solicitudes/${solicitud.id_solicitud}`}
                          className="table-link"
                        >
                          Ver historial
                        </Link>

                        <button
                          type="button"
                          onClick={() => descargarConstancia(solicitud.id_solicitud)}
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer>
            Mostrando {solicitudes.length} solicitudes
            <span>‹ ›</span>
          </footer>
        </article>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioSolicitudes;