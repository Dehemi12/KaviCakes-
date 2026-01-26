const express = require('express');
const router = express.Router();
const { getBulkPricing } = require('../controllers/bulkPricingController');

router.get('/', getBulkPricing);

module.exports = router;
