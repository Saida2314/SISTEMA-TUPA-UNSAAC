import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PublicNavbar from '../../layouts/PublicNavbar';

function PublicHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (searchParams.get('section') === 'consultas') {
      setTimeout(() => {
        const section = document.getElementById('consultas');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    }
  }, [searchParams]);

  function buscarTramite(e) {
    e.preventDefault();

    const texto = busqueda.trim();

    if (texto === '') {
      navigate('/tramites');
      return;
    }

    navigate(`/tramites?buscar=${encodeURIComponent(texto)}`);
  }

  return (
    <div className="public-page">
      <PublicNavbar />

      <section className="hero-section">
        <div className="hero-overlay">
          <h1>
            Simplificando tu Gestión<br />
            Académica en la UNSAAC
          </h1>

          <p>
            Accede a todos los trámites, requisitos y servicios administrativos de la
            Universidad Nacional de San Antonio Abad del Cusco en un solo lugar.
          </p>

          <form className="hero-search" onSubmit={buscarTramite}>
            <span>⌕</span>

            <input
              placeholder="¿Qué trámite deseas realizar hoy?"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <button type="submit">Buscar</button>
          </form>
        </div>
      </section>

      <section className="categories-section">
        <div className="section-heading">
          <div>
            <h2>Categorías de Trámites</h2>
            <p>Explora los servicios organizados por tipo de usuario.</p>
          </div>

          <Link to="/tramites" className="view-all">
            Ver todas las categorías →
          </Link>
        </div>

        <div className="category-grid">
          <article className="category-card">
            <div className="category-icon">▱</div>
            <h3>Pregrado</h3>
            <p>
              Matrículas, traslados, carné universitario y solicitudes académicas
              para estudiantes vigentes.
            </p>
            <Link to="/tramites?categoria=Pregrado">Explorar</Link>
          </article>

          <article className="category-card">
            <div className="category-icon">▣</div>
            <h3>Posgrado</h3>
            <p>
              Admisión, grados de maestro y doctor, y certificaciones para estudios
              de especialización.
            </p>
            <Link to="/tramites?categoria=Posgrado">Explorar</Link>
          </article>

          <article className="category-card">
            <div className="category-icon">▥</div>
            <h3>Administrativo</h3>
            <p>
              Subsidios, beneficios sociales, recursos administrativos y solicitudes
              institucionales del personal administrativo.
            </p>
            <Link to="/tramites?categoria=Administrativo">Explorar</Link>
          </article>
        </div>
      </section>

      <section className="steps-section">
        <h2>¿Cómo realizar tu trámite?</h2>

        <div className="steps-line"></div>

        <div className="steps-grid">
          <article className="step-item active">
            <div className="step-circle">⌕</div>
            <h3>1. Busca</h3>
            <p>Localiza tu trámite en el buscador principal.</p>
          </article>

          <article className="step-item">
            <div className="step-circle">▤</div>
            <h3>2. Revisa</h3>
            <p>Consulta los requisitos, costos y plazos.</p>
          </article>

          <article className="step-item">
            <div className="step-circle">⇧</div>
            <h3>3. Presenta</h3>
            <p>Sube tus documentos a través de la oficina virtual.</p>
          </article>

          <article className="step-item">
            <div className="step-circle">◴</div>
            <h3>4. Monitorea</h3>
            <p>Sigue el estado de tu solicitud en tiempo real.</p>
          </article>
        </div>
      </section>

      <section className="efficiency-section" id="consultas">
        <div className="efficiency-left">
          <h2>Eficiencia en cada paso</h2>
          <p>
            Nuestra plataforma digital permite consultar procedimientos, requisitos,
            costos y plazos de forma ordenada, reduciendo confusión y consultas presenciales.
          </p>

          <div className="metrics-grid">
            <div className="metric-card">
              <strong>24/7</strong>
              <span>CONSULTA DIGITAL</span>
            </div>

            <div className="metric-card">
              <strong>100%</strong>
              <span>TRAZABILIDAD</span>
            </div>
          </div>
        </div>

        <div className="faq-box">
          <h3>Preguntas Frecuentes</h3>

          <details>
            <summary>¿Cómo pago las tasas universitarias?</summary>
            <p>El sistema muestra el costo del trámite y posteriormente generará un código asociado a la solicitud.</p>
          </details>

          <details>
            <summary>¿Dónde reviso los requisitos?</summary>
            <p>Ingresa al Catálogo de Trámites y busca el procedimiento que necesitas realizar.</p>
          </details>

          <details>
            <summary>¿Puedo realizar trámites si soy egresado?</summary>
            <p>Sí, existen trámites disponibles para estudiantes, egresados, titulados y personal de la universidad.</p>
          </details>
        </div>
      </section>

      <footer className="public-footer">
        <div className="footer-brand">
          <img src="/images/logo-unsaac.png" alt="UNSAAC" />
          <strong>UNIVERSIDAD NACIONAL DE SAN ANTONIO ABAD DEL CUSCO</strong>
        </div>

        <div className="footer-links">
          <a>Privacidad</a>
          <a>Términos y Condiciones</a>
          <a>Mapa de Sitio</a>
          <a>Contacto</a>
        </div>

        <p>
          © 2024 Universidad Nacional de San Antonio Abad del Cusco. Todos los derechos
          reservados. Av. de la Cultura, Nro. 733, Cusco - Perú.
        </p>
      </footer>
    </div>
  );
}

export default PublicHome;