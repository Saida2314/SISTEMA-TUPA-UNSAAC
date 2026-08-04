import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, rolPermitido }) {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

  if (!token || !usuario) {
    return <Navigate to="/login" />;
  }

  if (usuario.rol !== rolPermitido) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;