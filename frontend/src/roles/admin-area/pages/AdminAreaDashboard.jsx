import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminAreaLayout from '../components/AdminAreaLayout';
import api from '../../../services/api';

function AdminAreaDashboard() {
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarResumen() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get('/admin-area/resumen');

      setResumen(response.data.resumen);
      setRecientes(response.data.recientes || []);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar el resumen del Admin de Área.');
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

  return (
    <AdminAreaLayout>
      <section className="admin-area-dashboard">
        <header className="admin-area-page-header">
          <div>
            <span>Panel del Admin de Área</span>
            <h1>Validación de expedientes derivados</h1>
            <p>
              Aquí se reciben los trámites derivados por el revisor para su revisión
              final, aceptación, respuesta y cierre administrativo.
            </p>
          </div>

          <div className="admin-area-header-actions">
            <Link to="/admin-area/solicitudes" className="admin-area-primary-button">
              Ver derivaciones
            </Link>

            <Link to="/admin-area/consultas" className="admin-area-outline-button">
              Ver consultas
            </Link>
          </div>
        </header>

        {mensaje && (
          <div className="admin-area-message error">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="admin-area-card">
            Cargando información...
          </div>
        ) : (
          <>
            <section className="admin-area-metrics">
              <article>
                <span>Total recibidos</span>
                <strong>{resumen?.total || 0}</strong>
                <small>Expedientes del área</small>
              </article>

              <article>
                <span>Derivados</span>
                <strong>{resumen?.derivados || 0}</strong>
                <small>Pendientes de tomar</small>
              </article>

              <article>
                <span>En validación</span>
                <strong>{resumen?.en_validacion || 0}</strong>
                <small>Revisión final</small>
              </article>

              <article>
                <span>Finalizados</span>
                <strong>{resumen?.finalizados || 0}</strong>
                <small>Trámites aceptados</small>
              </article>
            </section>

            <section className="admin-area-content-grid">
              <article className="admin-area-card">
                <div className="admin-area-card-header">
                  <h2>Derivaciones recientes</h2>
                  <Link to="/admin-area/solicitudes">Ver todas</Link>
                </div>

                <div className="admin-area-recent-list">
                  {recientes.length === 0 && (
                    <p>No hay expedientes derivados.</p>
                  )}

                  {recientes.map((item) => (
                    <Link
                      key={item.id_solicitud}
                      to={`/admin-area/solicitudes/${item.id_solicitud}`}
                      className="admin-area-recent-item"
                    >
                      <div>
                        <strong>{item.codigo_solicitud}</strong>
                        <span>{item.tramite}</span>
                        <small>
                          {item.nombres} {item.apellidos} · {item.categoria}
                        </small>
                      </div>

                      <div>
                        <span className="admin-area-status derived">
                          {limpiarEstado(item.estado)}
                        </span>
                        <small>{formatearFecha(item.fecha_derivacion)}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </article>

              <aside className="admin-area-card admin-area-guide">
                <h2>Rol del Admin de Área</h2>

                <p>
                  El Admin de Área no recibe trámites directamente del usuario.
                  Recibe expedientes derivados por el revisor.
                </p>

                <ul>
                  <li>Revisa documentos del expediente.</li>
                  <li>Adjunta archivo de respuesta si corresponde.</li>
                  <li>Registra mensaje de recojo presencial.</li>
                  <li>Acepta y finaliza el trámite.</li>
                </ul>
              </aside>
            </section>
          </>
        )}
      </section>
    </AdminAreaLayout>
  );
}

export default AdminAreaDashboard;