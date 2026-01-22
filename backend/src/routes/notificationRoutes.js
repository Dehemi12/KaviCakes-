const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.get('/templates', notificationController.getTemplates);
router.post('/approve-payment', notificationController.approvePayment);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
