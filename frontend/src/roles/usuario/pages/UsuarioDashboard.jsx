import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioDashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargarTramites() {
    try {
      setCargando(true);

      const response = await api.get('/public/tramites');
      setTramites(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error al cargar trámites sugeridos:', error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTramites();
  }, []);

  return (
    <UsuarioLayout>
      <section className="user-welcome-card">
        <div className="welcome-info">
          <span className="eyebrow">Portal del Usuario</span>

          <h1>¡Bienvenido a TUPA Digital!</h1>

          <p>
            Hola {usuario?.nombres || 'Usuario'}, desde este espacio puedes iniciar
            trámites, adjuntar requisitos, revisar observaciones y hacer seguimiento
            del estado de tus solicitudes.
          </p>

          <div className="welcome-actions">
            <Link to="/usuario/tramites" className="btn-primary">
              Iniciar Trámite
            </Link>

            <Link to="/usuario/solicitudes" className="btn-secondary">
              Ver Mis Solicitudes
            </Link>
          </div>
        </div>

        <div className="welcome-illustration">
          <div className="student-card">
            <span>👤</span>
            <strong>Gestión simple</strong>
            <small>Trámites en línea desde un solo lugar</small>
          </div>
        </div>
      </section>

      <section className="section-block">
        <h2>Pasos para realizar un trámite</h2>

        <div className="steps-grid">
          <article>
            <span>1</span>
            <h3>Elige tu trámite</h3>
            <p>Busca el procedimiento que necesitas y revisa sus requisitos.</p>
          </article>

          <article>
            <span>2</span>
            <h3>Valida tu pago</h3>
            <p>Genera el código de pago y valida la clave del voucher.</p>
          </article>

          <article>
            <span>3</span>
            <h3>Haz seguimiento</h3>
            <p>Consulta el estado e historial desde “Mis Solicitudes”.</p>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Trámites sugeridos</h2>
          <Link to="/usuario/tramites">Ver todos</Link>
        </div>

        {cargando && (
          <div className="empty-state">
            <h3>Cargando trámites...</h3>
          </div>
        )}

        {!cargando && (
          <div className="suggested-grid">
            {tramites.map((tramite) => (
              <article className="small-procedure-card" key={tramite.id_tramite}>
                <div className="small-card-top">
                  <span>📄</span>
                  <small>S/ {Number(tramite.costo).toFixed(2)}</small>
                </div>

                <h3>{tramite.nombre}</h3>
                <p>{tramite.descripcion}</p>

                <Link
                  to={`/usuario/tramites/${tramite.id_tramite}`}
                  className="btn-secondary full"
                >
                  Ver Detalles
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioDashboard;