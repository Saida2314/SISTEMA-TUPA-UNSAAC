import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import UsuarioLayout from '../components/UsuarioLayout';
import api from '../../../services/api';

function UsuarioMisTickets() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarTickets() {
    try {
      setCargando(true);

      const response = await api.get(`/soporte/tickets/usuario/${usuario.id_usuario}`);
      setTickets(response.data);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar tus tickets.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTickets();
  }, []);

  function claseEstado(estado) {
    if (estado === 'CERRADO' || estado === 'RESUELTO') return 'done';
    if (estado === 'EN_ATENCION') return 'process';
    return 'observed';
  }

  return (
    <UsuarioLayout>
      <section className="page-heading">
        <div>
          <h1>Mis Tickets</h1>
          <p>Revisa tus conversaciones de soporte con los encargados.</p>
        </div>

        <Link to="/usuario/soporte/ticket" className="btn-primary">
          + Nuevo ticket
        </Link>
      </section>

      <section className="requests-layout one-column">
        <article className="requests-table-card">
          <header>
            <h2>Tickets registrados</h2>
          </header>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Asunto</th>
                  <th>Categoría</th>
                  <th>Prioridad</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan="7">Cargando tickets...</td>
                  </tr>
                )}

                {!cargando && tickets.length === 0 && (
                  <tr>
                    <td colSpan="7">Todavía no tienes tickets registrados.</td>
                  </tr>
                )}

                {!cargando && tickets.map((ticket) => (
                  <tr key={ticket.id_ticket}>
                    <td>
                      <strong className="code-text">{ticket.codigo_ticket}</strong>
                    </td>

                    <td>{ticket.asunto}</td>
                    <td>{ticket.categoria}</td>
                    <td>{ticket.prioridad}</td>

                    <td>
                      {new Date(ticket.fecha_creacion).toLocaleDateString('es-PE')}
                    </td>

                    <td>
                      <span className={`status ${claseEstado(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/usuario/soporte/tickets/${ticket.id_ticket}`}
                        className="table-link"
                      >
                        Abrir chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mensaje && <p className="auth-error">{mensaje}</p>}
        </article>
      </section>
    </UsuarioLayout>
  );
}

export default UsuarioMisTickets;