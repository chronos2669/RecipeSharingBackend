const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  toggleFavorite,
  getFavorites,
  createCollection,
  addToCollection,
  removeFromCollection,
  getCollections,
  deleteCollection
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

//profile routes
router.get('/profile/:userId', getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

//follow routes
router.post('/follow/:userId', protect, toggleFollow);

//favorites routes
router.post('/favorites/:recipeId', protect, toggleFavorite);
router.get('/favorites', protect, getFavorites);              //get current user's favorites
router.get('/favorites/:userId', protect, getFavorites);       //get specific user's favorites

//collections routes
router.post('/collections', protect, createCollection);
router.get('/collections', protect, getCollections);           //get current user's collections
router.get('/collections/:userId', protect, getCollections);   //get specific user's collections
router.delete('/collections/:collectionId', protect, deleteCollection);
router.post('/collections/:collectionId/recipes/:recipeId', protect, addToCollection);
router.delete('/collections/:collectionId/recipes/:recipeId', protect, removeFromCollection);

module.exports = router;