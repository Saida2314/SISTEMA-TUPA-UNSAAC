import { NavLink, Link } from 'react-router-dom';

function PublicNavbar() {
  return (
    <header className="public-navbar">
      <div className="public-navbar-brand">
        <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />

        <div>
          <strong>TUPA UNSAAC</strong>
          <small>Portal de Trámites</small>
        </div>
      </div>

      <nav className="public-navbar-menu">
        <NavLink to="/" end>
          Inicio
        </NavLink>

        <NavLink to="/tramites">
          Trámites
        </NavLink>

        <a href="#consultas">
          Consultas
        </a>
      </nav>

      <div className="public-navbar-actions">
        <button
          type="button"
          className="public-icon-button"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <svg
            className="public-bell-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 0 0-4.5-5.8V4a1.5 1.5 0 0 0-3 0v1.2A6 6 0 0 0 6 11v5l-1.6 2.1A1 1 0 0 0 5.2 20h13.6a1 1 0 0 0 .8-1.9L18 16Z" />
          </svg>
        </button>

        <Link to="/login" className="public-login-button">
          Acceder
        </Link>
      </div>
    </header>
  );
}

export default PublicNavbar;