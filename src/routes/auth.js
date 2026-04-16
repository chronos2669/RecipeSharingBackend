const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateRequest 
} = require('../middleware/validation');

//public routes (no authentication required)
//POST /api/auth/register
router.post('/register', validateRegister, validateRequest, register);

//POST /api/auth/login
router.post('/login', validateLogin, validateRequest, login);

//Protected routes (authentication required)
//GET /api/auth/me
router.get('/me', protect, getMe);

//PUT /api/auth/update-password
router.put('/update-password', protect, updatePassword);

module.exports = router;