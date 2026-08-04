import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function ForgotPassword() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [linkPrueba, setLinkPrueba] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviarSolicitud(e) {
    e.preventDefault();
    setMensaje('');
    setLinkPrueba('');

    try {
      setCargando(true);

      const response = await api.post('/auth/recuperar-password', {
        correo
      });

      setMensaje(response.data.mensaje);

      if (response.data.linkRecuperacion) {
        setLinkPrueba(response.data.linkRecuperacion);
      }
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'Error al solicitar recuperación');
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
            Recupera el acceso a tu cuenta institucional de forma segura.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <span>✉</span>
              <strong>Correo seguro</strong>
              <small>Enviaremos un enlace de recuperación.</small>
            </div>

            <div className="auth-feature-card">
              <span>🛡</span>
              <strong>Enlace temporal</strong>
              <small>El enlace tendrá una duración limitada.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={enviarSolicitud}>
          <h2>Recuperar Contraseña</h2>

          <p>
            Ingrese su correo institucional. Le enviaremos un enlace para crear una nueva contraseña.
          </p>

          <label className="auth-label">Correo Institucional</label>

          <input
            className="auth-input"
            type="email"
            placeholder="usuario@unsaac.edu.pe"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          {mensaje && <p className="auth-info">{mensaje}</p>}

          {linkPrueba && (
            <div className="dev-link-box">
              <strong>Link de prueba:</strong>
              <Link to={linkPrueba.replace('http://localhost:5173', '')}>
                Abrir enlace de recuperación
              </Link>
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar enlace →'}
          </button>

          <p className="auth-switch">
            ¿Recordaste tu contraseña? <Link to="/login">Iniciar Sesión</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default ForgotPassword;