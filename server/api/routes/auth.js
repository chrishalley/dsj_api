const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth');

// USER LOGIN
router.post('/login', AuthController.auth_login);

module.exports = router;