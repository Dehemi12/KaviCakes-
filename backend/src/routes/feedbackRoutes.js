const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', feedbackController.getAllFeedback);
router.put('/:id/status', feedbackController.updateFeedbackStatus);

module.exports = router;
