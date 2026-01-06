const express = require('express');
const router = express.Router();
const CitaController = require('../controllers/CitaController');

router.post('/', CitaController.create);
router.get('/', CitaController.getList);
router.get('/:id', CitaController.getById);

// Specialized Actions
router.patch('/:id/status', CitaController.updateStatus);
router.patch('/:id/reschedule', CitaController.reschedule);

module.exports = router;
