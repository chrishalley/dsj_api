const express = require('express');
const router = express.Router();
const checkAuth = require('../../middleware/check-auth');
const checkSuperAdmin = require('../../middleware/check-super-admin');
const isAdminOwner = require('../../middleware/is-admin-owner');

const UsersController = require('../controllers/users');

// GET USERS LIST
router.get('/', checkAuth, UsersController.users_get_users_list);

// SAVE NEW USER
router.post('/', checkAuth, checkSuperAdmin, UsersController.users_save_new_user);

// GET USER INFO
router.get('/:id', checkAuth, UsersController.users_get_single_user);

// DELETE USER
router.delete('/:id', checkAuth, checkSuperAdmin, UsersController.users_delete_user);

// UPDATING USERS
router.patch('/:id', checkAuth, isAdminOwner, UsersController.users_edit_user);

// USER RESET-PASSWORD
router.post('/reset-password', UsersController.users_reset_password);

// Reset password by user id
router.post('/:id/resetPassword', checkAuth, isAdminOwner, UsersController.users_reset_password_by_id);

module.exports = router;