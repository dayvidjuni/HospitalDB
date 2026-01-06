const express = require('express');
const router = express.Router();
const AtencionController = require('../controllers/AtencionController');

// Atención Médica
router.post('/', AtencionController.registrarAtencion);
router.get('/:cita_id', AtencionController.getAtencionByCita); // Get atencion info by cita_id

// Recetas
router.post('/recetas', AtencionController.generarReceta);
router.get('/recetas/:id', AtencionController.getRecetaById); // Get by Receta ID
router.get('/cita/:cita_id/receta', AtencionController.getRecetaByCita); // Get by Cita ID

module.exports = router;
