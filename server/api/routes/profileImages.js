const express = require('express');
const multer = require('multer');

const router = express.Router();
const upload = multer();

const ProfileImagesController = require('../controllers/profileImages');

// Add image
router.post('/', upload.array(), ProfileImagesController.addImage);

module.exports = router;