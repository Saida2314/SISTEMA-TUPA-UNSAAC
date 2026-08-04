const express = require('express');

const {
  login,
  registrar,
  recuperarPassword,
  restablecerPassword
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', login);
router.post('/registro', registrar);
router.post('/recuperar-password', recuperarPassword);
router.post('/restablecer-password', restablecerPassword);
router.post('/restablecer-password/:token', restablecerPassword);

module.exports = router;