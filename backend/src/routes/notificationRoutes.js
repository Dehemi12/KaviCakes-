const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/customer', notificationController.getCustomerNotifications);
router.get('/', notificationController.getNotifications);
router.get('/templates', notificationController.getTemplates);
router.post('/templates', notificationController.createTemplate);
router.post('/send', notificationController.sendManualNotification);
router.post('/approve-payment', notificationController.approvePayment);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
