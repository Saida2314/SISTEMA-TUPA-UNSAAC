const express = require('express');

const {
  obtenerPanelAdminGeneral,
  listarCategorias,
  listarTramitesAdmin,
  crearTramiteAdmin,
  actualizarTramiteAdmin,
  cambiarEstadoTramiteAdmin,
  listarUsuariosAdmin,
  crearUsuarioAdmin,
  cambiarEstadoUsuarioAdmin
} = require('../controllers/adminGeneral.controller');

const router = express.Router();

router.get('/panel', obtenerPanelAdminGeneral);

router.get('/categorias', listarCategorias);

router.get('/tramites', listarTramitesAdmin);
router.post('/tramites', crearTramiteAdmin);
router.put('/tramites/:id_tramite', actualizarTramiteAdmin);
router.put('/tramites/:id_tramite/estado', cambiarEstadoTramiteAdmin);

router.get('/usuarios', listarUsuariosAdmin);
router.post('/usuarios', crearUsuarioAdmin);
router.put('/usuarios/:id_usuario/estado', cambiarEstadoUsuarioAdmin);

module.exports = router;