import { NavLink, useNavigate } from 'react-router-dom';

function RevisorLayout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="revisor-shell">
      <header className="revisor-topbar">
        <div className="revisor-brand">
          <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />
          <strong>UNSAAC TUPA</strong>
        </div>

        <nav className="revisor-nav">
          <NavLink to="/revisor" end>
            Inicio
          </NavLink>

          <NavLink to="/revisor/bandeja">
            Trámites
          </NavLink>

          <NavLink to="/revisor/bandeja">
            Procedimientos
          </NavLink>
        </nav>

        <div className="revisor-actions">
          <button type="button" title="Notificaciones">
            N
          </button>

          <button type="button" title="Ayuda">
            ?
          </button>

          <div className="revisor-profile">
            <div className="revisor-profile-avatar">
              {(usuario?.nombres || 'R').charAt(0)}
            </div>

            <div>
              <strong>{usuario?.nombres || 'Revisor'}</strong>
              <small>Perfil</small>
            </div>
          </div>

          <button type="button" className="revisor-logout" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      <main className="revisor-main">
        {children}
      </main>
    </div>
  );
}

export default RevisorLayout;