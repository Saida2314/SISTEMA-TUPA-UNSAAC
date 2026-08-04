import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

function PublicNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  function irAConsultas(e) {
    e.preventDefault();

    if (location.pathname !== '/') {
      navigate('/?section=consultas');
      return;
    }

    const section = document.getElementById('consultas');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function abrirNotificaciones() {
    alert(
      'Notificaciones\n\nPor ahora no tienes notificaciones públicas.\nCuando inicies sesión, aquí aparecerán avisos sobre tus solicitudes y observaciones.'
    );
  }

  function abrirAyuda() {
    alert(
      'Ayuda rápida\n\n1. Usa el buscador para encontrar un trámite.\n2. Revisa costo, plazo y categoría.\n3. Presiona Acceder para iniciar sesión.\n4. Luego podrás registrar solicitudes y revisar su estado.'
    );
  }

  return (
    <header className="public-navbar">
      <div className="navbar-brand">
        <img src="/images/logo-unsaac.png" alt="Logo UNSAAC" />
        <span>TUPA UNSAAC</span>
      </div>

      <nav className="navbar-menu">
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/tramites">Tramites</NavLink>
        <a href="#consultas" onClick={irAConsultas}>Consultas</a>
      </nav>

      <div className="navbar-actions">
        <button
          type="button"
          className="icon-button"
          onClick={abrirNotificaciones}
          title="Notificaciones"
        >
          &#128276;
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={abrirAyuda}
          title="Ayuda"
        >
          ?
        </button>

        <Link to="/login" className="access-button">Acceder</Link>
      </div>
    </header>
  );
}

export default PublicNavbar;