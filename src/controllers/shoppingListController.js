const ShoppingList = require('../models/ShoppingList');
const Recipe = require('../models/Recipe');

//helper function to categorize ingredients
function categorizeIngredient(name) {
  const categories = {
    produce: ['tomato', 'lettuce', 'carrot', 'onion', 'garlic', 'potato', 'apple', 'banana', 'pepper', 'cucumber', 'broccoli'],
    dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'],
    meat: ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'shrimp'],
    pantry: ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta', 'beans'],
    frozen: ['frozen', 'ice cream'],
    bakery: ['bread', 'bagel', 'muffin', 'croissant', 'roll']
  };

  const lowerName = name.toLowerCase();
  
  //check each category
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

//generate shopping list from selected recipes
exports.generateShoppingList = async (req, res) => {
  try {
    const { recipeIds, servingsAdjustment = {} } = req.body;

    if (!recipeIds || recipeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipe IDs'
      });
    }

    //fetch all selected recipes
    const recipes = await Recipe.find({
      _id: { $in: recipeIds }
    });

    //combine ingredients from all recipes
    const ingredientMap = new Map();

    recipes.forEach(recipe => {
      //get serving multiplier for this recipe
      const multiplier = servingsAdjustment[recipe._id] || 1;
      
      recipe.ingredients.forEach(ingredient => {
        //create unique key for each ingredient+unit combo
        const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
        
        if (ingredientMap.has(key)) {
          //add to existing amount
          const existing = ingredientMap.get(key);
          existing.amount += ingredient.amount * multiplier;
        } else {
          //add new ingredient
          ingredientMap.set(key, {
            ingredient: {
              name: ingredient.name,
              amount: ingredient.amount * multiplier,
              unit: ingredient.unit
            },
            recipe: recipe._id,
            category: categorizeIngredient(ingredient.name)
          });
        }
      });
    });

    //check if user has an active shopping list
    let shoppingList = await ShoppingList.findOne({
      user: req.user.id,
      isActive: true
    });

    if (shoppingList) {
      //add new items to existing list
      const newItems = Array.from(ingredientMap.values());
      shoppingList.items.push(...newItems);
    } else {
      //create new shopping list
      shoppingList = await ShoppingList.create({
        user: req.user.id,
        items: Array.from(ingredientMap.values())
      });
    }

    await shoppingList.save();
    await shoppingList.populate('items.recipe', 'title');

    res.json({
      success: true,
      shoppingList
    });
  } catch (error) {
    console.error('Generate shopping list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating shopping list',
      error: error.message
    });
  }
};

//get active shopping list
exports.getShoppingList = async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      user: req.user.id,
      isActive: true
    }).populate('items.recipe', 'title');

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'No active shopping list found'
      });
    }

    res.json({
      success: true,
      shoppingList
    });
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shopping list',
      error: error.message
    });
  }
};

//update shopping list item (check/uncheck)
exports.updateShoppingListItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { checked } = req.body;

    const shoppingList = await ShoppingList.findOne({
      user: req.user.id,
      isActive: true,
      'items._id': itemId
    });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list item not found'
      });
    }

    //find and update the specific item
    const item = shoppingList.items.id(itemId);
    item.checked = checked;

    await shoppingList.save();

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shopping list item',
      error: error.message
    });
  }
};

//clear/archive shopping list
exports.clearShoppingList = async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      user: req.user.id,
      isActive: true
    });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'No active shopping list found'
      });
    }

    //mark as inactive (archived)
    shoppingList.isActive = false;
    await shoppingList.save();

    res.json({
      success: true,
      message: 'Shopping list cleared'
    });
  } catch (error) {
    console.error('Clear shopping list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing shopping list',
      error: error.message
    });
  }
};