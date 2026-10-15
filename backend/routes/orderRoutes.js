const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Student: Checkout, My Orders, View Receipt, Reorder
router.post('/', verifyToken, orderController.createOrder);
router.get('/my', verifyToken, orderController.getMyOrders);
router.get('/reorder/:id', verifyToken, orderController.reorderItems);
router.post('/:id/pay', verifyToken, orderController.payOrder);
router.get('/:id', verifyToken, orderController.getOrderById);


// Kitchen Staff & Admin: View active queue & status transitions
router.get('/kitchen/queue', verifyToken, requireRole('kitchen', 'admin'), orderController.getKitchenOrders);
router.patch('/:id/status', verifyToken, requireRole('kitchen', 'admin'), orderController.updateOrderStatus);

module.exports = router;
