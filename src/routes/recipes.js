const express = require('express');
const router = express.Router();
const {
  createRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  getUserRecipes,
  searchRecipes
} = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');
const { validateRecipe, validateRequest, parseJsonFields } = require('../middleware/validation');
const upload = require('../middleware/upload');

//public routes
//GET /api/recipes - get all recipes
router.get('/', getRecipes);

//GET /api/recipes/search - search recipes
router.get('/search', searchRecipes);

//GET /api/recipes/:id - get single recipe
router.get('/:id', getRecipe);

//GET /api/recipes/user/:userId - get user's recipes
router.get('/user/:userId', getUserRecipes);

//protected routes (require authentication)
//POST /api/recipes - create new recipe
router.post(
  '/', 
  protect, 
  upload.array('images', 5), //max 5 images
  parseJsonFields,
  validateRecipe,
  validateRequest,
  createRecipe
);

//PUT /api/recipes/:id - update recipe
router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  updateRecipe
);

//DELETE /api/recipes/:id - delete recipe
router.delete('/:id', protect, deleteRecipe);

module.exports = router;