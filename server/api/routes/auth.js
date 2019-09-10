const checkAuth = require("../../middleware/check-auth");
const isAdminOwner = require("../../middleware/is-admin-owner");

const express = require('express');
const router = express.Router();


const AuthController = require('../controllers/auth');

// USER LOGIN
router.post('/login', AuthController.auth_login);

// USER SET PASSWORD
router.post('/:id/set-password', AuthController.set_password);

module.exports = router;