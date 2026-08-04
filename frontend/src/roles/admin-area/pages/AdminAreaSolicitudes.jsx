
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminAreaLayout from '../components/AdminAreaLayout';
import api from '../../../services/api';

function AdminAreaSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [estado, setEstado] = useState('TODOS');
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get('/admin-area/solicitudes', {
        params: {
          estado,
          buscar
        }
      });

      setSolicitudes(response.data || []);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar las derivaciones.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, [estado]);

  function buscarSolicitudes(e) {
    e.preventDefault();
    cargarSolicitudes();
  }

  function limpiarEstado(valor) {
    return String(valor || '').replace(/_/g, ' ');
  }

  function claseEstado(valor) {
    if (valor === 'DERIVADO') return 'derived';
    if (valor === 'EN_VALIDACION_AREA') return 'review';
    if (valor === 'FINALIZADO') return 'done';
    if (valor === 'RECHAZADO') return 'rejected';

    return 'neutral';
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

  return (
    <AdminAreaLayout>
      <section className="admin-area-page">
        <header className="admin-area-page-header">
          <div>
            <span>Bandeja del Admin de Área</span>
            <h1>Expedientes derivados</h1>
            <p>
              Solicitudes que llegaron desde el panel del revisor para validación final.
            </p>
          </div>
        </header>

        <section className="admin-area-filter-card">
          <div className="admin-area-filter-buttons">
            <button
              type="button"
              className={estado === 'TODOS' ? 'active' : ''}
              onClick={() => setEstado('TODOS')}
            >
              Todos
            </button>

            <button
              type="button"
              className={estado === 'DERIVADO' ? 'active' : ''}
              onClick={() => setEstado('DERIVADO')}
            >
              Derivados
            </button>

            <button
              type="button"
              className={estado === 'EN_VALIDACION_AREA' ? 'active' : ''}
              onClick={() => setEstado('EN_VALIDACION_AREA')}
            >
              En validación
            </button>

            <button
              type="button"
              className={estado === 'FINALIZADO' ? 'active' : ''}
              onClick={() => setEstado('FINALIZADO')}
            >
              Finalizados
            </button>
          </div>

          <form className="admin-area-search" onSubmit={buscarSolicitudes}>
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por expediente, trámite, solicitante, DNI u oficina..."
            />

            <button type="submit">
              Buscar
            </button>
          </form>
        </section>

        {mensaje && (
          <div className="admin-area-message error">
            {mensaje}
          </div>
        )}

        <section className="admin-area-table-card">
          <div className="admin-area-card-header">
            <h2>Lista de derivaciones</h2>
            <span>{solicitudes.length} expediente(s)</span>
          </div>

          {cargando ? (
            <p className="admin-area-empty">Cargando expedientes...</p>
          ) : solicitudes.length === 0 ? (
            <p className="admin-area-empty">
              No hay expedientes derivados con los filtros seleccionados.
            </p>
          ) : (
            <div className="admin-area-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Solicitante</th>
                    <th>Trámite</th>
                    <th>Oficina destino</th>
                    <th>Estado</th>
                    <th>Fecha derivación</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {solicitudes.map((item) => (
                    <tr key={item.id_solicitud}>
                      <td>
                        <strong>{item.codigo_solicitud}</strong>
                        <small>{item.codigo_derivacion || 'Sin código derivación'}</small>
                      </td>

                      <td>
                        <strong>{item.apellidos}, {item.nombres}</strong>
                        <small>DNI: {item.dni}</small>
                      </td>

                      <td>
                        <strong>{item.tramite}</strong>
                        <small>{item.categoria}</small>
                      </td>

                      <td>
                        <strong>{item.oficina_destino || '-'}</strong>
                        <small>{item.motivo_derivacion || 'Sin motivo registrado'}</small>
                      </td>

                      <td>
                        <span className={`admin-area-status ${claseEstado(item.estado)}`}>
                          {limpiarEstado(item.estado)}
                        </span>
                      </td>

                      <td>{formatearFecha(item.fecha_derivacion)}</td>

                      <td>
                        <Link
                          to={`/admin-area/solicitudes/${item.id_solicitud}`}
                          className="admin-area-view-button"
                        >
                          Revisar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AdminAreaLayout>
  );
}

export default AdminAreaSolicitudes;