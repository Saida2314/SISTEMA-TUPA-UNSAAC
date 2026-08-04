import { Link, useNavigate } from 'react-router-dom';

function AdminGeneralDashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <main className="role-page">
      <div className="role-header">
        <div>
          <h1>Panel Administrador General</h1>
          <p>
            Bienvenido {usuario?.nombres || 'Administrador'}, desde aquí podrás
            gestionar usuarios, trámites, dependencias y reportes.
          </p>
        </div>

        <button type="button" className="logout-button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      <div className="role-actions">
        <Link to="/admin-general/crear-perfil" className="role-action-card">
          Crear Revisor o Admin de Área
        </Link>
      </div>
    </main>
  );
}

export default AdminGeneralDashboard;