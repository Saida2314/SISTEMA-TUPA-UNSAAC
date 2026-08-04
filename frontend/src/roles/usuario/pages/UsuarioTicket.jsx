import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTicket() {
  const navigate = useNavigate();
  const location = useLocation();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const desdeAntonia = location.state?.desdeAntonia || false;
  const resumenAntonia = location.state?.resumenAntonia || '';
  const idConversacionAntonia = location.state?.idConversacionAntonia || null;

  const nombreCompleto = `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.trim();

  const [nombreCompletoInput, setNombreCompletoInput] = useState(nombreCompleto);
  const [codigoAlumno, setCodigoAlumno] = useState(usuario?.dni || '');

  const [asunto, setAsunto] = useState(
    desdeAntonia ? 'Caso derivado desde Antonia' : 'Problema con trámite'
  );

  const [categoria, setCategoria] = useState('Trámites');
  const [prioridad, setPrioridad] = useState('MEDIA');

  const [mensaje, setMensaje] = useState(
    desdeAntonia
      ? `Solicito revisión de este caso. Resumen de conversación con Antonia:\n\n${resumenAntonia}`
      : ''
  );

  const [respuesta, setRespuesta] = useState('');
  const [tipoRespuesta, setTipoRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crearTicket(e) {
    e.preventDefault();

    if (
      !nombreCompletoInput.trim() ||
      !codigoAlumno.trim() ||
      !asunto.trim() ||
      !mensaje.trim()
    ) {
      setRespuesta('Debe completar todos los campos obligatorios.');
      setTipoRespuesta('error');
      return;
    }

    try {
      setEnviando(true);
      setRespuesta('');
      setTipoRespuesta('');

      const response = await api.post('/soporte/tickets', {
        id_usuario: usuario.id_usuario,
        asunto,
        categoria,
        prioridad,
        mensaje,
        id_conversacion_antonia: idConversacionAntonia
      });

      const idTicket = response.data.ticket.id_ticket;

      navigate(`/usuario/soporte/tickets/${idTicket}`);
    } catch (error) {
      console.error(error);

      setRespuesta(
        error.response?.data?.mensaje || 'No se pudo crear el ticket de soporte.'
      );

      setTipoRespuesta('error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <UsuarioLayout>
      <section className="ticket-page-layout">
        <article className="ticket-form-panel">
          <h1>🎫 Enviar un Ticket de Soporte</h1>

          <form onSubmit={crearTicket}>
            <div className="form-two-columns">
              <div>
                <label>Nombre Completo</label>

                <input
                  type="text"
                  value={nombreCompletoInput}
                  onChange={(e) => setNombreCompletoInput(e.target.value)}
                  placeholder="Ingresa tu nombre"
                />
              </div>

              <div>
                <label>Código de Alumno / DNI</label>

                <input
                  type="text"
                  value={codigoAlumno}
                  onChange={(e) => setCodigoAlumno(e.target.value)}
                  placeholder="Ej: 12345678"
                />
              </div>
            </div>

            <label>Asunto del Trámite</label>

            <select
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
            >
              <option>Problema con trámite</option>
              <option>Problema con voucher</option>
              <option>Solicitud observada</option>
              <option>Documentos no visibles</option>
              <option>Pago no reflejado</option>
              <option>Problema técnico</option>
              <option>Caso derivado desde Antonia</option>
            </select>

            <div className="form-two-columns">
              <div>
                <label>Categoría</label>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option>Trámites</option>
                  <option>Pagos</option>
                  <option>Documentos</option>
                  <option>Solicitudes</option>
                  <option>Problema técnico</option>
                </select>
              </div>

              <div>
                <label>Prioridad</label>

                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value)}
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
            </div>

            <label>Descripción del Problema</label>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe detalladamente tu consulta o inconveniente..."
            />

            {respuesta && (
              <p className={tipoRespuesta === 'error' ? 'auth-error' : 'success-message'}>
                {respuesta}
              </p>
            )}

            <div className="confirmation-actions">
              <button type="submit" className="btn-primary" disabled={enviando}>
                {enviando ? 'Enviando...' : 'ENVIAR SOLICITUD 🚀'}
              </button>

              <Link to="/usuario/soporte" className="btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        </article>

        <aside className="ticket-info-column">
          <article className="phone-card">
            <small>PRIORITARIO</small>

            <p>Llamar a Central</p>

            <strong>(084) 232398</strong>

            <p>
              Atención telefónica inmediata para consultas rápidas.
            </p>
          </article>

          <article className="schedule-card">
            <h3>🕘 Horario de Atención</h3>

            <p>Lunes a Viernes</p>

            <strong>8:00 AM - 3:00 PM</strong>
          </article>

          <article className="quick-panel">
            <h2>✧ Acceso Rápido</h2>

            <a href="#" onClick={(e) => e.preventDefault()}>
              Guía de Trámites 2026 <span>›</span>
            </a>

            <a href="#" onClick={(e) => e.preventDefault()}>
              Cronograma Académico <span>›</span>
            </a>
          </article>
        </aside>
      </section>

      <article className="ticket-campus">
        <div>
          <h2>Atención Presencial</h2>

          <p>
            Trámite Documentario - Pabellón Central
          </p>

          <p>
            📍 Av. de la Cultura, Nro. 733, Cusco
          </p>

          <button type="button">
            Ver en Google Maps ↗
          </button>
        </div>

        <div className="map-placeholder wide">
          <span>MAPA DEL CAMPUS UNIVERSITARIO</span>
          <small>UNSAAC - CUSCO</small>
        </div>
      </article>
    </UsuarioLayout>
  );
}

export default UsuarioTicket;