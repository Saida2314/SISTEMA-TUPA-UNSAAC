const express = require('express');

const {
  generarPago,
  validarPago
} = require('../controllers/pagos.controller');

const router = express.Router();

router.post('/generar', generarPago);
router.post('/validar', validarPago);

module.exports = router;