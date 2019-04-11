const cloudinaryConfig = {
  cloud_name: 'dtn26lvux',
  api_key: '451276742949277',
  api_secret: 'LThmIzBc8KUbgZxWcIBJCWbABzo'
};

const cloudinaryUrl = (url, config) => {
  if (url.includes('cloudinary')) {
    const urlArray = url.split('/');
    const uploadIndex = urlArray.indexOf('upload');

    url = urlArray.slice(0, uploadIndex + 1)
      .concat(config)
      .concat(urlArray.slice(uploadIndex + 1))
      .join('/')
  }
  return url;
}

module.exports = {
  cloudinaryConfig,
  cloudinaryUrl
};