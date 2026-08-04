const express = require('express');

const {
  obtenerResumenRevisor,
  listarSolicitudesRevisor,
  obtenerDetalleSolicitudRevisor,
  cambiarEstadoSolicitud
} = require('../controllers/revisor.controller');

const router = express.Router();

router.get('/resumen', obtenerResumenRevisor);
router.get('/solicitudes', listarSolicitudesRevisor);
router.get('/solicitudes/:id_solicitud', obtenerDetalleSolicitudRevisor);
router.put('/solicitudes/:id_solicitud/estado', cambiarEstadoSolicitud);

module.exports = router;