const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

//configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipe-sharing', //folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], //allowed file types
    transformation: [{ 
      width: 1000, 
      height: 1000, 
      crop: 'limit' //resize large images while maintaining aspect ratio
    }]
  }
});

//file filter function
const fileFilter = (req, file, cb) => {
  //check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); //accept file
  } else {
    cb(new Error('Not an image! Please upload only images.'), false); //reject file
  }
};

//create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 //5MB max file size
  }
});

module.exports = upload;