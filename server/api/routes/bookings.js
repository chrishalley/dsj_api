const express = require('express');
const router = express.Router();

const BookingsController = require('../controllers/bookings');
const checkAuth = require('../../middleware/check-auth');
const checkObjectId = require('../../middleware/check-object-id');

// GET all bookings
router.get('/', BookingsController.getBookings);

// POST a booking
router.post('/', BookingsController.createBooking);

module.exports = router;