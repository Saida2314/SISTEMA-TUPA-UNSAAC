import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminGeneralLayout from '../components/AdminGeneralLayout';
import api from '../../../services/api';

function AdminGeneralDashboard() {
  const [resumen, setResumen] = useState(null);
  const [tramitesRecientes, setTramitesRecientes] = useState([]);
  const [usuariosRecientes, setUsuariosRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarPanel() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get('/admin-general/panel');

      setResumen(response.data.resumen);
      setTramitesRecientes(response.data.tramitesRecientes || []);
      setUsuariosRecientes(response.data.usuariosRecientes || []);
    } catch (error) {
      console.error(error);

      const detalle = error.response?.data?.detalle;
      const texto = detalle
        ? `No se pudo cargar el panel del Admin General. Detalle: ${detalle}`
        : 'No se pudo cargar el panel del Admin General.';

      setMensaje(texto);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPanel();
  }, []);

  function limpiarRol(rol) {
    return String(rol || '').replace(/_/g, ' ');
  }

  function formatearEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  return (
    <AdminGeneralLayout>
      <section className="admin-general-dashboard">
        <header className="admin-general-page-header">
          <div>
            <span>Panel Administrativo</span>
            <h1>Gestión General del Sistema TUPA</h1>
            <p>
              Administra trámites, categorías, usuarios administrativos,
              revisores y permisos de acceso del sistema.
            </p>
          </div>

          <div className="admin-general-header-actions">
            <Link to="/admin-general/tramites" className="admin-general-primary-button">
              Gestionar trámites
            </Link>

            <Link to="/admin-general/usuarios" className="admin-general-outline-button">
              Gestionar usuarios
            </Link>
          </div>
        </header>

        {mensaje && (
          <div className="admin-general-message error">
            {mensaje}
          </div>
        )}

        {cargando ? (
          <div className="admin-general-card">
            Cargando información...
          </div>
        ) : (
          <>
            <section className="admin-general-metrics">
              <article>
                <span>Trámites</span>
                <strong>{resumen?.total_tramites || 0}</strong>
                <small>{resumen?.tramites_activos || 0} activos</small>
              </article>

              <article>
                <span>Usuarios</span>
                <strong>{resumen?.total_usuarios || 0}</strong>
                <small>{resumen?.usuarios_pendientes || 0} pendientes</small>
              </article>

              <article>
                <span>Revisores</span>
                <strong>{resumen?.revisores || 0}</strong>
                <small>Usuarios con rol revisor</small>
              </article>

              <article>
                <span>Admin Área</span>
                <strong>{resumen?.admins_area || 0}</strong>
                <small>Responsables de validación</small>
              </article>
            </section>

            <section className="admin-general-content-grid">
              <article className="admin-general-card">
                <div className="admin-general-card-header">
                  <h2>Trámites recientes</h2>
                  <Link to="/admin-general/tramites">Ver todos</Link>
                </div>

                <div className="admin-general-mini-list">
                  {tramitesRecientes.length === 0 && (
                    <p>No hay trámites registrados.</p>
                  )}

                  {tramitesRecientes.map((item) => (
                    <div key={item.id_tramite} className="admin-general-mini-item">
                      <div>
                        <strong>{item.nombre}</strong>
                        <span>
                          {item.codigo_publico_tramite || item.codigo} · {item.categoria}
                        </span>
                      </div>

                      <em className={item.activo ? 'active' : 'inactive'}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="admin-general-card">
                <div className="admin-general-card-header">
                  <h2>Usuarios recientes</h2>
                  <Link to="/admin-general/usuarios">Ver todos</Link>
                </div>

                <div className="admin-general-mini-list">
                  {usuariosRecientes.length === 0 && (
                    <p>No hay usuarios registrados.</p>
                  )}

                  {usuariosRecientes.map((item) => (
                    <div key={item.id_usuario} className="admin-general-mini-item">
                      <div>
                        <strong>{item.nombres} {item.apellidos}</strong>
                        <span>
                          {limpiarRol(item.rol)} · {item.correo}
                        </span>
                      </div>

                      <em className={String(item.estado || '').toLowerCase()}>
                        {formatearEstado(item.estado)}
                      </em>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </AdminGeneralLayout>
  );
}

export default AdminGeneralDashboard;