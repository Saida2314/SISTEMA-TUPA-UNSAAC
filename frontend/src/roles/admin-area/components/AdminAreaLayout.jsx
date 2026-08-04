import { NavLink, useNavigate } from 'react-router-dom';

function AdminAreaLayout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="admin-area-shell">
      <header className="admin-area-topbar">
        <div className="admin-area-brand">
          <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />
          <strong>TUPA UNSAAC</strong>
        </div>

        <nav className="admin-area-nav">
          <NavLink to="/admin-area" end>
            Panel
          </NavLink>

          <NavLink to="/admin-area/solicitudes">
            Derivaciones
          </NavLink>

          <NavLink to="/admin-area/consultas">
            Consultas
          </NavLink>
        </nav>

        <div className="admin-area-actions">
          <button type="button" title="Notificaciones">
            N
          </button>

          <button type="button" title="Ayuda">
            ?
          </button>

          <div className="admin-area-profile">
            <div className="admin-area-avatar">
              {(usuario?.nombres || 'A').charAt(0)}
            </div>

            <div>
              <strong>{usuario?.nombres || 'Admin Área'}</strong>
              <small>Admin de Área</small>
            </div>
          </div>

          <button type="button" className="admin-area-logout" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      <main className="admin-area-main">
        {children}
      </main>
    </div>
  );
}

export default AdminAreaLayout;