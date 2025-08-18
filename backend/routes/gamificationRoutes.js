const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/gamificationController');

router.get('/', getLeaderboard);

module.exports = router;