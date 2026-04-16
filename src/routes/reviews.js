const express = require('express');
const router = express.Router();
const {
  createReview,
  getRecipeReviews,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validateReview, validateRequest } = require('../middleware/validation');
const upload = require('../middleware/upload');

//create review for a recipe
router.post(
  '/recipe/:recipeId',
  protect,
  upload.array('images', 3), //max 3 images per review
  validateReview,
  validateRequest,
  createReview
);

//get all reviews for a recipe
router.get('/recipe/:recipeId', getRecipeReviews);

//update a review
router.put('/:reviewId', protect, updateReview);

//delete a review
router.delete('/:reviewId', protect, deleteReview);

//mark review as helpful
router.post('/:reviewId/helpful', protect, markHelpful);

module.exports = router;