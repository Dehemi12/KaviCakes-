const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

router.get('/', orderController.getAllOrders);
router.get('/my-orders', orderController.getMyOrders);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.put('/:id/cancel', orderController.cancelOrder);
router.put('/:id/confirm', orderController.confirmOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/payment-status', orderController.updatePaymentStatus);
router.post('/:id/invoice/send', orderController.sendInvoice);
router.get('/:orderId/invoice', invoiceController.getInvoice);

// Online Payment Routes
router.post('/:id/upload-slip', upload.single('file'), orderController.uploadBankSlip);
router.put('/:id/approve-payment', orderController.approvePayment);
router.put('/:id/reject-slip', orderController.rejectPaymentSlip);
router.post('/:id/receive-payment', orderController.markPaymentReceived);

module.exports = router;
