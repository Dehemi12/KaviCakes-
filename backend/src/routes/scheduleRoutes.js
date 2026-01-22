const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, scheduleController.getSchedule);
router.post('/', authenticateToken, scheduleController.addEvent);
router.delete('/:id', authenticateToken, scheduleController.deleteEvent);

module.exports = router;
