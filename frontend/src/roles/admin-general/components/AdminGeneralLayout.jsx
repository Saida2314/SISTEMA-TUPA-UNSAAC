import { NavLink, useNavigate } from 'react-router-dom';

function AdminGeneralLayout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="admin-general-shell">
      <header className="admin-general-topbar">
        <div className="admin-general-brand">
          <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />
          <strong>TUPA UNSAAC</strong>
        </div>

        <nav className="admin-general-nav">
          <NavLink to="/admin-general" end>
            Panel
          </NavLink>

          <NavLink to="/admin-general/tramites">
            Trámites
          </NavLink>

          <NavLink to="/admin-general/usuarios">
            Usuarios
          </NavLink>
        </nav>

        <div className="admin-general-actions">
          <button
            type="button"
            className="admin-general-notification-button"
            title="Notificaciones"
          >
            <svg
              className="admin-general-bell-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 0 0-4.5-5.8V4a1.5 1.5 0 0 0-3 0v1.2A6 6 0 0 0 6 11v5l-1.6 2.1A1 1 0 0 0 5.2 20h13.6a1 1 0 0 0 .8-1.9L18 16Z" />
            </svg>
          </button>

          <div className="admin-general-profile">
            <div className="admin-general-avatar">
              {(usuario?.nombres || 'A').charAt(0).toUpperCase()}
            </div>

            <div className="admin-general-profile-text">
              <strong>{usuario?.nombres || 'Administrador'}</strong>
              <small>Admin General</small>
            </div>
          </div>

          <button
            type="button"
            className="admin-general-logout"
            onClick={cerrarSesion}
            title="Cerrar sesión"
          >
            <svg
              className="admin-general-logout-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V5H5v14h4v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6Z" />
              <path d="M16.3 7.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4l2.3-2.3H9a1 1 0 1 1 0-2h9.6l-2.3-2.3a1 1 0 0 1 0-1.4Z" />
            </svg>

            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="admin-general-main">
        {children}
      </main>
    </div>
  );
}

export default AdminGeneralLayout;