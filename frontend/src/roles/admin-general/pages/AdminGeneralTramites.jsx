import { useEffect, useMemo, useState } from 'react';
import AdminGeneralLayout from '../components/AdminGeneralLayout';
import api from '../../../services/api';

const tramiteVacio = {
  id_tramite: null,
  id_categoria: '',
  nombre: '',
  descripcion: '',
  costo: '',
  plazo_dias: '',
  tipo_plazo: 'Días Hábiles',
  tipo_entrega: 'MIXTA',
  activo: true
};

function AdminGeneralTramites() {
  const [categorias, setCategorias] = useState([]);
  const [tramites, setTramites] = useState([]);

  const [categoriaActiva, setCategoriaActiva] = useState('Pregrado');
  const [buscar, setBuscar] = useState('');
  const [formulario, setFormulario] = useState(tramiteVacio);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  async function cargarCategorias() {
    try {
      const response = await api.get('/admin-general/categorias');
      const lista = response.data || [];

      setCategorias(lista);

      if (lista.length > 0 && !lista.some((item) => item.nombre === categoriaActiva)) {
        setCategoriaActiva(lista[0].nombre);
      }
    } catch (error) {
      console.error(error);
      setMensaje('No se pudieron cargar las categorías.');
      setTipoMensaje('error');
    }
  }

  async function cargarTramites() {
    try {
      setCargando(true);

      const response = await api.get('/admin-general/tramites', {
        params: {
          categoria: categoriaActiva,
          buscar
        }
      });

      setTramites(response.data || []);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.detalle || 'No se pudieron cargar los trámites.');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarTramites();
  }, [categoriaActiva]);

  const categoriasTabs = useMemo(() => {
    const nombres = categorias.map((categoria) => categoria.nombre);
    return nombres.length > 0 ? nombres : ['Pregrado', 'Posgrado', 'Administrativo'];
  }, [categorias]);

  function buscarTramites(e) {
    e.preventDefault();
    cargarTramites();
  }

  function abrirNuevoTramite() {
    const categoriaSeleccionada = categorias.find(
      (categoria) => categoria.nombre === categoriaActiva
    );

    setFormulario({
      ...tramiteVacio,
      id_categoria: categoriaSeleccionada?.id_categoria || ''
    });

    setEditando(false);
    setMostrarFormulario(true);
  }

  function editarTramite(tramite) {
    setFormulario({
      id_tramite: tramite.id_tramite,
      id_categoria: tramite.id_categoria,
      nombre: tramite.nombre || '',
      descripcion: tramite.descripcion || '',
      costo: tramite.costo || '',
      plazo_dias: tramite.plazo_dias || '',
      tipo_plazo: tramite.tipo_plazo || 'Días Hábiles',
      tipo_entrega: tramite.tipo_entrega || 'MIXTA',
      activo: Boolean(tramite.activo)
    });

    setEditando(true);
    setMostrarFormulario(true);
  }

  function cambiarCampo(e) {
    const { name, value, type, checked } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function guardarTramite(e) {
    e.preventDefault();

    try {
      setMensaje('');

      if (editando) {
        await api.put(`/admin-general/tramites/${formulario.id_tramite}`, formulario);
        setMensaje('Trámite actualizado correctamente.');
      } else {
        await api.post('/admin-general/tramites', formulario);
        setMensaje('Trámite creado correctamente.');
      }

      setTipoMensaje('success');
      setMostrarFormulario(false);
      setFormulario(tramiteVacio);
      setEditando(false);
      await cargarTramites();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo guardar el trámite.');
      setTipoMensaje('error');
    }
  }

  async function cambiarEstadoTramite(tramite) {
    try {
      await api.put(`/admin-general/tramites/${tramite.id_tramite}/estado`, {
        activo: !tramite.activo
      });

      await cargarTramites();
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cambiar el estado del trámite.');
      setTipoMensaje('error');
    }
  }

  return (
    <AdminGeneralLayout>
      <section className="admin-general-page">
        <header className="admin-general-page-header">
          <div>
            <span>Administración TUPA</span>
            <h1>Gestión de Trámites y Categorías</h1>
            <p>Administre procedimientos administrativos de la institución.</p>
          </div>

          <div className="admin-general-header-actions">
            <form className="admin-general-search" onSubmit={buscarTramites}>
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Nombre o código de trámite..."
              />

              <button type="submit">Buscar</button>
            </form>

            <button
              type="button"
              className="admin-general-primary-button"
              onClick={abrirNuevoTramite}
            >
              Nuevo trámite
            </button>
          </div>
        </header>

        {mensaje && (
          <div className={`admin-general-message ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        {mostrarFormulario && (
          <section className="admin-general-form-card">
            <div className="admin-general-card-header">
              <h2>{editando ? 'Editar trámite' : 'Registrar nuevo trámite'}</h2>

              <button type="button" onClick={() => setMostrarFormulario(false)}>
                Cerrar
              </button>
            </div>

            <form className="admin-general-form-grid" onSubmit={guardarTramite}>
              <label>
                Categoría
                <select
                  name="id_categoria"
                  value={formulario.id_categoria}
                  onChange={cambiarCampo}
                  required
                >
                  <option value="">Seleccione categoría</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nombre del trámite
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label className="wide">
                Descripción
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Costo S/
                <input
                  type="number"
                  step="0.01"
                  name="costo"
                  value={formulario.costo}
                  onChange={cambiarCampo}
                />
              </label>

              <label>
                Plazo
                <input
                  type="number"
                  name="plazo_dias"
                  value={formulario.plazo_dias}
                  onChange={cambiarCampo}
                />
              </label>

              <label>
                Tipo de plazo
                <select
                  name="tipo_plazo"
                  value={formulario.tipo_plazo}
                  onChange={cambiarCampo}
                >
                  <option value="Días Hábiles">Días Hábiles</option>
                  <option value="Días Calendario">Días Calendario</option>
                  <option value="Horas">Horas</option>
                </select>
              </label>

              <label>
                Tipo de entrega
                <select
                  name="tipo_entrega"
                  value={formulario.tipo_entrega}
                  onChange={cambiarCampo}
                >
                  <option value="VIRTUAL">Virtual</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="MIXTA">Mixta</option>
                </select>
              </label>

              <label className="admin-general-check">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formulario.activo}
                  onChange={cambiarCampo}
                />
                Trámite activo
              </label>

              <div className="admin-general-form-actions">
                <button type="submit" className="admin-general-primary-button">
                  Guardar
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="admin-general-table-card">
          <div className="admin-general-tabs">
            {categoriasTabs.map((categoria) => (
              <button
                key={categoria}
                type="button"
                className={categoriaActiva === categoria ? 'active' : ''}
                onClick={() => setCategoriaActiva(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>

          <div className="admin-general-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del trámite</th>
                  <th>Costo S/</th>
                  <th>Tiempo est.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="6">Cargando trámites...</td>
                  </tr>
                ) : tramites.length === 0 ? (
                  <tr>
                    <td colSpan="6">No hay trámites registrados.</td>
                  </tr>
                ) : (
                  tramites.map((tramite) => (
                    <tr key={tramite.id_tramite}>
                      <td>
                        <strong>{tramite.codigo_publico_tramite || tramite.codigo}</strong>
                      </td>

                      <td>
                        <strong>{tramite.nombre}</strong>
                        <small>{tramite.categoria}</small>
                      </td>

                      <td>{Number(tramite.costo || 0).toFixed(2)}</td>

                      <td>
                        {tramite.plazo_dias} {tramite.tipo_plazo}
                      </td>

                      <td>
                        <span
                          className={
                            tramite.activo
                              ? 'admin-general-state active'
                              : 'admin-general-state inactive'
                          }
                        >
                          {tramite.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td>
                        <div className="admin-general-actions-row">
                          <button type="button" onClick={() => editarTramite(tramite)}>
                            Editar
                          </button>

                          <button type="button" onClick={() => cambiarEstadoTramite(tramite)}>
                            {tramite.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-general-table-footer">
            Mostrando {tramites.length} trámite(s)
          </div>
        </section>

        <section className="admin-general-bottom-grid">
          <article className="admin-general-card">
            <h2>Carga masiva</h2>
            <p>
              Importe múltiples trámites mediante archivos CSV o Excel siguiendo
              el formato institucional.
            </p>

            <button type="button">Subir archivo</button>
          </article>

          <article className="admin-general-card">
            <h2>Generar Reporte TUPA</h2>
            <p>
              Exporte el consolidado de trámites actuales para publicación oficial
              en el portal de transparencia.
            </p>

            <button type="button">Descargar PDF</button>
          </article>
        </section>
      </section>
    </AdminGeneralLayout>
  );
}

export default AdminGeneralTramites;