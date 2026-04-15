const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/formFieldController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public (no auth) — customer-facing forms fetch this
router.get('/public/:formType', ctrl.getPublicFields);

// Admin-only routes
router.use(authMiddleware);
router.get('/:formType', ctrl.getFields);
router.post('/', ctrl.createField);
router.put('/reorder', ctrl.reorderFields);   // Must be BEFORE /:id
router.put('/:id', ctrl.updateField);
router.delete('/:id', ctrl.deleteField);

module.exports = router;
