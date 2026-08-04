import { useNavigate } from 'react-router-dom';

function AdminAreaDashboard() {
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
          <h1>Panel Administrador de Área</h1>
          <p>
            Bienvenido {usuario?.nombres || 'Administrador de Área'}, desde aquí
            podrás validar expedientes derivados y finalizar trámites.
          </p>
        </div>

        <button type="button" className="logout-button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}

export default AdminAreaDashboard;