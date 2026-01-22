const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticateToken = require('../middlewares/authMiddleware');

// Protected routes (Admin only)
router.get('/', authenticateToken, transactionController.getAllTransactions);
router.post('/', authenticateToken, transactionController.addTransaction);
router.get('/summary', authenticateToken, transactionController.getFinancialSummary);

module.exports = router;
