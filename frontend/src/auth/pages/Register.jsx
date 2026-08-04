import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

function Register() {
  const navigate = useNavigate();

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  function validarFormulario() {
    if (
      !nombres.trim() ||
      !apellidos.trim() ||
      !dni.trim() ||
      !correo.trim() ||
      !password.trim()
    ) {
      return 'Todos los campos son obligatorios.';
    }

    if (nombres.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres.';
    }

    if (apellidos.trim().length < 2) {
      return 'El apellido debe tener al menos 2 caracteres.';
    }

    if (!/^[0-9]{8}$/.test(dni)) {
      return 'El DNI debe tener exactamente 8 dígitos numéricos.';
    }

    if (!/^[a-zA-Z0-9._%+-]+@unsaac\.edu\.pe$/.test(correo.trim())) {
      return 'Debe usar un correo institucional válido: usuario@unsaac.edu.pe';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
    }

    if (!aceptaTerminos) {
      return 'Debes aceptar los términos y condiciones para registrarte.';
    }

    return '';
  }

  async function registrar(e) {
    e.preventDefault();

    setMensaje('');
    setTipoMensaje('');

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensaje(errorValidacion);
      setTipoMensaje('error');
      return;
    }

    try {
      setCargando(true);

      await api.post('/auth/registro', {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        dni: dni.trim(),
        correo: correo.trim().toLowerCase(),
        password
      });

      setMensaje('Usuario registrado correctamente. Ahora puede iniciar sesión con sus credenciales.');
      setTipoMensaje('success');

      setNombres('');
      setApellidos('');
      setDni('');
      setCorreo('');
      setPassword('');
      setAceptaTerminos(false);

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'Error al registrar usuario');
      setTipoMensaje('error');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo-circle">
            <span>▦</span>
          </div>

          <h1>TUPA UNSAAC</h1>

          <p>
            Modernización administrativa para la excelencia académica.
            Registra tu acceso al sistema de procedimientos administrativos.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <span>◴</span>
              <strong>Gestión Ágil</strong>
              <small>Trámites digitalizados al 100%.</small>
            </div>

            <div className="auth-feature-card">
              <span>▣</span>
              <strong>Seguridad</strong>
              <small>Protección total de sus datos.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={registrar}>
          <h2>Registrarse</h2>

          <p>
            Cree su cuenta de usuario para realizar trámites en línea.
          </p>

          <label className="auth-label">Tipo de cuenta</label>

          <div className="role-selector one-role">
            <button type="button" className="active">
              <span>👤</span>
              Usuario
            </button>
          </div>

          <div className="auth-two-columns">
            <div>
              <label className="auth-label">Nombres</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Ingrese sus nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
              />
            </div>

            <div>
              <label className="auth-label">Apellidos</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Ingrese sus apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>
          </div>

          <label className="auth-label">DNI</label>

          <input
            className="auth-input"
            type="text"
            placeholder="Ingrese su DNI"
            maxLength="8"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
          />

          <label className="auth-label">Correo Institucional</label>

          <input
            className="auth-input"
            type="email"
            placeholder="usuario@unsaac.edu.pe"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label className="auth-label">Contraseña</label>

          <div className="password-box">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? '/' : '👁'}
            </button>
          </div>

          <small className="auth-help">
            Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.
          </small>

          <label className="terms-row">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />

            <span>
              Acepto los <strong>Términos y Condiciones</strong> y la{' '}
              <strong>Política de Privacidad</strong>.
            </span>
          </label>

          {mensaje && (
            <p className={tipoMensaje === 'success' ? 'auth-info' : 'auth-error'}>
              {mensaje}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Crear Cuenta →'}
          </button>

          <p className="auth-switch">
            ¿Ya tienes una cuenta? <Link to="/login">Iniciar Sesión</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Register;