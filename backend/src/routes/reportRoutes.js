const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
// const { protect, adminOnly } = require('../middlewares/authMiddleware'); // Uncomment if auth is needed

// Sales and Revenue Report
router.get('/sales-revenue', reportController.getSalesRevenueReport);

module.exports = router;
