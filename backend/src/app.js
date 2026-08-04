const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const pagosRoutes = require('./routes/pagos.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const antoniaRoutes = require('./routes/antonia.routes');
const soporteRoutes = require('./routes/soporte.routes');
const revisorRoutes = require('./routes/revisor.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del Sistema TUPA UNSAAC funcionando correctamente'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/antonia', antoniaRoutes);
app.use('/api/soporte', soporteRoutes);

app.use('/api/revisor', revisorRoutes);

module.exports = app;