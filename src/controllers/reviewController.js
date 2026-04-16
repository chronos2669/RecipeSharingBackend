const Review = require('../models/Review');
const Recipe = require('../models/Recipe');
const cloudinary = require('../config/cloudinary');

//create a new review
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { recipeId } = req.params;

    //check if user already reviewed this recipe
    const existingReview = await Review.findOne({
      recipe: recipeId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this recipe'
      });
    }

    //create review
    const review = await Review.create({
      recipe: recipeId,
      user: req.user.id,
      rating,
      comment,
      images: req.files ? req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      })) : []
    });

    //add rating to recipe
    await Recipe.findByIdAndUpdate(recipeId, {
      $push: {
        ratings: {
          user: req.user.id,
          rating
        }
      }
    });

    //recalculate average rating
    const recipe = await Recipe.findById(recipeId);
    await recipe.save(); //this triggers the pre-save hook

    //populate user info before sending
    await review.populate('user', 'username profileImage');

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

//get all reviews for a recipe
exports.getRecipeReviews = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    //find reviews for the recipe
    const reviews = await Review.find({ recipe: recipeId })
      .populate('user', 'username profileImage')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    //get total count
    const total = await Review.countDocuments({ recipe: recipeId });

    res.json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

//update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    let review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    //update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    //update recipe rating if rating changed
    if (rating && rating !== review.rating) {
      const recipe = await Recipe.findById(review.recipe);
      const ratingIndex = recipe.ratings.findIndex(
        r => r.user.toString() === req.user.id
      );
      
      if (ratingIndex !== -1) {
        recipe.ratings[ratingIndex].rating = rating;
        await recipe.save(); //recalculate average
      }
    }

    await review.populate('user', 'username profileImage');

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

//delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    //delete images from Cloudinary
    for (const image of review.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    //remove rating from recipe
    await Recipe.findByIdAndUpdate(review.recipe, {
      $pull: {
        ratings: { user: req.user.id }
      }
    });

    //recalculate average rating
    const recipe = await Recipe.findById(review.recipe);
    await recipe.save();

    //delete the review
    await review.remove();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

//mark a review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    //check if user already marked as helpful
    const isHelpful = review.helpful.includes(userId);

    if (isHelpful) {
      //remove from helpful
      review.helpful = review.helpful.filter(
        id => id.toString() !== userId
      );
    } else {
      //add to helpful
      review.helpful.push(userId);
    }

    await review.save();

    res.json({
      success: true,
      isHelpful: !isHelpful,
      helpfulCount: review.helpful.length
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review',
      error: error.message
    });
  }
};