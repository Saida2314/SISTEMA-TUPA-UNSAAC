import { useEffect, useState } from 'react';
import AdminGeneralLayout from '../components/AdminGeneralLayout';
import api from '../../../services/api';

const usuarioVacio = {
  nombres: '',
  apellidos: '',
  dni: '',
  correo: '',
  password: 'Admin123*',
  rol: 'REVISOR'
};

function AdminGeneralUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [rol, setRol] = useState('TODOS');
  const [estado, setEstado] = useState('TODOS');
  const [buscar, setBuscar] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioVacio);

  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setMensaje('');

      const response = await api.get('/admin-general/usuarios', {
        params: {
          rol,
          estado,
          buscar
        }
      });

      setUsuarios(response.data || []);
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.detalle || 'No se pudieron cargar los usuarios.');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, [rol, estado]);

  function buscarUsuarios(e) {
    e.preventDefault();
    cargarUsuarios();
  }

  function cambiarCampo(e) {
    const { name, value } = e.target;

    setNuevoUsuario((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function abrirFormulario(rolInicial) {
    setNuevoUsuario({
      ...usuarioVacio,
      rol: rolInicial
    });

    setMostrarFormulario(true);
  }

  async function crearUsuario(e) {
    e.preventDefault();

    try {
      await api.post('/admin-general/usuarios', nuevoUsuario);

      setMensaje('Usuario administrativo creado correctamente.');
      setTipoMensaje('success');
      setMostrarFormulario(false);
      setNuevoUsuario(usuarioVacio);

      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.mensaje || 'No se pudo crear el usuario.');
      setTipoMensaje('error');
    }
  }

  async function cambiarEstadoUsuario(usuario, nuevoEstado) {
    try {
      await api.put(`/admin-general/usuarios/${usuario.id_usuario}/estado`, {
        estado: nuevoEstado
      });

      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo actualizar el estado del usuario.');
      setTipoMensaje('error');
    }
  }

  function limpiarRol(valor) {
    return String(valor || '').replace(/_/g, ' ');
  }

  function formatearFecha(fecha) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <AdminGeneralLayout>
      <section className="admin-general-page">
        <header className="admin-general-page-header">
          <div>
            <span>Usuarios Admin</span>
            <h1>Control de Usuarios y Accesos</h1>
            <p>
              Administra los permisos, roles y estados de los usuarios del sistema.
            </p>

            <div className="admin-general-inline-actions">
              <button
                type="button"
                className="admin-general-primary-button"
                onClick={() => abrirFormulario('ADMIN_AREA')}
              >
                Crear nuevo Admin
              </button>

              <button
                type="button"
                className="admin-general-primary-button"
                onClick={() => abrirFormulario('REVISOR')}
              >
                Crear nuevo Revisor
              </button>
            </div>
          </div>

          <div className="admin-general-header-actions">
            <form className="admin-general-search" onSubmit={buscarUsuarios}>
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por DNI, apellido o correo..."
              />

              <button type="submit">Buscar</button>
            </form>

            <button type="button" className="admin-general-outline-button">
              Exportar reporte
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
              <h2>Crear usuario administrativo</h2>

              <button type="button" onClick={() => setMostrarFormulario(false)}>
                Cerrar
              </button>
            </div>

            <form className="admin-general-form-grid" onSubmit={crearUsuario}>
              <label>
                Nombres
                <input
                  type="text"
                  name="nombres"
                  value={nuevoUsuario.nombres}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Apellidos
                <input
                  type="text"
                  name="apellidos"
                  value={nuevoUsuario.apellidos}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                DNI
                <input
                  type="text"
                  name="dni"
                  value={nuevoUsuario.dni}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Correo institucional
                <input
                  type="email"
                  name="correo"
                  value={nuevoUsuario.correo}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Contraseña inicial
                <input
                  type="text"
                  name="password"
                  value={nuevoUsuario.password}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <label>
                Rol
                <select
                  name="rol"
                  value={nuevoUsuario.rol}
                  onChange={cambiarCampo}
                >
                  <option value="REVISOR">Revisor</option>
                  <option value="ADMIN_AREA">Admin de Área</option>
                  <option value="ADMIN_GENERAL">Admin General</option>
                </select>
              </label>

              <div className="admin-general-form-actions">
                <button type="submit" className="admin-general-primary-button">
                  Crear usuario
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="admin-general-filter-grid">
          <label>
            Filtrar por rol
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="TODOS">Todos los roles</option>
              <option value="USUARIO">Usuario</option>
              <option value="REVISOR">Revisor</option>
              <option value="ADMIN_AREA">Admin de Área</option>
              <option value="ADMIN_GENERAL">Admin General</option>
            </select>
          </label>

          <label>
            Filtrar por estado
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </label>

          <article>
            <div>
              <span>Solicitudes pendientes</span>
              <strong>
                {usuarios.filter((item) => item.estado === 'PENDIENTE').length}
              </strong>
            </div>
          </article>
        </section>

        <section className="admin-general-table-card">
          <div className="admin-general-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>DNI / Documento</th>
                  <th>Correo institucional</th>
                  <th>Rol</th>
                  <th>Fecha registro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="7">Cargando usuarios...</td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario}>
                      <td>
                        <strong>{usuario.nombres} {usuario.apellidos}</strong>
                        <small>{usuario.codigo_usuario}</small>
                      </td>

                      <td>{usuario.dni}</td>

                      <td>{usuario.correo}</td>

                      <td>
                        <span className="admin-general-role">
                          {limpiarRol(usuario.rol)}
                        </span>
                      </td>

                      <td>{formatearFecha(usuario.fecha_registro)}</td>

                      <td>
                        <span
                          className={`admin-general-user-state ${String(usuario.estado || '').toLowerCase()}`}
                        >
                          {usuario.estado}
                        </span>
                      </td>

                      <td>
                        <div className="admin-general-actions-row">
                          {usuario.estado === 'PENDIENTE' && (
                            <>
                              <button
                                type="button"
                                onClick={() => cambiarEstadoUsuario(usuario, 'ACTIVO')}
                              >
                                Verificar
                              </button>

                              <button
                                type="button"
                                onClick={() => cambiarEstadoUsuario(usuario, 'RECHAZADO')}
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {usuario.estado === 'ACTIVO' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstadoUsuario(usuario, 'SUSPENDIDO')}
                            >
                              Suspender
                            </button>
                          )}

                          {usuario.estado === 'SUSPENDIDO' && (
                            <button
                              type="button"
                              onClick={() => cambiarEstadoUsuario(usuario, 'ACTIVO')}
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-general-table-footer">
            Mostrando {usuarios.length} usuario(s)
          </div>
        </section>
      </section>
    </AdminGeneralLayout>
  );
}

export default AdminGeneralUsuarios;