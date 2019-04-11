const cloudinary = require('../../apis/cloudinary');
const ProfileImage = require('../../models/profileImage');

exports.addImage = (req, res, next) => {
  let { file, filename } = req.body;
  filename = filename.split('.')[0];
  cloudinary.uploader.upload(file, {tags: 'profile_image', folder: `dsj-events/profile_images`, use_filename: true}, (err, image) => {
    if (err) console.log('Cloudinary error:', err);
    console.log(image);
    const transformedImage = cloudinary.image(image.public_id, { transformation: [ { width: 70 } ] });
    console.log('new image', transformedImage.src);
    res.status(201).json({
      url: image.secure_url,
      name: `${image.original_filename}.${image.format}`
    });
  });
}

