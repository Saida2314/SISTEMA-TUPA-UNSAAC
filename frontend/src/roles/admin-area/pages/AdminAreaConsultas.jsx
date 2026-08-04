import { useEffect, useMemo, useRef, useState } from 'react';
import AdminAreaLayout from '../components/AdminAreaLayout';
import api from '../../../services/api';

function AdminAreaConsultas() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [tickets, setTickets] = useState([]);
  const [ticketActivo, setTicketActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [respuesta, setRespuesta] = useState('');

  const [cargando, setCargando] = useState(true);
  const [cargandoTicket, setCargandoTicket] = useState(false);
  const [mensajeSistema, setMensajeSistema] = useState('');

  const mensajesRef = useRef(null);

  async function cargarTickets(idTicketPreferido = null) {
    try {
      setCargando(true);
      setMensajeSistema('');

      const response = await api.get('/admin-area/tickets');
      const lista = response.data || [];

      setTickets(lista);

      if (lista.length > 0) {
        const ticketASeleccionar =
          lista.find((ticket) => ticket.id_ticket === idTicketPreferido) ||
          lista.find((ticket) => ticket.id_ticket === ticketActivo?.id_ticket) ||
          lista[0];

        if (ticketASeleccionar) {
          await cargarTicket(ticketASeleccionar.id_ticket);
        }
      } else {
        setTicketActivo(null);
        setMensajes([]);
      }
    } catch (error) {
      console.error(error);
      setMensajeSistema(
        error.response?.data?.mensaje || 'No se pudieron cargar las consultas.'
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarTicket(idTicket) {
    try {
      setCargandoTicket(true);
      setMensajeSistema('');

      const response = await api.get(`/admin-area/tickets/${idTicket}`);

      setTicketActivo(response.data.ticket);
      setMensajes(response.data.mensajes || []);
    } catch (error) {
      console.error(error);
      setMensajeSistema(
        error.response?.data?.mensaje || 'No se pudo cargar la conversación.'
      );
    } finally {
      setCargandoTicket(false);
    }
  }

  useEffect(() => {
    cargarTickets();
  }, []);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes, cargandoTicket, mensajeSistema]);

  const inicialesUsuario = useMemo(() => {
    if (!ticketActivo) return 'US';

    const nombres = ticketActivo.nombres || '';
    const apellidos = ticketActivo.apellidos || '';

    const iniciales = `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

    return iniciales || 'US';
  }, [ticketActivo]);

  function formatearHora(fecha) {
    if (!fecha) return '';

    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearFecha(fecha) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function limpiarEstado(estado) {
    return String(estado || '').replace(/_/g, ' ');
  }

  function claseTicket(estado) {
    if (estado === 'ABIERTO') return 'waiting';
    if (estado === 'EN_ATENCION') return 'active';
    if (estado === 'RESUELTO') return 'done';
    if (estado === 'CERRADO') return 'closed';

    return 'waiting';
  }

  function obtenerUltimoMensaje(ticket) {
    const texto = ticket.ultimo_mensaje || ticket.asunto || 'Sin mensaje registrado.';

    if (texto.length > 82) {
      return `${texto.slice(0, 82)}...`;
    }

    return texto;
  }

  function obtenerNombreTicket(ticket) {
    const nombres = ticket.nombres || '';
    const apellidos = ticket.apellidos || '';

    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    return nombreCompleto || 'Usuario no identificado';
  }

  async function enviarRespuesta(e) {
    e.preventDefault();

    if (!ticketActivo || !respuesta.trim()) return;

    try {
      const textoRespuesta = respuesta.trim();

      setRespuesta('');

      await api.post(`/admin-area/tickets/${ticketActivo.id_ticket}/responder`, {
        mensaje: textoRespuesta,
        id_usuario: usuario?.id_usuario || null
      });

      await cargarTicket(ticketActivo.id_ticket);
      await cargarTickets(ticketActivo.id_ticket);
    } catch (error) {
      console.error(error);
      setMensajeSistema(
        error.response?.data?.mensaje || 'No se pudo enviar la respuesta.'
      );
    }
  }

  async function finalizarAtencion() {
    if (!ticketActivo) return;

    const confirmar = window.confirm(
      '¿Deseas finalizar la atención de esta consulta?'
    );

    if (!confirmar) return;

    try {
      await api.put(`/admin-area/tickets/${ticketActivo.id_ticket}/finalizar`);

      await cargarTicket(ticketActivo.id_ticket);
      await cargarTickets(ticketActivo.id_ticket);
    } catch (error) {
      console.error(error);
      setMensajeSistema(
        error.response?.data?.mensaje || 'No se pudo finalizar la atención.'
      );
    }
  }

  function irExpedienteUsuario() {
    alert(
      'Esta acción puede conectarse luego con las solicitudes del usuario para abrir su expediente relacionado.'
    );
  }

  function irPagosUsuario() {
    alert(
      'Esta acción puede conectarse luego con la información de pagos del usuario.'
    );
  }

  function irNotasInternas() {
    alert(
      'Esta acción puede conectarse luego con notas internas de atención.'
    );
  }

  function enviarEmailUsuario() {
    if (!ticketActivo?.correo) {
      alert('El usuario no tiene correo registrado.');
      return;
    }

    window.location.href = `mailto:${ticketActivo.correo}`;
  }

  return (
    <AdminAreaLayout>
      <section className="admin-area-chat-page">
        <aside className="admin-area-chat-queue">
          <div className="chat-queue-title">
            <h2>Cola de espera</h2>
            <p>{tickets.length} consulta(s) registradas</p>
          </div>

          {cargando ? (
            <p className="chat-empty-text">Cargando consultas...</p>
          ) : tickets.length === 0 ? (
            <p className="chat-empty-text">
              No hay consultas registradas por el momento.
            </p>
          ) : (
            <div className="chat-ticket-list">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id_ticket}
                  type="button"
                  className={
                    ticketActivo?.id_ticket === ticket.id_ticket
                      ? 'chat-ticket-card selected'
                      : 'chat-ticket-card'
                  }
                  onClick={() => cargarTicket(ticket.id_ticket)}
                >
                  <div>
                    <strong>{obtenerNombreTicket(ticket)}</strong>
                    <span>{obtenerUltimoMensaje(ticket)}</span>
                    <small>
                      {formatearFecha(
                        ticket.fecha_ultimo_mensaje || ticket.fecha_creacion
                      )}
                    </small>
                  </div>

                  <em className={`chat-ticket-status ${claseTicket(ticket.estado)}`}>
                    {limpiarEstado(ticket.estado)}
                  </em>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="admin-area-chat-center">
          {ticketActivo ? (
            <>
              <header className="chat-main-header">
                <div className="chat-user-mini">
                  <div>{inicialesUsuario}</div>

                  <section>
                    <h2>
                      {ticketActivo.nombres || 'Usuario'}{' '}
                      {ticketActivo.apellidos || ''}
                    </h2>

                    <p>
                      {limpiarEstado(ticketActivo.estado)} ·{' '}
                      {ticketActivo.categoria || 'Consulta'}
                    </p>
                  </section>
                </div>

                <button
                  type="button"
                  className="chat-finish-button"
                  onClick={finalizarAtencion}
                  disabled={
                    ticketActivo.estado === 'RESUELTO' ||
                    ticketActivo.estado === 'CERRADO'
                  }
                >
                  Finalizar atención
                </button>
              </header>

              <div className="chat-messages-panel" ref={mensajesRef}>
                {mensajeSistema && (
                  <div className="chat-system-message">
                    {mensajeSistema}
                  </div>
                )}

                {cargandoTicket ? (
                  <p className="chat-empty-text">Cargando conversación...</p>
                ) : mensajes.length === 0 ? (
                  <p className="chat-empty-text">
                    No hay mensajes registrados en esta consulta.
                  </p>
                ) : (
                  mensajes.map((item) => (
                   /* <article
                      key={item.id_mensaje_ticket}
                      className={
                        item.emisor === 'USUARIO'
                          ? 'chat-message user'
                          : 'chat-message admin'
                      }
                    >
                      <p>{item.mensaje}</p>
                      <small>{formatearHora(item.fecha_envio)}</small>
                    </article>*/

                    <article
  key={item.id_mensaje_ticket}
  className={
    item.emisor === 'USUARIO'
      ? 'chat-message user'
      : 'chat-message admin'
  }
>
  <p>{item.mensaje}</p>

  {item.mensaje && item.mensaje.length > 450 && (
    <em className="chat-long-message-note">
      Mensaje largo: usa el scroll dentro del cuadro para leerlo completo.
    </em>
  )}

  <small>{formatearHora(item.fecha_envio)}</small>
</article>

                  ))
                )}
              </div>

              <form className="chat-input-bar" onSubmit={enviarRespuesta}>
                <input
                  type="text"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escriba una respuesta para el usuario..."
                  disabled={
                    ticketActivo.estado === 'RESUELTO' ||
                    ticketActivo.estado === 'CERRADO'
                  }
                />

                <button
                  type="submit"
                  disabled={
                    !respuesta.trim() ||
                    ticketActivo.estado === 'RESUELTO' ||
                    ticketActivo.estado === 'CERRADO'
                  }
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="chat-no-ticket">
              <h2>Seleccione una consulta</h2>
              <p>
                Elija un ticket de la cola de espera para iniciar la atención.
              </p>
            </div>
          )}
        </main>

        <aside className="admin-area-chat-detail">
          {ticketActivo ? (
            <>
              <div className="chat-detail-avatar">
                {inicialesUsuario}
              </div>

              <h2>
                {ticketActivo.nombres || 'Usuario'} {ticketActivo.apellidos || ''}
              </h2>

              <p>Código: {ticketActivo.codigo_usuario || '-'}</p>

              <span className="chat-detail-tag">
                {ticketActivo.categoria || 'Consulta'}
              </span>

              <section>
                <h3>Información del usuario</h3>

                <div>
                  <small>DNI</small>
                  <strong>{ticketActivo.dni || '-'}</strong>
                </div>

                <div>
                  <small>Correo</small>
                  <strong>{ticketActivo.correo || '-'}</strong>
                </div>
              </section>

              <section>
                <h3>Consulta actual</h3>

                <div className="chat-current-ticket">
                  <strong>{ticketActivo.codigo_ticket}</strong>
                  <p>{ticketActivo.asunto || 'Sin asunto registrado.'}</p>
                  <small>Prioridad: {ticketActivo.prioridad || 'MEDIA'}</small>

                  <span>{limpiarEstado(ticketActivo.estado)}</span>
                </div>
              </section>

              <section>
                <h3>Acciones rápidas</h3>

                <div className="chat-quick-actions">
                  <button type="button" onClick={irExpedienteUsuario}>
                    Expediente
                  </button>

                  <button type="button" onClick={irPagosUsuario}>
                    Pagos
                  </button>

                  <button type="button" onClick={irNotasInternas}>
                    Notas
                  </button>

                  <button type="button" onClick={enviarEmailUsuario}>
                    Email
                  </button>
                </div>
              </section>
            </>
          ) : (
            <p className="chat-empty-text">Sin consulta seleccionada.</p>
          )}
        </aside>
      </section>
    </AdminAreaLayout>
  );
}

export default AdminAreaConsultas;