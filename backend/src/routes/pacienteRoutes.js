const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/PacienteController');

router.post('/', PacienteController.create);
router.get('/', PacienteController.getAll);
router.get('/:id', PacienteController.getById);
router.get('/:id/historial', PacienteController.getHistorial);
router.get('/persona/:persona_id', PacienteController.getByPersona);

module.exports = router;
