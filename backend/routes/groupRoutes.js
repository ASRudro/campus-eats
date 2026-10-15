const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, groupController.createGroup);
router.post('/join', verifyToken, groupController.joinGroup);
router.get('/:id', verifyToken, groupController.getGroupDetails);
router.post('/:id/items', verifyToken, groupController.addGroupItem);
router.delete('/items/:itemId', verifyToken, groupController.removeGroupItem);
router.post('/:id/pay-share', verifyToken, groupController.contributePayment);
router.post('/:id/finalize', verifyToken, groupController.finalizeGroup);

module.exports = router;
