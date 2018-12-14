const express = require('express');
const router = express.Router();

const EventsController = require('../controllers/events');
const checkAuth = require('../../middleware/check-auth');
const checkObjectID = require('../../middleware/check-object-id');

// app.post('/events', (req, res) => {
//   res.status(200).send(req.body);
// });

// GET all events
router.get('/', EventsController.getEvents);

// GET single event
router.get('/:id', checkObjectID, EventsController.getSingleEvent);

// POST an event
router.post('/', EventsController.createEvent);

// DELETE an event
router.delete('/:id', checkAuth, checkObjectID, EventsController.deleteEvent);

// UPDATE an event
router.patch('/:id', checkAuth, checkObjectID, EventsController.updateEvent);

module.exports = router;