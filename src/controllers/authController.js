const User = require('../models/User');
const jwt = require('jsonwebtoken');

//register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    //create new user
    const user = await User.create({
      username,
      email,
      password //will be hashed automatically by the pre-save middleware
    });

    //generate JWT token
    const token = user.generateToken();

    //send response with token and user info (excluding password)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

//login an existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //find user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');

    //check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    //check if password matches
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    //generate JWT token
    const token = user.generateToken();

    //send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

//get current logged-in user's details
exports.getMe = async (req, res) => {
  try {
    //req.user is set by the protect middleware
    const user = await User.findById(req.user.id)
      .populate('favorites', 'title images') //include favorite recipes
      .populate('followers', 'username profileImage') //include followers
      .populate('following', 'username profileImage'); //include following

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    //get user with password field
    const user = await User.findById(req.user.id).select('+password');

    //check if current password is correct
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    //update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};