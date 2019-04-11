const mongoose = require('mongoose');

const ProfileImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    trim: true
  }
});

const ProfileImage = mongoose.model('ProfileImage', ProfileImageSchema);

