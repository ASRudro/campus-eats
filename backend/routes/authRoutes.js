const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

// Public
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Authenticated
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.get('/daily-usage', verifyToken, authController.getDailyUsage);
router.post('/reset-daily-usage', verifyToken, authController.resetDailyUsage);

module.exports = router;
