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
router.put('/templates/:id', notificationController.updateTemplate);
router.get('/logs', notificationController.getLogs);
router.get('/bulk/pending', notificationController.getPendingBulkNotifications);
router.post('/bulk/send', notificationController.sendBulkNotifications);
router.post('/individual/send', notificationController.sendIndividualNotification);
router.put('/:id/read', notificationController.markAsRead);
router.post('/marketing/send', notificationController.sendMarketingCampaign);

module.exports = router;
