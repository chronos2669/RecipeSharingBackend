const { body, validationResult } = require('express-validator');

//helper function to check if validation passed
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

//validation rules for user registration
exports.validateRegister = [
  body('username')
    .trim() //remove extra spaces
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail() //convert to lowercase, remove dots in gmail, etc.
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

//validation rules for login
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

//validation rules for creating/updating recipes
exports.validateRecipe = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  
  body('ingredients.*.name')
    .notEmpty()
    .withMessage('Ingredient name is required'),
  
  body('ingredients.*.amount')
    .isNumeric()
    .withMessage('Ingredient amount must be a number'),
  
  body('ingredients.*.unit')
    .notEmpty()
    .withMessage('Ingredient unit is required'),
  
  body('instructions')
    .isArray({ min: 1 })
    .withMessage('At least one instruction is required'),
  
  body('instructions.*.description')
    .notEmpty()
    .withMessage('Instruction description is required'),
  
  body('prepTime')
    .isInt({ min: 1 })
    .withMessage('Prep time must be at least 1 minute'),
  
  body('cookTime')
    .isInt({ min: 1 })
    .withMessage('Cook time must be at least 1 minute'),
  
  body('servings')
    .isInt({ min: 1 })
    .withMessage('Servings must be at least 1'),
  
  body('category')
    .isIn(['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'appetizer'])
    .withMessage('Invalid category'),
  
  body('cuisine')
    .notEmpty()
    .withMessage('Cuisine is required'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level')
];

//validation rules for reviews
exports.validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

//middleware to parse JSON fields in form-data
exports.parseJsonFields = (req, res, next) => {
  const jsonFields = ['ingredients', 'instructions', 'tags', 'diet', 'nutrition'];
  
  jsonFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        //if it's a required field, you might want to handle the error
        console.error(`Failed to parse ${field}:`, e);
      }
    }
  });
  
  next();
};