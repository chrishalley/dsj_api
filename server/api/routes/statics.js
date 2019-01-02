const express = require('express');
const router = express.Router();

const StaticsController = require('../controllers/statics');
const checkAuth = require('../../middleware/check-auth');
const checkObjectId = require('../../middleware/check-object-id');

// GET all bookings
router.get('/termsAndConditions', StaticsController.getTerms);

module.exports = router;