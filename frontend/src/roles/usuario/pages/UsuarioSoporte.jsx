import { Link } from 'react-router-dom';
import { useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';

function UsuarioSoporte() {
  const [consulta, setConsulta] = useState('');

  function abrirAntoniaConMensaje(mensaje) {
    window.dispatchEvent(
      new CustomEvent('antonia:abrir', {
        detail: {
          mensaje
        }
      })
    );
  }

  function enviarConsultaAntonia(e) {
    e.preventDefault();

    const pregunta = consulta.trim();

    if (!pregunta) {
      abrirAntoniaConMensaje('Hola Antonia, necesito ayuda con un trámite.');
      return;
    }

    abrirAntoniaConMensaje(pregunta);
    setConsulta('');
  }

  function preguntarTemaFrecuente(tema) {
    abrirAntoniaConMensaje(tema);
  }

  return (
    <UsuarioLayout>
      <section className="support-layout-top">
        <article className="assistant-card">
          <div className="assistant-avatar">
            <span>👩‍💼</span>
          </div>

          <div>
            <h1>Hola, soy Antonia</h1>

            <p>
              Tu asistente virtual para todos los procesos del TUPA. ¿En qué puedo
              ayudarte con tu trámite?
            </p>

            <div className="assistant-tags">
              <button
                type="button"
                onClick={() =>
                  preguntarTemaFrecuente('¿Qué necesito para solicitar una constancia de estudios?')
                }
              >
                Certificado de Estudios ↗
              </button>

              <button
                type="button"
                onClick={() =>
                  preguntarTemaFrecuente('¿Cómo puedo validar mi pago o voucher?')
                }
              >
                Pago y Voucher ↗
              </button>
            </div>

            <form className="assistant-input" onSubmit={enviarConsultaAntonia}>
              <input
                type="text"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Escribe tu consulta aquí..."
              />

              <button type="submit">
                ➤
              </button>
            </form>
          </div>
        </article>

        <aside className="quick-panel">
          <h2>✧ Acceso Rápido</h2>

          <a
            href="https://tramite.unsaac.edu.pe/"
            target="_blank"
            rel="noreferrer"
          >
            Guía de Trámites / TUPA UNSAAC <span>›</span>
          </a>

          <a
            href="https://www.unsaac.edu.pe/calendarios-academicos/"
            target="_blank"
            rel="noreferrer"
          >
            Cronograma Académico <span>›</span>
          </a>

          <a
            href="https://tramite.unsaac.edu.pe/assets/manual/manual.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Manual de Trámite Documentario PDF <span>⇩</span>
          </a>
        </aside>
      </section>

      
      <section className="support-bottom-layout">
        <article className="campus-panel">
          <div>
            <h2>Atención Presencial</h2>

            <p>Trámite Documentario - Pabellón Central</p>

            <p>
              📍 Av. de la Cultura, Nro. 733, Cusco
              <br />
              🕒 Lunes a Viernes: 08:00 - 15:00
            </p>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Universidad+Nacional+de+San+Antonio+Abad+del+Cusco"
              target="_blank"
              rel="noreferrer"
              className="support-map-link"
            >
              Ver en Google Maps ↗
            </a>
          </div>

          <div className="soporte-map-box">
  <img
    src="/images/mapa-unsaac.jpg"
    alt="Mapa del campus universitario UNSAAC"
  />

  <div className="soporte-map-label">
    <strong>UNSAAC - CUSCO</strong>
    <span>Mapa del campus universitario</span>
  </div>
</div>
        
        
        
        </article>

        <aside className="not-found-panel">
          <h2>¿No encontraste lo que buscabas?</h2>

          <p>
            Nuestros especialistas están listos para ayudarte con consultas
            específicas o problemas técnicos complejos.
          </p>

          <a href="tel:+5184232398" className="btn-muted full">
            ☎ Llamar a Soporte
          </a>

          <Link to="/usuario/soporte/ticket" className="btn-secondary full">
            🎫 Enviar un Ticket
          </Link>

          <Link to="/usuario/soporte/tickets" className="btn-primary full">
            Ver mis tickets
          </Link>
        </aside>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioSoporte;