import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import './styles/global.css';

import './public/styles/public-base.css';
import './public/styles/public-home.css';
import './public/styles/public-catalog.css';
import './public/styles/procedure-detail.css';

import './auth/styles/auth.css';

import './roles/usuario/styles/usuario.css';
import './roles/revisor/styles/revisor.css';
import './roles/admin-general/styles/admin-general.css';
import './roles/admin-area/styles/admin-area.css';
import './roles/admin-general/styles/admin-general.css';
import './roles/admin-general/styles/admin-general.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);