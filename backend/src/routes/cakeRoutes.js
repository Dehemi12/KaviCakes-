const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/master-data', cakeController.getMasterData);
router.get('/', cakeController.getAllCakes);
router.get('/:id', cakeController.getCakeById); // Get Single Cake
router.post('/', cakeController.createCake); // Create Cake
router.delete('/:id', cakeController.deleteCake); // Delete Cake
router.put('/:id', cakeController.updateCake); // New Endpoint for Edit

// Master Data Management Routes
router.post('/categories', cakeController.createCategory);
router.put('/categories/:id', cakeController.updateCategory);
router.delete('/categories/:id', cakeController.deleteCategory);
router.post('/sizes', cakeController.createSize);
router.post('/shapes', cakeController.createShape);
router.post('/flavors', cakeController.createFlavor);

module.exports = router;
