const express = require('express');
const router = express.Router();
const SetupController = require('../controllers/SetupController');

router.post('/seed', SetupController.seed);
router.get('/status', SetupController.status);

module.exports = router;
