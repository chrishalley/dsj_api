const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const checkSuperAdmin = require('../../middleware/check-super-admin');

const UsersController = require('../controllers/users');

const {User} = require('../../models/user');

// GET USERS LIST
router.get('/', checkAuth, UsersController.users_get_users_list);

// SAVE NEW USER
router.post('/', checkAuth, checkSuperAdmin, UsersController.users_save_new_user);

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