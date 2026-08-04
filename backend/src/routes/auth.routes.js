const express = require("express");
const router = express.Router();

const {
  login,
  registrarUsuario,
  solicitarRecuperacionPassword,
  restablecerPassword
} = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/registro", registrarUsuario);
router.post("/recuperar-password", solicitarRecuperacionPassword);
router.post("/restablecer-password", restablecerPassword);

module.exports = router;