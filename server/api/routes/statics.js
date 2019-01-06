const express = require('express');
const router = express.Router();

const StaticsController = require('../controllers/statics');
const checkAuth = require('../../middleware/check-auth');
const checkObjectId = require('../../middleware/check-object-id');

// GET standard conditions
router.get('/termsAndConditions', StaticsController.getStandardConditions);

// PUT standard conditions
router.put('/termsAndConditions', StaticsController.updateStandardConditions);

module.exports = router;