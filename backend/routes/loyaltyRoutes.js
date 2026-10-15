const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/my', verifyToken, loyaltyController.getMyLoyalty);
router.get('/rewards', loyaltyController.getRewards);
router.post('/redeem/:rewardId', verifyToken, loyaltyController.redeemReward);
router.post('/rewards', verifyToken, requireRole('admin'), loyaltyController.createReward);

module.exports = router;
