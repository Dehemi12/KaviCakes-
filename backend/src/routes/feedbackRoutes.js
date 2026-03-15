const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public Route
router.get('/public', feedbackController.getPublicFeedbacks);

// Protected Routes
router.use(authMiddleware);

router.get('/', feedbackController.getAllFeedback);
router.post('/', feedbackController.createFeedback);
router.put('/:id/status', feedbackController.updateFeedbackStatus);
router.post('/:id/reply', feedbackController.replyToFeedback);

module.exports = router;
