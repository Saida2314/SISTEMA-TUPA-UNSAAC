# SISTEMA TUPA UNSAAC

Sistema web para la gestión de trámites administrativos del TUPA de la Universidad Nacional de San Antonio Abad del Cusco.

El proyecto permite consultar trámites, registrar solicitudes, validar pagos, subir documentos, revisar expedientes, derivarlos al área correspondiente, atender consultas de soporte y administrar usuarios según roles.

---

## Tecnologías utilizadas

### Frontend
- React
- Vite
- React Router DOM
- Axios
- CSS personalizado

### Backend
- Node.js
- Express
- mssql
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- multer
- pdfkit

### Base de datos

- SQL Server Express
- SQL Server Management Studio 21
- Base de datos: `SistemaTupaUnsaac`

### Pruebas
- Jest
- Supertest
- cross-env
---

## Estructura general del proyecto
```txt
SISTEMA-TUPA/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── assets/
│   ├── tests/
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── jest.config.js
│
└── frontend/
    ├── public/
    │   └── images/
    ├── src/
    │   ├── auth/
    │   ├── components/
    │   ├── layouts/
    │   ├── public/
    │   ├── roles/
    │   ├── services/
    │   ├── styles/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

# Instalación del Backend

Entrar a la carpeta del backend:

```bash
cd backend
```
Instalar dependencias principales:
```bash
npm install express cors dotenv mssql bcryptjs jsonwebtoken
```
Instalar dependencias para archivos y PDF:

```bash
npm install multer pdfkit
```
Instalar dependencias de desarrollo:

```bash
npm install --save-dev nodemon jest supertest cross-env
```

---

## Configuración de la base de datos

El backend se conecta a SQL Server mediante el archivo:

```txt
backend/src/config/db.js
```

La configuración se toma desde el archivo `.env`.

Crear el archivo:

```txt
backend/.env
```

con la siguiente estructura:

```env
PORT=3001

DB_USER=user
DB_PASSWORD="tu_password"
DB_SERVER=server
DB_DATABASE=SistemaTupaUnsaac
DB_INSTANCE=instance

JWT_SECRET=sistema_tupa_unsaac_secret
JWT_EXPIRES=8h
```

Datos usados en el entorno local:

```txt
Servidor: LAPTOP-GPFLMN5S
Instancia: SQLEXPRESS1
Base de datos: SistemaTupaUnsaac
Autenticación: SQL Server
Contraseña: *********
Usuario: sa
```

El archivo de conexión usa el paquete `mssql` para crear un pool de conexión con SQL Server.

---

## Archivo de conexión a SQL Server

Ubicación:

```txt
backend/src/config/db.js
```

Este archivo realiza la conexión usando los datos del `.env`:

```js
const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    instanceName: process.env.DB_INSTANCE,
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Conectado a SQL Server");
    console.log("Servidor:", process.env.DB_SERVER);
    console.log("Instancia:", process.env.DB_INSTANCE);
    console.log("Base de datos:", process.env.DB_DATABASE);
    return pool;
  })
  .catch((err) => {
    console.error("Error de conexión a SQL Server:");
    console.error(err.message);
    throw err;
  });

module.exports = { sql, poolPromise };
```

---

## Scripts del backend

En `backend/package.json` se utilizan los siguientes comandos:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "cross-env NODE_ENV=test jest --runInBand",
    "test:watch": "cross-env NODE_ENV=test jest --watch"
  }
}
```

---

## Ejecutar backend en desarrollo

```bash
cd backend
npm run dev
```

El servidor se ejecuta en:

```txt
http://localhost:3001
```

Ruta principal de prueba:

```txt
http://localhost:3001
```

Respuesta esperada:

```json
{
  "mensaje": "API del Sistema TUPA UNSAAC funcionando correctamente"
}
```

---

# Instalación del Frontend

Entrar a la carpeta del frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Dependencias principales usadas:

```bash
npm install axios react-router-dom@6.30.1
```

---

## Configuración del servicio API

Ubicación:

```txt
frontend/src/services/api.js
```

