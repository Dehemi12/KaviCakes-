const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 1. Sales Revenue Report
router.get('/sales-revenue', reportController.getSalesRevenueReport);



// 3. Transaction History Report
router.get('/transaction-history', reportController.getTransactionHistoryReport);

// 4. Monthly Financial Summary
router.get('/monthly-summary', reportController.getMonthlyFinancialSummary);

// 5. Order Type Revenue Report
router.get('/order-type-revenue', reportController.getOrderTypeRevenueReport);

// 6. Top Selling Cake Report
router.get('/top-selling', reportController.getTopSellingCakeReport);

// 7. Outstanding Payment Report
router.get('/outstanding-payments', reportController.getOutstandingPaymentReport);



module.exports = router;
