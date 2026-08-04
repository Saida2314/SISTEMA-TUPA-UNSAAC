import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

function CreateProfile() {
  const [rol, setRol] = useState('REVISOR');

  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    correo: '',
    password: '',
    confirmarPassword: '',
    confirmado: false
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const esRevisor = rol === 'REVISOR';

  function actualizarCampo(e) {
    const { name, value, type, checked } = e.target;

    setFormulario({
      ...formulario,
      [name]: type === 'checkbox' ? checked : value
    });
  }

  function validarFormulario() {
    setError('');
    setMensaje('');

    if (
      !formulario.nombres.trim() ||
      !formulario.apellidos.trim() ||
      !formulario.dni.trim() ||
      !formulario.correo.trim() ||
      !formulario.password.trim() ||
      !formulario.confirmarPassword.trim()
    ) {
      setError('Complete todos los campos obligatorios.');
      return false;
    }

    if (!/^[0-9]{8}$/.test(formulario.dni)) {
      setError('El DNI debe contener exactamente 8 dígitos.');
      return false;
    }

    if (!/^[a-zA-Z0-9._%+-]+@unsaac\.edu\.pe$/.test(formulario.correo)) {
      setError('Ingrese un correo institucional válido: usuario@unsaac.edu.pe');
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formulario.password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.');
      return false;
    }

    if (formulario.password !== formulario.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }

    if (!formulario.confirmado) {
      setError('Debe confirmar que la información ingresada es correcta.');
      return false;
    }

    return true;
  }

  async function enviarFormulario(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setCargando(true);

      await api.post('/admin/crear-perfil', {
        rol,
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        dni: formulario.dni.trim(),
        correo: formulario.correo.trim(),
        password: formulario.password
      });

      setMensaje(
        esRevisor
          ? 'Perfil Revisor creado correctamente.'
          : 'Perfil Administrador de Área creado correctamente.'
      );

      setFormulario({
        nombres: '',
        apellidos: '',
        dni: '',
        correo: '',
        password: '',
        confirmarPassword: '',
        confirmado: false
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.mensaje ||
          'No se pudo crear el perfil. Verifique los datos ingresados.'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="create-profile-page">
      <section className="create-profile-left">
        <Link to="/admin-general" className="exit-profile-link">
          ↩ Salir de esta ventana
        </Link>

        <div className="profile-brand-box">
          <div className="profile-logo-box">▰</div>

          <h1>TUPA UNSAAC</h1>

          <p>
            Modernización administrativa para la excelencia académica.
            Gestión centralizada de perfiles y roles institucionales.
          </p>

          <div className="profile-benefits">
            {esRevisor ? (
              <>
                <div className="profile-benefit-card">
                  <span>▣</span>
                  <div>
                    <strong>Revisión Eficiente</strong>
                    <small>Optimice el flujo de aprobación de documentos administrativos.</small>
                  </div>
                </div>

                <div className="profile-benefit-card">
                  <span>▥</span>
                  <div>
                    <strong>Seguimiento de Trámites</strong>
                    <small>Control total sobre el estado y trazabilidad de cada expediente.</small>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="profile-benefit-card">
                  <span>▣</span>
                  <div>
                    <strong>Gestión Integral</strong>
                    <small>Centralización de trámites y expedientes digitales al 100%.</small>
                  </div>
                </div>

                <div className="profile-benefit-card">
                  <span>⚿</span>
                  <div>
                    <strong>Control de Accesos</strong>
                    <small>Seguridad y auditoría granular para cada rol administrativo.</small>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="profile-footer">© 2024 UNSAAC TUPA</p>
      </section>

      <section className="create-profile-right">
        <form className="create-profile-form" onSubmit={enviarFormulario}>
          <h2>
            Crear Perfil: {esRevisor ? 'Revisor' : 'Administrador de Área'}
          </h2>

          <p>
            {esRevisor
              ? 'Complete la información para habilitar el acceso al sistema administrativo.'
              : 'Complete la información requerida para otorgar credenciales de gestión.'}
          </p>

          <label className="profile-label">Seleccione su Rol</label>

          <div className="profile-role-selector">
            <button
              type="button"
              className={rol === 'REVISOR' ? 'active' : ''}
              onClick={() => setRol('REVISOR')}
            >
              <span>▣</span>
              Revisor
            </button>

            <button
              type="button"
              className={rol === 'ADMIN_AREA' ? 'active' : ''}
              onClick={() => setRol('ADMIN_AREA')}
            >
              <span>🛡</span>
              Admin Área
            </button>
          </div>

          <div className="profile-two-columns">
            <div>
              <label className="profile-label">Nombres</label>
              <input
                name="nombres"
                value={formulario.nombres}
                onChange={actualizarCampo}
                placeholder="Ej. Juan"
                className="profile-input"
              />
            </div>

            <div>
              <label className="profile-label">Apellidos</label>
              <input
                name="apellidos"
                value={formulario.apellidos}
                onChange={actualizarCampo}
                placeholder="Ej. Pérez Quispe"
                className="profile-input"
              />
            </div>
          </div>

          <div className="profile-two-columns">
            <div>
              <label className="profile-label">DNI / Documento</label>
              <input
                name="dni"
                value={formulario.dni}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '');
                  setFormulario({
                    ...formulario,
                    dni: soloNumeros.slice(0, 8)
                  });
                }}
                placeholder="8 dígitos"
                className="profile-input"
              />
            </div>

            <div>
              <label className="profile-label">Correo Institucional</label>
              <input
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={actualizarCampo}
                placeholder="usuario@unsaac.edu.pe"
                className="profile-input"
              />
            </div>
          </div>

          <div className="profile-two-columns">
            <div>
              <label className="profile-label">Contraseña</label>

              <div className="profile-password-box">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  value={formulario.password}
                  onChange={actualizarCampo}
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                >
                  👁
                </button>
              </div>
            </div>

            <div>
              <label className="profile-label">Confirmar Contraseña</label>

              <div className="profile-password-box">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  name="confirmarPassword"
                  value={formulario.confirmarPassword}
                  onChange={actualizarCampo}
                />

                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                >
                  👁
                </button>
              </div>
            </div>
          </div>

          <small className="profile-help">
            Mínimo 8 caracteres incluyendo números, mayúsculas y caracteres especiales.
          </small>

          <label className="profile-confirm-row">
            <input
              type="checkbox"
              name="confirmado"
              checked={formulario.confirmado}
              onChange={actualizarCampo}
            />
            <span>
              Confirmo que la información ingresada es correcta y veraz.
            </span>
          </label>

          {error && <div className="profile-error">{error}</div>}
          {mensaje && <div className="profile-success">{mensaje}</div>}

          <button type="submit" className="profile-submit" disabled={cargando}>
            {cargando
              ? 'Creando perfil...'
              : 'Crear y enviar credenciales al correo  ▻'}
          </button>

          <div className="profile-bottom-links">
            <span>© 2024 UNSAAC TUPA</span>

            <div>
              <a>Ayuda</a>
              <a>Normatividad</a>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreateProfile;