const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// All wishlist routes require authentication
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/add', wishlistController.addToWishlist);
router.delete('/:cakeId', wishlistController.removeFromWishlist);
router.get('/status/:cakeId', wishlistController.checkWishlistStatus);

module.exports = router;
