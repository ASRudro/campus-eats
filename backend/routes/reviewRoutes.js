const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRating } = require('../middleware/validate');

// Public: View item reviews
router.get('/item/:menuItemId', reviewController.getReviewsByItem);

// Authenticated Student: Submit review
router.post('/item/:menuItemId', verifyToken, validateRating, reviewController.submitReview);

// Admin: View all reviews & delete inappropriate comments
router.get('/all', verifyToken, requireRole('admin'), reviewController.getAllReviews);
router.delete('/:id', verifyToken, requireRole('admin'), reviewController.deleteReview);

module.exports = router;
