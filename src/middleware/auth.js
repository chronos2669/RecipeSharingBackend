const jwt = require('jsonwebtoken');
const User = require('../models/User');

//middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
  let token;

  //check if token exists in the Authorization header
  //format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //extract token from "Bearer TOKEN"
    token = req.headers.authorization.split(' ')[1];
  }

  //if no token found, user is not authenticated
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    //verify token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    //find user by ID from token and attach to request
    //don't include password in the user object
    req.user = await User.findById(decoded.id).select('-password');
    
    //continue to next middleware/route handler
    next();
  } catch (error) {
    //token is invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

//middleware to check if user has specific role (for future use)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route'
      });
    }
    next();
  };
};