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
import RevisorExpedienteDetalle from './roles/revisor/pages/RevisorExpedienteDetalle';
import RevisorDerivacionExitosa from './roles/revisor/pages/RevisorDerivacionExitosa';
import RevisorDerivarExpediente from './roles/revisor/pages/RevisorDerivarExpediente';

//admin-area
import AdminAreaSolicitudes from './roles/admin-area/pages/AdminAreaSolicitudes';
import AdminAreaExpedienteDetalle from './roles/admin-area/pages/AdminAreaExpedienteDetalle';
import AdminAreaConsultas from './roles/admin-area/pages/AdminAreaConsultas';

import AdminGeneralTramites from './roles/admin-general/pages/AdminGeneralTramites';
import AdminGeneralUsuarios from './roles/admin-general/pages/AdminGeneralUsuarios';

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
  path="/revisor/solicitudes/:idSolicitud"
  element={
    <ProtectedRoute rolPermitido="REVISOR">
      <RevisorExpedienteDetalle />
    </ProtectedRoute>
  }
/>

<Route
  path="/revisor/solicitudes/:idSolicitud/derivar"
  element={
    <ProtectedRoute rolPermitido="REVISOR">
      <RevisorDerivarExpediente />
    </ProtectedRoute>
  }
/>

<Route
  path="/revisor/derivacion-exitosa"
  element={
    <ProtectedRoute rolPermitido="REVISOR">
      <RevisorDerivacionExitosa />
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
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin-general/tramites"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralTramites />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-general/usuarios"
  element={
    <ProtectedRoute rolPermitido="ADMIN_GENERAL">
      <AdminGeneralUsuarios />
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


<Route
  path="/admin-area/solicitudes"
  element={
    <ProtectedRoute rolPermitido="ADMIN_AREA">
      <AdminAreaSolicitudes />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-area/solicitudes/:idSolicitud"
  element={
    <ProtectedRoute rolPermitido="ADMIN_AREA">
      <AdminAreaExpedienteDetalle />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin-area/consultas"
  element={
    <ProtectedRoute rolPermitido="ADMIN_AREA">
      <AdminAreaConsultas />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;