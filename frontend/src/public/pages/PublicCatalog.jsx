import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../layouts/PublicNavbar';
import api from '../../services/api';

function PublicCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tramites, setTramites] = useState([]);
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || 'Todos');
  const [buscar, setBuscar] = useState(searchParams.get('buscar') || '');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarTramites(categoriaActual, busquedaActual) {
    try {
      setCargando(true);
      setMensaje('');

      const params = {};

      if (categoriaActual !== 'Todos') {
        params.categoria = categoriaActual;
      }

      if (busquedaActual.trim() !== '') {
        params.buscar = busquedaActual.trim();
      }

      const response = await api.get('/public/tramites', { params });

      setTramites(response.data);

      if (response.data.length === 0) {
        setMensaje('No se encontraron trámites con los filtros seleccionados.');
      }
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar el catálogo. Verifica que el backend esté encendido.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};

      if (categoria !== 'Todos') {
        params.categoria = categoria;
      }

      if (buscar.trim() !== '') {
        params.buscar = buscar.trim();
      }

      setSearchParams(params);
      cargarTramites(categoria, buscar);
    }, 300);

    return () => clearTimeout(timer);
  }, [categoria, buscar, setSearchParams]);

  return (
    <div className="public-page">
      <PublicNavbar />

      <main className="catalog-container">
        <section className="catalog-hero">
          <div>
            <h1>Catálogo de Trámites</h1>
            <p>
              Accede a toda la información sobre procedimientos administrativos,
              requisitos y tasas de la UNSAAC.
            </p>
          </div>

          <form className="catalog-search" onSubmit={(e) => e.preventDefault()}>
            <span>⌕</span>

            <input
              placeholder="Buscar trámites..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </form>
        </section>

        <section className="catalog-tabs">
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

        <div className="catalog-counter">
          {cargando
            ? 'Cargando trámites...'
            : `${tramites.length} trámite(s) encontrado(s)`}
        </div>

        {mensaje && <p className="catalog-message">{mensaje}</p>}

        {!cargando && (
          <section className="catalog-grid">
            {tramites.map((tramite) => (
              <article key={tramite.id_tramite} className="procedure-card">
                <div className="procedure-top">
                  <span className={`pill ${tramite.categoria.toLowerCase()}`}>
                    {tramite.categoria}
                  </span>

                  <Link
                    to={`/tramites/${tramite.id_tramite}`}
                    className="arrow"
                    title="Ver detalle del trámite"
                  >
                    ›
                  </Link>
                </div>

                <h2>{tramite.nombre}</h2>

                <p>{tramite.descripcion}</p>

                <div className="procedure-line"></div>

                <div className="procedure-meta">
                  <div>
                    <span>COSTO</span>
                    <strong>S/ {Number(tramite.costo).toFixed(2)}</strong>
                  </div>

                  <div>
                    <span>TIEMPO EST.</span>
                    <strong>
                      {tramite.plazo_dias} {tramite.tipo_plazo}
                    </strong>
                  </div>
                </div>

                <Link
                  to={`/tramites/${tramite.id_tramite}`}
                  className="procedure-detail-button"
                >
                  Ver detalle →
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default PublicCatalog;