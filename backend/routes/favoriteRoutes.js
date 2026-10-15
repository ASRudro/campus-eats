const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, favoriteController.getFavorites);
router.get('/ids', verifyToken, favoriteController.getFavoriteIds);
router.post('/:menuItemId', verifyToken, favoriteController.toggleFavorite);

module.exports = router;
