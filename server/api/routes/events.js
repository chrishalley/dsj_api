const express = require('express');
const router = express.Router();

const EventsController = require('../controllers/events');

// app.post('/events', (req, res) => {
//   res.status(200).send(req.body);
// });

// GET all events
router.get('/', EventsController.getEvents);

// POST an event
router.post('/', EventsController.createEvent);

module.exports = router;