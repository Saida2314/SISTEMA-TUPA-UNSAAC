import { Routes, Route, Navigate } from 'react-router-dom';

import PublicHome from './public/pages/PublicHome';
import PublicCatalog from './public/pages/PublicCatalog';
import ProcedureDetail from './public/pages/ProcedureDetail';

import Login from './auth/pages/Login';
import Register from './auth/pages/Register';
import ForgotPassword from './auth/pages/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword';

import UsuarioDashboard from './roles/usuario/pages/UsuarioDashboard';
import RevisorDashboard from './roles/revisor/pages/RevisorDashboard';
import AdminGeneralDashboard from './roles/admin-general/pages/AdminGeneralDashboard';
import AdminAreaDashboard from './roles/admin-area/pages/AdminAreaDashboard';

import CreateProfile from './roles/admin-general/pages/CreateProfile';

//usuarios 
import UsuarioTramites from './roles/usuario/pages/UsuarioTramites';
import UsuarioTramiteDetalle from './roles/usuario/pages/UsuarioTramiteDetalle';
import UsuarioTramiteDocumentos from './roles/usuario/pages/UsuarioTramiteDocumentos';
import UsuarioTramiteConfirmacion from './roles/usuario/pages/UsuarioTramiteConfirmacion';
import UsuarioSolicitudes from './roles/usuario/pages/UsuarioSolicitudes';
import UsuarioSoporte from './roles/usuario/pages/UsuarioSoporte';
import UsuarioTicket from './roles/usuario/pages/UsuarioTicket';
import UsuarioSolicitudDetalle from './roles/usuario/pages/UsuarioSolicitudDetalle';

import UsuarioMisTickets from './roles/usuario/pages/UsuarioMisTickets';
import UsuarioTicketConversacion from './roles/usuario/pages/UsuarioTicketConversacion';

//revisor
import RevisorBandeja from './roles/revisor/pages/RevisorBandeja';


import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/tramites" element={<PublicCatalog />} />
      <Route path="/tramites/:id" element={<ProcedureDetail />} />

      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar-password" element={<ForgotPassword />} />
      <Route path="/restablecer-password/:token" element={<ResetPassword />} />

      <Route
        path="/usuario"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/tramites"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTramites />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/tramites/:id"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTramiteDetalle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/tramites/:id/documentos"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTramiteDocumentos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/tramites/:id/confirmacion"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTramiteConfirmacion />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/solicitudes"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioSolicitudes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/soporte"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioSoporte />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/soporte/ticket"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/solicitudes/:idSolicitud"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioSolicitudDetalle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuario/soporte/tickets"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioMisTickets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuario/soporte/tickets/:idTicket"
        element={
          <ProtectedRoute rolPermitido="USUARIO">
            <UsuarioTicketConversacion />
          </ProtectedRoute>
        }
      />




      <Route
        path="/revisor"
        element={
          <ProtectedRoute rolPermitido="REVISOR">
            <RevisorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
  path="/revisor/bandeja"
  element={
    <ProtectedRoute rolPermitido="REVISOR">
      <RevisorBandeja />
    </ProtectedRoute>
  }
/>


      <Route
        path="/admin-general"
        element={
          <ProtectedRoute rolPermitido="ADMIN_GENERAL">
            <AdminGeneralDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-general/crear-perfil"
        element={
          <ProtectedRoute rolPermitido="ADMIN_GENERAL">
            <CreateProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-area"
        element={
          <ProtectedRoute rolPermitido="ADMIN_AREA">
            <AdminAreaDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;