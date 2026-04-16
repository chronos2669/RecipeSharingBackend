const mongoose = require('mongoose');

//define shopping list schema
const shoppingListSchema = new mongoose.Schema({
  //owner of the shopping list
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  //shopping list name
  name: {
    type: String,
    default: 'My Shopping List'
  },
  
  //items in the shopping list
  items: [{
    //ingredient details
    ingredient: {
      name: String,
      amount: Number,
      unit: String
    },
    
    //which recipe this ingredient is from (optional)
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    
    //is this item checked off?
    checked: {
      type: Boolean,
      default: false
    },
    
    //category for organizing items
    category: {
      type: String,
      enum: ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other'],
      default: 'other'
    }
  }],
  
  //is this the active shopping list?
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

//create and export the model
module.exports = mongoose.model('ShoppingList', shoppingListSchema);