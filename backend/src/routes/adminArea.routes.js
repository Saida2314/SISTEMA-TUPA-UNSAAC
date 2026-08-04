const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  obtenerResumenAdminArea,
  listarSolicitudesAdminArea,
  obtenerDetalleSolicitudAdminArea,
  tomarEnValidacionArea,
  subirArchivoArea,
  enviarMensajeRecojo,
  finalizarTramite,
  verDocumentoAdminArea,
  verArchivoArea
} = require('../controllers/adminArea.controller');

const router = express.Router();

const carpetaUploads = path.join(process.cwd(), 'uploads', 'admin-area');

if (!fs.existsSync(carpetaUploads)) {
  fs.mkdirSync(carpetaUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, carpetaUploads);
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
    fileSize: 8 * 1024 * 1024
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

router.get('/resumen', obtenerResumenAdminArea);
router.get('/solicitudes', listarSolicitudesAdminArea);
router.get('/solicitudes/:id_solicitud', obtenerDetalleSolicitudAdminArea);

router.put('/solicitudes/:id_solicitud/tomar-validacion', tomarEnValidacionArea);

router.post(
  '/solicitudes/:id_solicitud/archivos',
  upload.single('archivo'),
  subirArchivoArea
);

router.post('/solicitudes/:id_solicitud/mensaje-recojo', enviarMensajeRecojo);
router.post('/solicitudes/:id_solicitud/finalizar', finalizarTramite);

router.get('/documentos/:id_documento/ver', verDocumentoAdminArea);
router.get('/archivos/:id_archivo_area/ver', verArchivoArea);

module.exports = router;