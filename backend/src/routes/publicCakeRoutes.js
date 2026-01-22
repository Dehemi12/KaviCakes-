const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');

// Public Routes - No Auth Middleware

// GET /api/public/cakes
router.get('/', cakeController.getAllCakes);

// GET /api/public/cakes/master-data
router.get('/master-data', cakeController.getMasterData);

module.exports = router;
