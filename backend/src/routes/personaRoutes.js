const express = require('express');
const router = express.Router();
const PersonaController = require('../controllers/PersonaController');

router.post('/', PersonaController.create);
router.get('/search', PersonaController.search);

module.exports = router;
