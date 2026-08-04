import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioTicketConversacion() {
  const { idTicket } = useParams();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [ticket, setTicket] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const chatRef = useRef(null);

  function bajarScroll() {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  }

  function formatearFecha(fecha) {
    if (!fecha) return '';

    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  async function cargarTicket() {
    try {
      setCargando(true);
      setMensajeError('');

      const response = await api.get(`/soporte/tickets/${idTicket}`);

      setTicket(response.data.ticket);
      setMensajes(response.data.mensajes || []);
      bajarScroll();
    } catch (error) {
      console.error(error);
      setMensajeError('No se pudo cargar la conversación del ticket.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTicket();
  }, [idTicket]);

  async function enviarMensaje(e) {
    e.preventDefault();

    if (!texto.trim()) return;

    try {
      setEnviando(true);

      await api.post(`/soporte/tickets/${idTicket}/mensajes`, {
        id_usuario: usuario.id_usuario,
        mensaje: texto.trim()
      });

      setTexto('');
      await cargarTicket();
    } catch (error) {
      console.error(error);
      setMensajeError('No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarTicket() {
    const confirmar = window.confirm(
      '¿Seguro que deseas cerrar este ticket? Después de cerrarlo ya no podrás enviar más mensajes.'
    );

    if (!confirmar) return;

    try {
      await api.put(`/soporte/tickets/${idTicket}/cerrar`);
      await cargarTicket();
    } catch (error) {
      console.error(error);
      setMensajeError('No se pudo cerrar el ticket.');
    }
  }

  if (cargando) {
    return (
      <UsuarioLayout>
        <div className="ticket-chat-loading">
          <h2>Cargando conversación...</h2>
          <p>Estamos recuperando los mensajes del ticket.</p>
        </div>
      </UsuarioLayout>
    );
  }

  if (!ticket) {
    return (
      <UsuarioLayout>
        <div className="ticket-chat-loading">
          <h2>No se encontró el ticket</h2>
          <p>{mensajeError || 'Verifica que el ticket exista.'}</p>

          <Link to="/usuario/soporte/tickets" className="btn-primary">
            Volver a mis tickets
          </Link>
        </div>
      </UsuarioLayout>
    );
  }

  const ticketCerrado = ticket.estado === 'CERRADO';

  return (
    <UsuarioLayout>
      <section className="ticket-chat-layout">
        <article className="ticket-chat-card">
          <header className="ticket-chat-top">
            <div>
              <Link to="/usuario/soporte/tickets" className="ticket-back-link">
                ← Mis tickets
              </Link>

              <h1>{ticket.asunto}</h1>

              <div className="ticket-meta-row">
                <span>{ticket.codigo_ticket}</span>
                <span>{ticket.categoria}</span>
                <span className={`ticket-state ${ticket.estado === 'CERRADO' ? 'closed' : 'open'}`}>
                  {limpiarEstado(ticket.estado)}
                </span>
              </div>
            </div>

            {!ticketCerrado && (
              <button
                type="button"
                className="ticket-close-button"
                onClick={cerrarTicket}
              >
                Cerrar ticket
              </button>
            )}
          </header>

          <div className="ticket-chat-body" ref={chatRef}>
            {mensajes.length === 0 && (
              <div className="ticket-empty-chat">
                <h3>Sin mensajes todavía</h3>
                <p>Escribe tu primer mensaje para iniciar la conversación.</p>
              </div>
            )}

            {mensajes.map((mensaje) => {
              const esUsuario = mensaje.emisor === 'USUARIO';
              const esSistema = mensaje.emisor === 'SISTEMA';

              return (
                <div
                  key={mensaje.codigo_mensaje}
                  className={
                    esUsuario
                      ? 'ticket-bubble ticket-bubble-user'
                      : esSistema
                        ? 'ticket-bubble ticket-bubble-system'
                        : 'ticket-bubble ticket-bubble-support'
                  }
                >
                  <div className="ticket-bubble-author">
                    {esUsuario
                      ? 'Tú'
                      : esSistema
                        ? 'Sistema'
                        : 'Encargado'}
                  </div>

                  <p>{mensaje.mensaje}</p>

                  <small>{formatearFecha(mensaje.fecha_envio)}</small>
                </div>
              );
            })}
          </div>

          {mensajeError && (
            <div className="ticket-chat-error">
              {mensajeError}
            </div>
          )}

          <form className="ticket-chat-input" onSubmit={enviarMensaje}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                ticketCerrado
                  ? 'Este ticket está cerrado'
                  : 'Escribe tu mensaje...'
              }
              disabled={ticketCerrado}
            />

            <button
              type="submit"
              disabled={ticketCerrado || enviando || !texto.trim()}
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </article>

        <aside className="ticket-detail-panel">
          <h2>Detalle del ticket</h2>

          <div className="ticket-detail-item">
            <span>Código</span>
            <strong>{ticket.codigo_ticket}</strong>
          </div>

          <div className="ticket-detail-item">
            <span>Estado</span>
            <strong>{limpiarEstado(ticket.estado)}</strong>
          </div>

          <div className="ticket-detail-item">
            <span>Categoría</span>
            <strong>{ticket.categoria}</strong>
          </div>

          <div className="ticket-detail-item">
            <span>Prioridad</span>
            <strong>{ticket.prioridad}</strong>
          </div>

          <div className="ticket-detail-item">
            <span>Fecha de creación</span>
            <strong>{formatearFecha(ticket.fecha_creacion)}</strong>
          </div>

          <div className="ticket-detail-note">
            <h3>Información</h3>
            <p>
              Esta conversación permite hacer seguimiento al caso reportado.
              Un encargado podrá responder desde el panel correspondiente.
            </p>
          </div>
        </aside>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioTicketConversacion;