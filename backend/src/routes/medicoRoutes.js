const express = require('express');
const router = express.Router();
const MedicoController = require('../controllers/MedicoController');

router.get('/', MedicoController.getAll);
router.get('/:id', MedicoController.getById);
router.post('/', MedicoController.create);
router.put('/:id', MedicoController.update);
router.delete('/:id', MedicoController.delete);

module.exports = router;
