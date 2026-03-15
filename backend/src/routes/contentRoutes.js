const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes (if any needed, e.g. fetching without auth?)
// Usually settings are fetched by frontend which might be public
router.get('/settings', contentController.getSiteSettings);

// Protected routes
router.use(authMiddleware);

router.put('/settings', contentController.updateSiteSettings);

module.exports = router;
