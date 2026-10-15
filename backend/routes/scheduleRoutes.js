const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, scheduleController.getWeeklySchedule);
router.post('/', verifyToken, scheduleController.setScheduleItem);
router.delete('/:id', verifyToken, scheduleController.removeScheduleItem);

module.exports = router;
