const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', orderController.getAllOrders);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/payment-status', orderController.updatePaymentStatus);
router.delete('/:id', orderController.deleteOrder);
router.post('/:id/invoice/send', orderController.sendInvoice);

module.exports = router;
