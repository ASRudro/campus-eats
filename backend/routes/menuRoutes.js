const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateMenuItem } = require('../middleware/validate');

// Public menu & shop browsing
router.get('/', menuController.getAllItems);
router.get('/shops', menuController.getShops);
router.get('/categories', menuController.getCategories);
router.get('/pickup-slots', menuController.getPickupSlots);
router.get('/:id', menuController.getItemById);

// Admin / Kitchen item management
router.post('/', verifyToken, requireRole('admin'), validateMenuItem, menuController.createMenuItem);
router.put('/:id', verifyToken, requireRole('admin'), menuController.updateMenuItem);
router.delete('/:id', verifyToken, requireRole('admin'), menuController.deleteMenuItem);
router.patch('/:id/availability', verifyToken, requireRole('kitchen', 'admin'), menuController.toggleAvailability);
router.post('/categories', verifyToken, requireRole('admin'), menuController.createCategory);

module.exports = router;
