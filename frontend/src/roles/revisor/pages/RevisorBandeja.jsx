import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import RevisorLayout from '../components/RevisorLayout';
import api from '../../../services/api';

function RevisorBandeja() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [estado, setEstado] = useState('TODOS');
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setMensaje('');

      const params = {};

      if (estado !== 'TODOS') {
        params.estado = estado;
      }

      if (buscar.trim()) {
        params.buscar = buscar.trim();
      }

      const response = await api.get('/revisor/solicitudes', { params });
      setSolicitudes(response.data || []);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar los expedientes desde la base de datos.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, [estado]);

  const solicitudesFiltradas = useMemo(() => {
    if (!buscar.trim()) return solicitudes;

    const texto = buscar.toLowerCase();

    return solicitudes.filter((solicitud) => {
      return (
        solicitud.codigo_solicitud?.toLowerCase().includes(texto) ||
        solicitud.tramite?.toLowerCase().includes(texto) ||
        solicitud.nombres?.toLowerCase().includes(texto) ||
        solicitud.apellidos?.toLowerCase().includes(texto) ||
        solicitud.dni?.toLowerCase().includes(texto) ||
        solicitud.correo?.toLowerCase().includes(texto)
      );
    });
  }, [solicitudes, buscar]);

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

  function limpiarEstado(valor) {
    return String(valor || '').replace(/_/g, ' ');
  }

  function claseEstado(valor) {
    if (valor === 'REGISTRADO') return 'registered';
    if (valor === 'EN_REVISION') return 'review';
    if (valor === 'OBSERVADO') return 'observed';
    if (valor === 'RECHAZADO') return 'rejected';
    if (valor === 'DERIVADO') return 'derived';
    if (valor === 'EN_VALIDACION_AREA') return 'validated';
    if (valor === 'FINALIZADO') return 'validated';

    return 'neutral';
  }

  function iniciales(solicitud) {
    const n = solicitud.nombres?.charAt(0) || '';
    const a = solicitud.apellidos?.charAt(0) || '';
    return `${n}${a}`.toUpperCase();
  }

  return (
    <RevisorLayout>
      <section className="revisor-page-heading">
        <div>
          <h1>Bandeja de Revisión</h1>
          <p>
            Expedientes reales enviados por los usuarios. Desde aquí el revisor
            abre cada solicitud para analizar documentos y voucher.
          </p>
        </div>

        <button
          type="button"
          className="revisor-primary-button"
          onClick={cargarSolicitudes}
        >
          Actualizar trámites
        </button>
      </section>

      <section className="review-filter-card">
        <div className="review-filter-buttons">
          <span>Filtrar por:</span>

          <button
            type="button"
            className={estado === 'TODOS' ? 'active' : ''}
            onClick={() => setEstado('TODOS')}
          >
            Todos
          </button>

          <button
            type="button"
            className={estado === 'REGISTRADO' ? 'active' : ''}
            onClick={() => setEstado('REGISTRADO')}
          >
            Registrado
          </button>

          <button
            type="button"
            className={estado === 'EN_REVISION' ? 'active' : ''}
            onClick={() => setEstado('EN_REVISION')}
          >
            En revisión
          </button>

          <button
            type="button"
            className={estado === 'OBSERVADO' ? 'active' : ''}
            onClick={() => setEstado('OBSERVADO')}
          >
            Observado
          </button>

          <button
            type="button"
            className={estado === 'EN_VALIDACION_AREA' ? 'active' : ''}
            onClick={() => setEstado('EN_VALIDACION_AREA')}
          >
            Aprobado
          </button>
        </div>

        <div className="review-search">
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') cargarSolicitudes();
            }}
            placeholder="Buscar por N° o solicitante..."
          />

          <button type="button" onClick={cargarSolicitudes}>
            Buscar
          </button>
        </div>
      </section>

      <section className="review-table-card">
        <div className="review-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Código expediente</th>
                <th>Tipo de trámite</th>
                <th>Solicitante</th>
                <th>Fecha de envío</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando && (
                <tr>
                  <td colSpan="6">Cargando expedientes desde la base de datos...</td>
                </tr>
              )}

              {!cargando && solicitudesFiltradas.length === 0 && (
                <tr>
                  <td colSpan="6">
                    No hay expedientes registrados todavía. Primero envía una solicitud desde el rol Usuario.
                  </td>
                </tr>
              )}

              {!cargando && solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id_solicitud}>
                  <td>
                    <strong className="review-code">
                      {solicitud.codigo_solicitud}
                    </strong>
                  </td>

                  <td>
                    <strong>{solicitud.tramite}</strong>
                    <small className="review-muted-text">
                      {solicitud.categoria}
                    </small>
                  </td>

                  <td>
                    <div className="review-user-cell">
                      <span>{iniciales(solicitud)}</span>

                      <div>
                        <strong>
                          {solicitud.apellidos}, {solicitud.nombres}
                        </strong>

                        <small>{solicitud.correo}</small>
                      </div>
                    </div>
                  </td>

                  <td>{formatearFecha(solicitud.fecha_envio)}</td>

                  <td>
                    <span className={`review-status ${claseEstado(solicitud.estado)}`}>
                      {limpiarEstado(solicitud.estado)}
                    </span>
                  </td>

                  <td>
                    <Link
                      to={`/revisor/solicitudes/${solicitud.id_solicitud}`}
                      className="review-view-button"
                    >
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer>
          <span>Mostrando {solicitudesFiltradas.length} expediente(s)</span>

          <div className="review-pagination">
            <button type="button" disabled>‹</button>
            <button type="button" className="active">1</button>
            <button type="button" disabled>›</button>
          </div>
        </footer>
      </section>

      {mensaje && (
        <p className="review-error-message">
          {mensaje}
        </p>
      )}
    </RevisorLayout>
  );
}

export default RevisorBandeja;