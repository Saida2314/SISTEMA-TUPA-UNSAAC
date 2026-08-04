const express = require('express');

const {
  crearTicket,
  listarTicketsUsuario,
  obtenerTicket,
  enviarMensajeTicket,
  cerrarTicket,
  responderComoEncargado
} = require('../controllers/soporte.controller');

const router = express.Router();

router.post('/tickets', crearTicket);
router.get('/tickets/usuario/:id_usuario', listarTicketsUsuario);
router.get('/tickets/:id_ticket', obtenerTicket);
router.post('/tickets/:id_ticket/mensajes', enviarMensajeTicket);
router.put('/tickets/:id_ticket/cerrar', cerrarTicket);

router.post('/tickets/:id_ticket/responder-encargado', responderComoEncargado);

module.exports = router;