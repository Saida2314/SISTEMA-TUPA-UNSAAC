import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  function passwordSegura(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    setMensaje('');

    if (!passwordSegura(nuevaPassword)) {
      setMensaje('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);

      await api.post('/auth/restablecer-password', {
        token,
        nuevaPassword
      });

      alert('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'Error al restablecer contraseña');
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
            Cree una nueva contraseña para recuperar el acceso a su cuenta.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <span>🔐</span>
              <strong>Nueva clave</strong>
              <small>Use una contraseña segura y personal.</small>
            </div>

            <div className="auth-feature-card">
              <span>✓</span>
              <strong>Acceso restaurado</strong>
              <small>Luego podrá iniciar sesión normalmente.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={cambiarPassword}>
          <h2>Nueva clave</h2>

          <p>
            Ingrese y confirme su nueva contraseña para actualizar el acceso al sistema.
          </p>

          <label className="auth-label">Nueva Contraseña</label>

          <div className="password-box">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? '🙈' : '👁'}
            </button>
          </div>

          <small className="auth-help">
            Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.
          </small>

          <label className="auth-label">Confirmar Contraseña</label>

          <div className="password-box reset-confirm-box">
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />
          </div>

          {mensaje && <p className="auth-error">{mensaje}</p>}

          <button className="auth-submit" type="submit" disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Actualizar contraseña →'}
          </button>

          <p className="auth-switch">
            Volver a <Link to="/login">Iniciar Sesión</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default ResetPassword;