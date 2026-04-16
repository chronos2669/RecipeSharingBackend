const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

//sub-schema for ingredients
const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true //e.g., "cups", "tablespoons", "grams"
  },
  notes: String //optional notes like "finely chopped"
});

//sub-schema for nutrition information
const nutritionSchema = new mongoose.Schema({
  calories: Number,
  protein: Number, //in grams
  carbohydrates: Number, //in grams
  fat: Number, //in grams
  fiber: Number, //in grams
  sugar: Number, //in grams
  sodium: Number //in milligrams
});

//main recipe schema
const recipeSchema = new mongoose.Schema({
  //basic information
  title: {
    type: String,
    required: [true, 'Recipe title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Recipe description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  //who created this recipe
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  //recipe images
  images: [{
    url: String, //cloudinary URL
    publicId: String //cloudinary public ID for deletion
  }],
  
  //ingredients list
  ingredients: {
    type: [ingredientSchema],
    validate: [arr => arr.length > 0, 'At least one ingredient is required']
  },
  
  //cooking instructions
  instructions: [{
    step: Number,
    description: {
      type: String,
      required: true
    }
  }],
  
  //time information (in minutes)
  prepTime: {
    type: Number,
    required: true,
    min: [1, 'Prep time must be at least 1 minute']
  },
  
  cookTime: {
    type: Number,
    required: true,
    min: [1, 'Cook time must be at least 1 minute']
  },
  
  //serving information
  servings: {
    type: Number,
    required: true,
    min: [1, 'Servings must be at least 1']
  },
  
  //recipe metadata
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  category: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'appetizer']
  },
  
  cuisine: {
    type: String,
    required: true // e.g., "Italian", "Mexican", "Chinese"
  },
  
  //tags for searching
  tags: [{
    type: String,
    lowercase: true //convert to lowercase for consistency
  }],
  
  //nutrition information
  nutrition: nutritionSchema,
  
  //dietary information
  diet: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo']
  }],
  
  //ratings
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  //calculated fields
  averageRating: {
    type: Number,
    default: 0
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  //view counter
  views: {
    type: Number,
    default: 0
  },
  
  //publishing status
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true //add createdAt and updatedAt
});

//create indexes for better search performance
//text index for full-text search
recipeSchema.index({ 
  title: 'text', 
  description: 'text', 
  'ingredients.name': 'text', 
  tags: 'text' 
});

//compound indexes for common queries
recipeSchema.index({ category: 1, averageRating: -1 }); //for category filtering
recipeSchema.index({ author: 1, createdAt: -1 }); //for user's recipes

//middleware: calculate average rating before saving
recipeSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10; //round to 1 decimal
    this.totalRatings = this.ratings.length;
  }
  next();
});

//add pagination plugin
recipeSchema.plugin(mongoosePaginate);

//create and export the model
module.exports = mongoose.model('Recipe', recipeSchema);