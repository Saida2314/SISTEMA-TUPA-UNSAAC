import { NavLink, useNavigate } from 'react-router-dom';
import AntoniaWidget from './AntoniaWidget';

function UsuarioLayout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="usuario-shell">
      <aside className="usuario-sidebar">
        <div className="usuario-brand">
          <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />

          <div>
            <strong>TUPA UNSAAC</strong>
            <small>Portal del Usuario</small>
          </div>
        </div>

        <nav className="usuario-menu">
          <NavLink to="/usuario" end>
            <span>⌂</span>
            Inicio
          </NavLink>

          <NavLink to="/usuario/tramites">
            <span>▤</span>
            Trámites
          </NavLink>

          <NavLink to="/usuario/solicitudes">
            <span>□</span>
            Mis Solicitudes
          </NavLink>

          <NavLink to="/usuario/soporte">
            <span>?</span>
            Soporte
          </NavLink>

          <NavLink to="/usuario/soporte/tickets">
            <span>✉</span>
            Mis Tickets
          </NavLink>
        </nav>

        <div className="usuario-sidebar-profile">
          <div className="usuario-avatar">
            {(usuario?.nombres || 'U').charAt(0)}
          </div>

          <div>
            <strong>{usuario?.nombres || 'Usuario'}</strong>
            <small>{usuario?.correo || 'correo institucional'}</small>
          </div>
        </div>

        <button type="button" className="usuario-logout" onClick={cerrarSesion}>
          <span>↪</span>
          Cerrar Sesión
        </button>
      </aside>

      <main className="usuario-main">
        {children}
      </main>

      <AntoniaWidget />
    </div>
  );
}

export default UsuarioLayout;