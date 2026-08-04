import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

function Login() {
  const navigate = useNavigate();

  const [rolSeleccionado, setRolSeleccionado] = useState('USUARIO');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(e) {
    e.preventDefault();
    setMensaje('');

    if (!aceptaTerminos) {
      setMensaje('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    try {
      setCargando(true);

      const response = await api.post('/auth/login', {
        correo,
        password,
        rolSeleccionado
      });

      const { token, usuario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      if (usuario.rol === 'USUARIO') {
        navigate('/usuario');
      } else if (usuario.rol === 'REVISOR') {
        navigate('/revisor');
      } else if (usuario.rol === 'ADMIN_GENERAL') {
        navigate('/admin-general');
      } else if (usuario.rol === 'ADMIN_AREA') {
        navigate('/admin-area');
      } else {
        navigate('/');
      }
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'Error al iniciar sesión');
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
            Accede al Texto Único de Procedimientos Administrativos.
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
        <form className="auth-form" onSubmit={iniciarSesion}>
          <h2>Acceso</h2>
          <p>Complete sus datos para acceder al sistema administrativo.</p>

          <label className="auth-label">Seleccione su Rol</label>

          <div className="role-selector">
            <button
              type="button"
              className={rolSeleccionado === 'USUARIO' ? 'active' : ''}
              onClick={() => setRolSeleccionado('USUARIO')}
            >
              <span>👤</span>
              Usuario
            </button>

            <button
              type="button"
              className={rolSeleccionado === 'REVISOR' ? 'active' : ''}
              onClick={() => setRolSeleccionado('REVISOR')}
            >
              <span>☑</span>
              Revisor
            </button>

            <button
              type="button"
              className={rolSeleccionado === 'ADMIN' ? 'active' : ''}
              onClick={() => setRolSeleccionado('ADMIN')}
            >
              <span>🛡</span>
              Admin
            </button>
          </div>

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
              {mostrarPassword ? '🙈' : '👁'}
            </button>
          </div>

          <small className="auth-help">
            Mínimo 8 caracteres con números y símbolos.
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

          {mensaje && <p className="auth-error">{mensaje}</p>}

          <div className="forgot-password-row">
             <Link to="/recuperar-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button className="auth-submit" type="submit" disabled={cargando}>
            {cargando ? 'Accediendo...' : 'Acceder →'}
          </button>

          <p className="auth-switch">
            ¿No tienes una cuenta? <Link to="/registro">Crear Cuenta</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;