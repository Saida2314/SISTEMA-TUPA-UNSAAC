const express = require('express');
const multer = require('multer');
const path = require('path');

const {
  crearSolicitud,
  listarMisSolicitudes,
  obtenerDetalleSolicitud,
  descargarConstancia
} = require('../controllers/solicitudes.controller');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/solicitudes');
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const nombreBase = path.basename(file.originalname, extension);

    const nombreSeguro = nombreBase
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');

    cb(null, `${Date.now()}-${nombreSeguro}${extension}`);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG o PNG.'));
    }
  }
});

router.post(
  '/',
  upload.fields([
    { name: 'documentos', maxCount: 10 },
    { name: 'voucher', maxCount: 1 }
  ]),
  function (req, res, next) {
    req.files = [
      ...(req.files.documentos || []),
      ...(req.files.voucher || [])
    ];

    next();
  },
  crearSolicitud
);

router.get('/usuario/:id_usuario', listarMisSolicitudes);

router.get('/:id_solicitud', obtenerDetalleSolicitud);

router.get('/:id_solicitud/constancia', descargarConstancia);

module.exports = router;