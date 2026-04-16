const Recipe = require('../models/Recipe');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

//create a new recipe
exports.createRecipe = async (req, res) => {
  try {
    //prepare recipe data
    const recipeData = {
      ...req.body,
      author: req.user.id, //set the author to the logged-in user
      images: []
    };

    //handle image uploads if any
    if (req.files && req.files.length > 0) {
      //req.files is an array of uploaded files from multer
      for (const file of req.files) {
        recipeData.images.push({
          url: file.path, //Cloudinary URL
          publicId: file.filename //Cloudinary public ID
        });
      }
    }

    //create recipe in database
    const recipe = await Recipe.create(recipeData);

    //add recipe to user's created recipes list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdRecipes: recipe._id }
    });

    //populate author details before sending response
    await recipe.populate('author', 'username profileImage');

    res.status(201).json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating recipe',
      error: error.message
    });
  }
};

//get all recipes with filters and pagination
exports.getRecipes = async (req, res) => {
  try {
    //extract query parameters
    const {
      page = 1,
      limit = 12,
      category,
      cuisine,
      difficulty,
      diet,
      maxTime,
      minRating,
      search,
      sort = '-createdAt' //default: newest first
    } = req.query;

    //build query object
    const query = { isPublished: true }; //only show published recipes

    // Add filters if provided
    if (category) query.category = category;
    if (cuisine) query.cuisine = new RegExp(cuisine, 'i'); //case-insensitive search
    if (difficulty) query.difficulty = difficulty;
    if (diet) {
      //handle multiple dietary restrictions
      query.diet = { $in: Array.isArray(diet) ? diet : [diet] };
    }
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    //filter by total cooking time
    if (maxTime) {
      query.$expr = {
        $lte: [{ $add: ['$prepTime', '$cookTime'] }, parseInt(maxTime)]
      };
    }

    //text search
    if (search) {
      query.$text = { $search: search };
    }

    //pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: {
        path: 'author',
        select: 'username profileImage'
      }
    };

    //execute query with pagination
    const recipes = await Recipe.paginate(query, options);

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipes',
      error: error.message
    });
  }
};

//get a single recipe by ID
exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username profileImage bio followers')
      .populate({
        path: 'ratings.user',
        select: 'username profileImage'
      });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    //increment view count
    recipe.views += 1;
    await recipe.save();

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipe',
      error: error.message
    });
  }
};

//update a recipe
exports.updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    //check if user owns this recipe
    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this recipe'
      });
    }

    //handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        newImages.push({
          url: file.path,
          publicId: file.filename
        });
      }
      //add new images to existing ones
      req.body.images = [...recipe.images, ...newImages];
    }

    //update recipe
    recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, //return updated document
        runValidators: true //run model validators
      }
    ).populate('author', 'username profileImage');

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recipe',
      error: error.message
    });
  }
};

//delete a recipe
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    //check if user owns this recipe
    if (recipe.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this recipe'
      });
    }

    //delete images from Cloudinary
    for (const image of recipe.images) {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    //remove recipe from user's created recipes
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { createdRecipes: recipe._id }
    });

    //remove recipe from all favorites and collections
    await User.updateMany(
      { 
        $or: [
          { favorites: recipe._id }, 
          { 'collections.recipes': recipe._id }
        ] 
      },
      {
        $pull: {
          favorites: recipe._id,
          'collections.$[].recipes': recipe._id
        }
      }
    );

    //delete the recipe
    await recipe.remove();

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recipe',
      error: error.message
    });
  }
};

//get recipes by a specific user
exports.getUserRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.params.userId || req.user.id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: '-createdAt',
      populate: {
        path: 'author',
        select: 'username profileImage'
      }
    };

    const query = { author: userId, isPublished: true };
    
    //if requesting own recipes, include unpublished ones
    if (req.user && req.user.id === userId) {
      delete query.isPublished;
    }

    const recipes = await Recipe.paginate(query, options);

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user recipes',
      error: error.message
    });
  }
};

//search recipes with advanced filters
exports.searchRecipes = async (req, res) => {
  try {
    const {
      q, // Search query
      ingredients,
      excludeIngredients,
      tags,
      minTime,
      maxTime,
      minCalories,
      maxCalories,
      page = 1,
      limit = 12
    } = req.query;

    //build complex query
    const query = { isPublished: true };

    //text search
    if (q) {
      query.$text = { $search: q };
    }

    //ingredient search
    if (ingredients) {
      const ingredientList = ingredients.split(',').map(i => i.trim());
      query['ingredients.name'] = {
        $all: ingredientList.map(ing => new RegExp(ing, 'i'))
      };
    }

    //exclude certain ingredients
    if (excludeIngredients) {
      const excludeList = excludeIngredients.split(',').map(i => i.trim());
      query['ingredients.name'] = {
        ...query['ingredients.name'],
        $nin: excludeList
      };
    }

    //tag search
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      query.tags = { $all: tagList };
    }

    //time constraints
    if (minTime || maxTime) {
      query.$expr = query.$expr || { $and: [] };
      const totalTime = { $add: ['$prepTime', '$cookTime'] };
      
      if (minTime) {
        query.$expr.$and.push({ $gte: [totalTime, parseInt(minTime)] });
      }
      if (maxTime) {
        query.$expr.$and.push({ $lte: [totalTime, parseInt(maxTime)] });
      }
    }

    //calorie constraints
    if (minCalories || maxCalories) {
      query['nutrition.calories'] = {};
      if (minCalories) query['nutrition.calories'].$gte = parseInt(minCalories);
      if (maxCalories) query['nutrition.calories'].$lte = parseInt(maxCalories);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: q ? { score: { $meta: 'textScore' } } : '-createdAt',
      populate: {
        path: 'author',
        select: 'username profileImage'
      }
    };

    const recipes = await Recipe.paginate(query, options);

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching recipes',
      error: error.message
    });
  }
};