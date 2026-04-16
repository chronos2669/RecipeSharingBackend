const mongoose = require('mongoose');

//define review schema
const reviewSchema = new mongoose.Schema({
  //which recipe is being reviewed
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  
  //who wrote the review
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  //rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  //review text
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  
  //review images (optional)
  images: [{
    url: String,
    publicId: String
  }],
  
  //users who found this review helpful
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

//create unique index to ensure one review per user per recipe
reviewSchema.index({ recipe: 1, user: 1 }, { unique: true });

//create and export the model
module.exports = mongoose.model('Review', reviewSchema);