El frontend se conecta al backend mediante Axios:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
```

---

## Ejecutar frontend en desarrollo

```bash
cd frontend
npm run dev
```

La aplicación se ejecuta en:

```txt
http://localhost:5173
```

---

# Rutas principales del sistema

## Rutas públicas

```txt
/
/tramites
/tramites/:id
/login
/registro
/recuperar-password
/restablecer-password/:token
```

## Usuario

```txt
/usuario
/usuario/tramites
/usuario/tramites/:id
/usuario/solicitudes
/usuario/solicitudes/:idSolicitud
/usuario/soporte
/usuario/soporte/tickets
```

## Revisor

```txt
/revisor
/revisor/bandeja
/revisor/solicitudes/:idSolicitud
/revisor/solicitudes/:idSolicitud/derivar
/revisor/derivacion-exitosa
```

## Administrador de Área

```txt
/admin-area
/admin-area/solicitudes
/admin-area/solicitudes/:idSolicitud
/admin-area/consultas
```

## Administrador General

```txt
/admin-general
/admin-general/tramites
/admin-general/usuarios
/admin-general/crear-perfil
```

---

# Endpoints principales del backend

## Autenticación

```txt
POST /api/auth/registro
POST /api/auth/login
POST /api/auth/recuperar-password
POST /api/auth/restablecer-password
```

## Público

```txt
GET /api/public/tramites
GET /api/public/tramites/:id
```

## Solicitudes

```txt
GET /api/solicitudes
POST /api/solicitudes
GET /api/solicitudes/:idSolicitud
```

## Pagos

```txt
POST /api/pagos/generar
POST /api/pagos/validar
```

## Revisor

```txt
GET /api/revisor/resumen
GET /api/revisor/solicitudes
GET /api/revisor/solicitudes/:id_solicitud
PUT /api/revisor/solicitudes/:id_solicitud/estado
POST /api/revisor/solicitudes/:id_solicitud/observar
POST /api/revisor/solicitudes/:id_solicitud/rechazar
POST /api/revisor/solicitudes/:id_solicitud/derivar
```

## Admin Área

```txt
GET /api/admin-area/resumen
GET /api/admin-area/solicitudes
GET /api/admin-area/solicitudes/:id_solicitud
PUT /api/admin-area/solicitudes/:id_solicitud/tomar-validacion
POST /api/admin-area/solicitudes/:id_solicitud/archivos
POST /api/admin-area/solicitudes/:id_solicitud/mensaje-recojo
POST /api/admin-area/solicitudes/:id_solicitud/finalizar
GET /api/admin-area/tickets
```

## Admin General

```txt
GET /api/admin-general/panel
GET /api/admin-general/categorias
GET /api/admin-general/tramites
POST /api/admin-general/tramites
PUT /api/admin-general/tramites/:id_tramite
GET /api/admin-general/usuarios
POST /api/admin-general/usuarios
PUT /api/admin-general/usuarios/:id_usuario/estado
```

---

# Pruebas del sistema

El proyecto usa Jest y Supertest para verificar rutas, conexión con SQL Server y procesos principales.

Configuración:

```txt
backend/jest.config.js
```

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

Archivo de cierre de conexión:

```txt
backend/tests/setup.js
```

```js
const { sql } = require('../src/config/db');

afterAll(async () => {
  await sql.close();
});
```

Ejecutar pruebas:

```bash
cd backend
npm test
```

Ejecutar una prueba específica:

```bash
npm test -- 02-auth.test.js
```

---

# Pruebas implementadas

Se agregaron pruebas para verificar:

```txt
Conexión a SQL Server
Existencia de tablas principales
Existencia de roles
Registro de usuario
Login de usuario
Listado de trámites públicos
Panel de Administrador General
Listado de usuarios
Listado de trámites administrativos
Rutas de Revisor
Rutas de Admin Área
Tickets de soporte
```

---

# Compilación del frontend

Antes de compilar, se recomienda ejecutar las pruebas del backend:

```bash
cd backend
npm test
```

Luego compilar el frontend:

```bash
cd frontend
npm run build
```

La carpeta generada será:

```txt
frontend/dist
```

---

# Recomendación de ejecución

Para iniciar el proyecto completo en desarrollo:

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Luego abrir:

```txt
http://localhost:5173
```
---

# Observaciones importantes

- El backend debe estar encendido antes de usar el frontend.
- SQL Server debe estar activo.
- La base de datos debe llamarse `SistemaTupaUnsaac`.
- El usuario `sa` debe tener permisos sobre la base de datos.
- Las credenciales reales no deben subirse a GitHub.
- El archivo `.env` debe estar incluido en `.gitignore`.
- Los roles deben existir previamente en la tabla `roles`.
- Las rutas protegidas usan token JWT almacenado en `localStorage`.

---


