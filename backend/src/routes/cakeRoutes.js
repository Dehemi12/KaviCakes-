const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', cakeController.getAllCakes);
router.get('/master-data', cakeController.getMasterData);
router.post('/categories', cakeController.createCategory); // New Endpoint
router.post('/', cakeController.createCake);
router.delete('/:id', cakeController.deleteCake);

module.exports = router;
