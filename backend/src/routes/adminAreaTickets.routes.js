const express = require('express');

const {
  listarTicketsAdminArea,
  obtenerTicketAdminArea,
  responderTicketAdminArea,
  finalizarAtencionTicket
} = require('../controllers/adminAreaTickets.controller');

const router = express.Router();

router.get('/tickets', listarTicketsAdminArea);
router.get('/tickets/:id_ticket', obtenerTicketAdminArea);
router.post('/tickets/:id_ticket/responder', responderTicketAdminArea);
router.put('/tickets/:id_ticket/finalizar', finalizarAtencionTicket);

module.exports = router;