const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All admin routes strictly protected with 'admin' role
router.use(verifyToken, requireRole('admin'));

// Analytics
router.get('/dashboard', adminController.getDashboardKPIs);
router.get('/sales', adminController.getSalesAnalytics);
router.get('/peak-times', adminController.getPeakOrderTimes);
router.get('/best-selling', adminController.getBestSellingItems);

// Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/orders', adminController.getAllOrders);

module.exports = router;
