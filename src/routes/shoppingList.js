const express = require('express');
const router = express.Router();
const {
  generateShoppingList,
  getShoppingList,
  updateShoppingListItem,
  clearShoppingList
} = require('../controllers/shoppingListController');
const { protect } = require('../middleware/auth');

//all shopping list routes require authentication
router.use(protect);

//POST /api/shopping-list/generate
router.post('/generate', generateShoppingList);

//GET /api/shopping-list
router.get('/', getShoppingList);

//PUT /api/shopping-list/items/:itemId
router.put('/items/:itemId', updateShoppingListItem);

//DELETE /api/shopping-list/clear
router.delete('/clear', clearShoppingList);

module.exports = router;