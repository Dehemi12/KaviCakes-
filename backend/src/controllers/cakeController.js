const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET All Cakes
exports.getAllCakes = async (req, res) => {
    try {
        const { categoryId, categoryName, search, sizeId, shapeId, flavorId } = req.query;

        const where = {};

        // Filter by Category
        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        } else if (categoryName && categoryName !== 'All') {
            where.category = {
                name: categoryName // Case sensitive usually, unless configured otherwise
            };
        }

        if (search) {
            where.name = { contains: search };
        }

        // Filter by Variants (Size, Shape, Flavor)
        const variantFilters = {};
        if (sizeId) variantFilters.sizeId = parseInt(sizeId);
        if (shapeId) variantFilters.shapeId = parseInt(shapeId);
        if (flavorId) variantFilters.flavorId = parseInt(flavorId);

        if (Object.keys(variantFilters).length > 0) {
            where.variants = {
                some: variantFilters
            };
        }

        const cakes = await prisma.cake.findMany({
            where,
            include: {
                category: true, // properties: id, name, basePrice
                variants: {
                    include: { size: true, shape: true, flavor: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format response to flat structure where basePrice is top-level
        const formatted = cakes.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            imageUrl: c.imageUrl,
            ingredients: c.ingredients,
            availability: c.availability,
            categoryId: c.categoryId,
            categoryName: c.category.name,
            basePrice: parseFloat(c.category.basePrice), // Inherited from Category
            variants: c.variants.map(v => ({
                id: v.id,
                price: parseFloat(v.price), // Modifier/Specific price
                size: v.size,
                shape: v.shape,
                flavor: v.flavor
            })),
            createdAt: c.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET Master Data (Dropdowns) - Now includes Categories
exports.getMasterData = async (req, res) => {
    try {
        const [sizes, shapes, flavors, categories] = await Promise.all([
            prisma.cakeSize.findMany(),
            prisma.cakeShape.findMany(),
            prisma.cakeFlavor.findMany(),
            prisma.cakeCategory.findMany()
        ]);
        res.json({ sizes, shapes, flavors, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch master data' });
    }
};

// POST Create Category (New)
exports.createCategory = async (req, res) => {
    try {
        const { name, basePrice } = req.body;
        const category = await prisma.cakeCategory.create({
            data: {
                name,
                basePrice: parseFloat(basePrice)
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// POST Create Cake
exports.createCake = async (req, res) => {
    try {
        const { name, categoryId, description, ingredients, imageUrl, variants } = req.body;

        // Verify category exists
        const category = await prisma.cakeCategory.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!category) {
            return res.status(400).json({ error: 'Invalid Category ID' });
        }

        const newCake = await prisma.cake.create({
            data: {
                name,
                categoryId: parseInt(categoryId),
                // basePrice IS NO LONGER STORED HERE
                description,
                ingredients,
                imageUrl,
                variants: {
                    create: variants.map(v => ({
                        price: v.price,
                        sizeId: v.sizeId,
                        shapeId: v.shapeId,
                        flavorId: v.flavorId
                    }))
                }
            },
            include: { variants: true }
        });

        res.status(201).json(newCake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create cake' });
    }
};

// DELETE Cake
exports.deleteCake = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cake.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Cake deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete' });
    }
};
