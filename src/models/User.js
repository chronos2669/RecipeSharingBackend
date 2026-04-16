const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//define what a user looks like in our database
const userSchema = new mongoose.Schema({
  //username field
  username: {
    type: String,
    required: [true, 'Username is required'], //custom error message
    unique: true, //no duplicate usernames
    trim: true, //remove extra spaces
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  
  //email field
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, //convert to lowercase
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  
  //password field
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false //don't include password in queries by default
  },
  
  //profile image URL
  profileImage: {
    type: String,
    default: '' //empty string if no image
  },
  
  //user bio/description
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  //array of favorite recipe IDs
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe' //reference to Recipe model
  }],
  
  //users this user is following
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  //users following this user
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  //recipes created by this user
  createdRecipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  
  //recipe collections (like Pinterest boards)
  collections: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    recipes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }],
    isPublic: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true //automatically add createdAt and updatedAt fields
});

//middleware: Hash password before saving user
userSchema.pre('save', async function(next) {
  //only hash password if it's new or modified
  if (!this.isModified('password')) return next();
  
  //generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//method: compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//method: generate JWT token for authentication
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id }, //payload
    process.env.JWT_SECRET, //secret key
    { expiresIn: process.env.JWT_EXPIRE } //options
  );
};

//create and export the model
module.exports = mongoose.model('User', userSchema);