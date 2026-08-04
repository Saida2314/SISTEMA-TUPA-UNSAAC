import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTramites() {
  const [tramites, setTramites] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarTramites() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get('/public/tramites');
      setTramites(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar los trámites desde la base de datos.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTramites();
  }, []);

  const tramitesFiltrados = useMemo(() => {
    return tramites.filter((tramite) => {
      const coincideCategoria =
        categoria === 'Todos' || tramite.categoria === categoria;

      const texto = `
        ${tramite.nombre}
        ${tramite.descripcion}
        ${tramite.codigo}
        ${tramite.codigo_publico_tramite || ''}
        ${tramite.categoria}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      return coincideCategoria && coincideBusqueda;
    });
  }, [tramites, buscar, categoria]);

  return (
    <UsuarioLayout>
      <section className="catalog-banner">
        <div>
          <span className="eyebrow light">Catálogo institucional</span>
          <h1>Catálogo de Trámites</h1>
          <p>
            Consulta procedimientos administrativos, costos, duración y requisitos
            antes de iniciar tu solicitud.
          </p>
        </div>

        <div className="catalog-search">
          <span>⌕</span>

          <input
            placeholder="Buscar trámites..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
      </section>

      <section className="filter-row">
        {['Todos', 'Pregrado', 'Posgrado', 'Administrativo'].map((item) => (
          <button
            key={item}
            type="button"
            className={categoria === item ? 'active' : ''}
            onClick={() => setCategoria(item)}
          >
            {item}
          </button>
        ))}
      </section>

      {cargando && (
        <div className="empty-state">
          <h3>Cargando trámites...</h3>
          <p>Consultando información desde SQL Server.</p>
        </div>
      )}

      {mensaje && (
        <div className="empty-state">
          <h3>{mensaje}</h3>
        </div>
      )}

      {!cargando && !mensaje && (
        <section className="procedure-grid">
          {tramitesFiltrados.map((tramite) => (
            <article key={tramite.id_tramite} className="procedure-card-user">
              <div className="procedure-code-row">
                <span>{tramite.codigo_publico_tramite || tramite.codigo}</span>
                <b>📄</b>
              </div>

              <h2>{tramite.nombre}</h2>

              <p>{tramite.descripcion}</p>

              <div className="procedure-meta">
                <span>
                  ◷ {tramite.plazo_dias} {tramite.tipo_plazo}
                </span>

                <span>
                  Tasa: <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
                </span>
              </div>

              <Link
                to={`/usuario/tramites/${tramite.id_tramite}`}
                className="btn-primary full"
              >
                Realizar Trámite →
              </Link>
            </article>
          ))}
        </section>
      )}

      {!cargando && tramitesFiltrados.length === 0 && (
        <div className="empty-state">
          <h3>No se encontraron trámites</h3>
          <p>Prueba con otro término de búsqueda o revisa otra categoría.</p>
        </div>
      )}

      <Link to="/usuario/soporte" className="floating-support">
        <strong>¿No encuentras el trámite?</strong>
        <span>🎧</span>
      </Link>
    </UsuarioLayout>
  );
}

export default UsuarioTramites;