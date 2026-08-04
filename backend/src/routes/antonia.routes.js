const express = require('express');

const {
  iniciarConversacion,
  obtenerMensajes,
  enviarMensaje,
  cerrarConversacion
} = require('../controllers/antonia.controller');

const router = express.Router();

router.post('/iniciar', iniciarConversacion);
router.get('/conversaciones/:id_conversacion/mensajes', obtenerMensajes);
router.post('/mensaje', enviarMensaje);
router.put('/conversaciones/:id_conversacion/cerrar', cerrarConversacion);

module.exports = router;