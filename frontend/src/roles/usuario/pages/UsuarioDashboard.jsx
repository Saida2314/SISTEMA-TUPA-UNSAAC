import { Link } from 'react-router-dom';
import UsuarioLayout from '../components/UsuarioLayout';

function UsuarioDashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  return (
    <UsuarioLayout>
      <section className="usuario-dashboard-page">
        <div className="usuario-dashboard-hero">
          <div>
            <span>Portal del Usuario</span>

            <h1>
              Bienvenido, {usuario?.nombres || 'Usuario'}
            </h1>

            <p>
              Desde este panel puedes revisar los trámites disponibles,
              registrar nuevas solicitudes, consultar el estado de tus
              expedientes y comunicarte con soporte cuando sea necesario.
            </p>

            <div className="usuario-dashboard-actions">
              <Link to="/usuario/tramites">
                Ver trámites
              </Link>

              <Link to="/usuario/solicitudes">
                Mis solicitudes
              </Link>
            </div>
          </div>

          <div className="usuario-dashboard-map-card">
            <div className="usuario-map-header">
              <strong>Mapa institucional UNSAAC</strong>
              <span>Ubicación referencial</span>
            </div>

            <div className="usuario-map-image-box">
              <img
                src="/images/mapa-unsaac.jpg"
                alt="Mapa de ubicación de la UNSAAC"
              />
            </div>
          </div>
        </div>

        <section className="usuario-dashboard-grid">
          <article className="usuario-dashboard-card">
            <div className="usuario-dashboard-card-icon">
              01
            </div>

            <h2>Trámites disponibles</h2>

            <p>
              Consulta los procedimientos administrativos registrados en el
              sistema TUPA.
            </p>

            <Link to="/usuario/tramites">
              Revisar trámites
            </Link>
          </article>

          <article className="usuario-dashboard-card">
            <div className="usuario-dashboard-card-icon">
              02
            </div>

            <h2>Mis solicitudes</h2>

            <p>
              Revisa el avance, observaciones y estado actual de tus expedientes.
            </p>

            <Link to="/usuario/solicitudes">
              Ver solicitudes
            </Link>
          </article>

          <article className="usuario-dashboard-card">
            <div className="usuario-dashboard-card-icon">
              03
            </div>

            <h2>Soporte</h2>

            <p>
              Comunícate con el área encargada si tienes dudas sobre tus trámites.
            </p>

            <Link to="/usuario/soporte">
              Ir a soporte
            </Link>
          </article>
        </section>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioDashboard;