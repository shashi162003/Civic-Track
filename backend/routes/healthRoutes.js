const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/healthController');

router.get('/', getHealthStatus);

module.exports = router;