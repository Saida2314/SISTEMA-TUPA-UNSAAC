const express = require('express');

const {
  obtenerResumenRevisor,
  listarSolicitudesRevisor,
  obtenerDetalleSolicitudRevisor,
  cambiarEstadoSolicitud,
  observarSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  derivarSolicitud,
  verDocumentoSolicitud
} = require('../controllers/revisor.controller');

const router = express.Router();

router.get('/resumen', obtenerResumenRevisor);
router.get('/solicitudes', listarSolicitudesRevisor);
router.get('/solicitudes/:id_solicitud', obtenerDetalleSolicitudRevisor);

router.put('/solicitudes/:id_solicitud/estado', cambiarEstadoSolicitud);
router.post('/solicitudes/:id_solicitud/observar', observarSolicitud);
router.post('/solicitudes/:id_solicitud/aprobar', aprobarSolicitud);
router.post('/solicitudes/:id_solicitud/rechazar', rechazarSolicitud);
router.post('/solicitudes/:id_solicitud/derivar', derivarSolicitud);

router.get('/documentos/:id_documento/ver', verDocumentoSolicitud);

module.exports = router;