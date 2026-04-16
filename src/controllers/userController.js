const User = require('../models/User');
const Recipe = require('../models/Recipe');

//toggle favorite status of a recipe
exports.toggleFavorite = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user.id;

    //find the user
    const user = await User.findById(userId);
    
    //check if recipe is already favorited
    const isFavorited = user.favorites.includes(recipeId);

    if (isFavorited) {
      //remove from favorites
      await User.findByIdAndUpdate(userId, {
        $pull: { favorites: recipeId }
      });
    } else {
      //add to favorites
      await User.findByIdAndUpdate(userId, {
        $addToSet: { favorites: recipeId } //"$addToSet" prevents duplicates
      });
    }

    res.json({
      success: true,
      isFavorited: !isFavorited,
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
      error: error.message
    });
  }
};

//get user's favorite recipes
exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.params.userId || req.user.id;

    //find user and populate favorites
    const user = await User.findById(userId)
      .populate({
        path: 'favorites',
        populate: {
          path: 'author',
          select: 'username profileImage'
        },
        options: {
          limit: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    //get total count for pagination
    const total = await User.findById(userId).select('favorites');

    res.json({
      success: true,
      favorites: user.favorites,
      total: total.favorites.length,
      page: parseInt(page),
      pages: Math.ceil(total.favorites.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

//get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password') //exclude password
      .populate('createdRecipes', 'title images averageRating')
      .populate('followers', 'username profileImage')
      .populate('following', 'username profileImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

//update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio) updateData.bio = bio;

    //handle profile image upload
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

//follow or unfollow a user
exports.toggleFollow = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      //unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: currentUserId }
      });
    } else {
      //follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: userId }
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: currentUserId }
      });
    }

    res.json({
      success: true,
      isFollowing: !isFollowing,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully'
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling follow',
      error: error.message
    });
  }
};

//create a recipe collection
exports.createCollection = async (req, res) => {
  try {
    const { name, description, isPublic = true } = req.body;

    const user = await User.findById(req.user.id);
    
    //check if collection name already exists
    const existingCollection = user.collections.find(
      col => col.name.toLowerCase() === name.toLowerCase()
    );

    if (existingCollection) {
      return res.status(400).json({
        success: false,
        message: 'Collection with this name already exists'
      });
    }

    //add new collection
    user.collections.push({
      name,
      description,
      isPublic,
      recipes: []
    });

    await user.save();

    res.status(201).json({
      success: true,
      collection: user.collections[user.collections.length - 1]
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating collection',
      error: error.message
    });
  }
};

//add recipe to collection
exports.addToCollection = async (req, res) => {
  try {
    const { collectionId, recipeId } = req.params;

    const user = await User.findById(req.user.id);
    const collection = user.collections.id(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    //check if recipe already in collection
    if (collection.recipes.includes(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Recipe already in collection'
      });
    }

    collection.recipes.push(recipeId);
    await user.save();

    res.json({
      success: true,
      message: 'Recipe added to collection'
    });
  } catch (error) {
    console.error('Add to collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to collection',
      error: error.message
    });
  }
};

//remove recipe from collection
exports.removeFromCollection = async (req, res) => {
  try {
    const { collectionId, recipeId } = req.params;

    const user = await User.findById(req.user.id);
    const collection = user.collections.id(collectionId);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    collection.recipes = collection.recipes.filter(
      id => id.toString() !== recipeId
    );
    
    await user.save();

    res.json({
      success: true,
      message: 'Recipe removed from collection'
    });
  } catch (error) {
    console.error('Remove from collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from collection',
      error: error.message
    });
  }
};

//get user's collections
exports.getCollections = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const user = await User.findById(userId)
      .populate({
        path: 'collections.recipes',
        select: 'title images author',
        populate: {
          path: 'author',
          select: 'username'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    //filter collections based on privacy
    let collections = user.collections;
    if (userId !== req.user.id) {
      collections = collections.filter(col => col.isPublic);
    }

    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collections',
      error: error.message
    });
  }
};

//delete a collection
exports.deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const user = await User.findById(req.user.id);
    user.collections = user.collections.filter(
      col => col._id.toString() !== collectionId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting collection',
      error: error.message
    });
  }
};