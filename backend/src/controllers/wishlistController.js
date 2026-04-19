const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get customer wishlist
exports.getWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const wishlist = await prisma.wishlist.findMany({
            where: { customerId },
            include: {
                cake: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format to match frontend expectations
        const formattedWishlist = wishlist.map(item => ({
            id: item.cake.id,
            name: item.cake.name,
            image: item.cake.imageUrl,
            price: item.cake.category.basePrice,
            category: item.cake.category.name
        }));

        res.json(formattedWishlist);
    } catch (error) {
        console.error('[WishlistController:getWishlist] Error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { cakeId } = req.body;

        if (!cakeId) {
            return res.status(400).json({ error: 'Cake ID is required' });
        }

        const wishlistItem = await prisma.wishlist.upsert({
            where: {
                customerId_cakeId: {
                    customerId,
                    cakeId: parseInt(cakeId)
                }
            },
            create: {
                customerId,
                cakeId: parseInt(cakeId)
            },
            update: {} // Do nothing if already exists
        });

        res.status(201).json({ message: 'Added to wishlist', item: wishlistItem });
    } catch (error) {
        console.error('[WishlistController:addToWishlist] Error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const customerId = req.user.id;
        const cakeId = parseInt(req.params.cakeId);

        await prisma.wishlist.delete({
            where: {
                customerId_cakeId: {
                    customerId,
                    cakeId
                }
            }
        });

        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('[WishlistController:removeFromWishlist] Error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
};

// Check if item is in wishlist
exports.checkWishlistStatus = async (req, res) => {
    try {
        const customerId = req.user.id;
        const cakeId = parseInt(req.params.cakeId);

        const item = await prisma.wishlist.findUnique({
            where: {
                customerId_cakeId: {
                    customerId,
                    cakeId
                }
            }
        });

        res.json({ isWishlisted: !!item });
    } catch (error) {
        console.error('[WishlistController:checkWishlistStatus] Error:', error);
        res.status(500).json({ error: 'Failed to check wishlist status' });
    }
};
