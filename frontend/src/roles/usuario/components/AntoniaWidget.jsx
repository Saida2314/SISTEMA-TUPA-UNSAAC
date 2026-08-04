import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

function AntoniaWidget() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [abierto, setAbierto] = useState(false);
  const [conversacion, setConversacion] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [requiereTicket, setRequiereTicket] = useState(false);
  const [creandoTicket, setCreandoTicket] = useState(false);

  const chatRef = useRef(null);
  const conversacionRef = useRef(null);
  const cargandoRef = useRef(false);

  useEffect(() => {
    conversacionRef.current = conversacion;
  }, [conversacion]);

  function bajarScroll() {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 80);
  }

  async function asegurarConversacion() {
    if (conversacionRef.current) {
      return conversacionRef.current;
    }

    if (!usuario?.id_usuario) {
      return null;
    }

    try {
      setCargando(true);
      cargandoRef.current = true;

      const response = await api.post('/antonia/iniciar', {
        id_usuario: usuario.id_usuario
      });

      const conversacionAbierta = response.data.conversacion;

      setConversacion(conversacionAbierta);
      conversacionRef.current = conversacionAbierta;

      const mensajesResponse = await api.get(
        `/antonia/conversaciones/${conversacionAbierta.id_conversacion}/mensajes`
      );

      setMensajes(mensajesResponse.data);
      bajarScroll();

      return conversacionAbierta;
    } catch (error) {
      console.error(error);

      setMensajes([
        {
          codigo_mensaje: 'error-antonia',
          emisor: 'ANTONIA',
          mensaje: 'No se pudo iniciar la conversación. Intenta nuevamente.'
        }
      ]);

      return null;
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }

  useEffect(() => {
    if (abierto && !conversacionRef.current) {
      asegurarConversacion();
    }
  }, [abierto]);

  async function enviarMensajeDirecto(mensajeUsuario, conversacionObjetivo = null) {
    const pregunta = String(mensajeUsuario || '').trim();

    if (!pregunta || cargandoRef.current) return;

    const conversacionActual = conversacionObjetivo || conversacionRef.current;

    if (!conversacionActual) return;

    setRequiereTicket(false);

    setMensajes((anteriores) => [
      ...anteriores,
      {
        codigo_mensaje: `tmp-user-${Date.now()}`,
        emisor: 'USUARIO',
        mensaje: pregunta
      }
    ]);

    bajarScroll();

    try {
      setCargando(true);
      cargandoRef.current = true;

      const response = await api.post('/antonia/mensaje', {
        id_usuario: usuario.id_usuario,
        id_conversacion: conversacionActual.id_conversacion,
        mensaje: pregunta
      });

      setMensajes((anteriores) => [
        ...anteriores,
        {
          codigo_mensaje: `tmp-antonia-${Date.now()}`,
          emisor: 'ANTONIA',
          mensaje: response.data.respuesta
        }
      ]);

      setRequiereTicket(Boolean(response.data.requiereTicket));
      bajarScroll();
    } catch (error) {
      console.error(error);

      setMensajes((anteriores) => [
        ...anteriores,
        {
          codigo_mensaje: `tmp-error-${Date.now()}`,
          emisor: 'ANTONIA',
          mensaje: 'No pude responder en este momento. Intenta nuevamente.'
        }
      ]);

      bajarScroll();
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }

  async function enviarMensaje(e) {
    e.preventDefault();

    const pregunta = texto.trim();

    if (!pregunta) return;

    setTexto('');

    const conv = await asegurarConversacion();

    if (conv) {
      await enviarMensajeDirecto(pregunta, conv);
    }
  }

  useEffect(() => {
    async function abrirAntoniaDesdeOtraPantalla(evento) {
      const preguntaInicial = evento.detail?.mensaje || '';

      setAbierto(true);

      const conv = await asegurarConversacion();

      if (conv && preguntaInicial.trim()) {
        await enviarMensajeDirecto(preguntaInicial, conv);
      }
    }

    window.addEventListener('antonia:abrir', abrirAntoniaDesdeOtraPantalla);

    return () => {
      window.removeEventListener('antonia:abrir', abrirAntoniaDesdeOtraPantalla);
    };
  }, []);

  async function cerrarConversacion() {
    if (conversacionRef.current?.id_conversacion) {
      try {
        await api.put(
          `/antonia/conversaciones/${conversacionRef.current.id_conversacion}/cerrar`
        );
      } catch (error) {
        console.error(error);
      }
    }

    setAbierto(false);
    setConversacion(null);
    conversacionRef.current = null;
    setMensajes([]);
    setTexto('');
    setRequiereTicket(false);
    setCreandoTicket(false);
  }

  async function crearTicketDesdeAntonia() {
    if (!usuario?.id_usuario || !conversacionRef.current?.id_conversacion) {
      setMensajes((anteriores) => [
        ...anteriores,
        {
          codigo_mensaje: `tmp-ticket-warning-${Date.now()}`,
          emisor: 'ANTONIA',
          mensaje:
            'No se pudo crear el ticket porque no hay una conversación activa. Escribe nuevamente tu consulta o crea el ticket desde la sección Soporte.'
        }
      ]);

      bajarScroll();
      return;
    }

    try {
      setCreandoTicket(true);

      const resumen = mensajes
        .map((item) => `${item.emisor}: ${item.mensaje}`)
        .join('\n');

      const response = await api.post('/soporte/tickets', {
        id_usuario: usuario.id_usuario,
        asunto: 'Caso derivado desde Antonia',
        categoria: 'Trámites',
        prioridad: 'MEDIA',
        mensaje:
          `Solicito revisión de este caso derivado desde Antonia.\n\n` +
          `Resumen de la conversación:\n\n${resumen}`,
        id_conversacion_antonia: conversacionRef.current.id_conversacion
      });

      const idTicket = response.data.ticket.id_ticket;

      setAbierto(false);
      navigate(`/usuario/soporte/tickets/${idTicket}`);
    } catch (error) {
      console.error(error);

      setMensajes((anteriores) => [
        ...anteriores,
        {
          codigo_mensaje: `tmp-ticket-error-${Date.now()}`,
          emisor: 'ANTONIA',
          mensaje:
            'No pude crear el ticket automáticamente. Puedes intentarlo desde la sección Soporte.'
        }
      ]);

      bajarScroll();
    } finally {
      setCreandoTicket(false);
    }
  }

  return (
    <>
      {!abierto && (
        <button
          type="button"
          className="antonia-widget-button"
          onClick={() => setAbierto(true)}
        >
          <span>👩‍💼 </span>

          <div>
            <strong>Antonia</strong>
            <small>¿Necesitas ayuda?</small>
          </div>
        </button>
      )}

      {abierto && (
        <section className="antonia-widget-box">
          <header className="antonia-widget-header">
            <div>
              <strong>Antonia</strong>
              <small>Asistente virtual TUPA</small>
            </div>

            <button type="button" onClick={cerrarConversacion}>
              ×
            </button>
          </header>

          <div className="antonia-widget-messages" ref={chatRef}>
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.codigo_mensaje}
                className={
                  mensaje.emisor === 'USUARIO'
                    ? 'antonia-bubble antonia-bubble-user'
                    : 'antonia-bubble antonia-bubble-bot'
                }
              >
                <p>{mensaje.mensaje}</p>
              </div>
            ))}

            {cargando && (
              <div className="antonia-bubble antonia-bubble-bot">
                <p>Escribiendo...</p>
              </div>
            )}
          </div>

          {requiereTicket && (
            <div className="antonia-widget-ticket">
              <p>Este caso puede requerir revisión de un encargado.</p>

              <button
                type="button"
                onClick={crearTicketDesdeAntonia}
                disabled={creandoTicket}
              >
                {creandoTicket
                  ? 'Creando ticket...'
                  : 'Crear ticket con esta conversación'}
              </button>
            </div>
          )}

          <form className="antonia-widget-form" onSubmit={enviarMensaje}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta..."
            />

            <button type="submit" disabled={!texto.trim() || cargando}>
              Enviar
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default AntoniaWidget;