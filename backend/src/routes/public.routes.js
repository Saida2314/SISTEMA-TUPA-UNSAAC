const express = require("express");
const router = express.Router();

const {
  listarTramitesPublicos,
  obtenerTramitePublico
} = require("../controllers/public.controller");

router.get("/tramites", listarTramitesPublicos);
router.get("/tramites/:id", obtenerTramitePublico);

module.exports = router;