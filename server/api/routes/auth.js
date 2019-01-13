const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth');

// USER LOGIN
router.post('/login', AuthController.authLogin);

module.exports = router;