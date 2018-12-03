const express = require('express');
const router = express.Router();
const generatePassword = require('generate-password');
const emails = require('../../mail/emails');
const mongoose = require('mongoose');
const applicationError = require('../../errors/applicationErrors');
const utils = require('../../utils/utils');
const jwt = require('jsonwebtoken');

const UsersController = require('../controllers/users');

const {User} = require('../../models/user');

// GET USERS LIST
router.get('/', UsersController.users_get_users_list);

// SAVE NEW USER
router.post('/', UsersController.users_save_new_user);

// GET USER INFO
router.get('/:id', UsersController.users_get_single_user);

// DELETE USER
router.delete('/:id', UsersController.users_delete_user);

// UPDATING USERS
router.put('/:id', UsersController.users_edit_user);

// USER SET PASSWORD
router.post('/:id/set-password', UsersController.users_set_password);

// USER RESET-PASSWORD
router.post('/reset-password', UsersController.users_reset_password);

// Verify password-reset-link
router.post('/verify-password-reset-token', UsersController.users_verify_reset_token)

// Reset password by user id
router.post('/:id/resetPassword', UsersController.users_reset_password_by_id);

module.exports = router;