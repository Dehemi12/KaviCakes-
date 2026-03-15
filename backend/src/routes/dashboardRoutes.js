const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all dashboard routes
router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/monthly-analysis', dashboardController.getMonthlyAnalysis);

module.exports = router;
