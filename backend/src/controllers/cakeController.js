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

        const queryOptions = {
            where,
            include: {
                category: true, // properties: id, name, basePrice
                variants: {
                    include: { size: true, shape: true, flavor: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        };

        if (req.query.limit) {
            queryOptions.take = parseInt(req.query.limit);
        }

        const cakes = await prisma.cake.findMany(queryOptions);

        // Format response to flat structure where basePrice is top-level
        const formatted = cakes.map(c => {
            // Find 1kg variant for default price display
            const variant1kg = c.variants.find(v => v.size && v.size.label === '1kg');
            const categoryBase = parseFloat(c.category.basePrice);
            // Default to category base if 1kg not found (fallback), otherwise add variant price
            const displayPrice = variant1kg ? (categoryBase + parseFloat(variant1kg.price)) : categoryBase;

            return {
                id: c.id,
                name: c.name,
                description: c.description,
                imageUrl: c.imageUrl,
                ingredients: c.ingredients,
                availability: c.availability,
                categoryId: c.categoryId,
                categoryName: c.category.name,
                basePrice: categoryBase, // Raw category base
                price: displayPrice, // Calculated 1kg price for display
                variants: c.variants.map(v => ({
                    id: v.id,
                    price: parseFloat(v.price), // Modifier/Specific price
                    size: v.size,
                    shape: v.shape,
                    flavor: v.flavor
                })),
                createdAt: c.createdAt
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET Cake by ID
exports.getCakeById = async (req, res) => {
    try {
        const { id } = req.params;
        const cake = await prisma.cake.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                variants: {
                    include: { size: true, shape: true, flavor: true }
                }
            }
        });

        if (!cake) return res.status(404).json({ error: 'Cake not found' });

        // Find 1kg variant for default price display
        const variant1kg = cake.variants.find(v => v.size && v.size.label === '1kg');
        const categoryBase = parseFloat(cake.category.basePrice);
        const displayPrice = variant1kg ? (categoryBase + parseFloat(variant1kg.price)) : categoryBase;

        // Format to match frontend expectations
        const formatted = {
            id: cake.id,
            name: cake.name,
            description: cake.description,
            imageUrl: cake.imageUrl,
            ingredients: cake.ingredients,
            availability: cake.availability,
            categoryId: cake.categoryId,
            categoryName: cake.category.name,
            basePrice: categoryBase,
            price: displayPrice, // Calculated 1kg price
            variants: cake.variants.map(v => ({
                id: v.id,
                price: parseFloat(v.price),
                size: v.size,
                shape: v.shape,
                flavor: v.flavor
            })),
            createdAt: cake.createdAt
        };

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

        const parsedCategoryId = parseInt(categoryId);
        if (isNaN(parsedCategoryId)) {
            return res.status(400).json({ error: 'Invalid Category ID' });
        }

        // Verify category exists
        const category = await prisma.cakeCategory.findUnique({
            where: { id: parsedCategoryId }
        });

        if (!category) {
            return res.status(400).json({ error: 'Invalid Category ID' });
        }

        const newCake = await prisma.cake.create({
            data: {
                name,
                categoryId: parsedCategoryId,
                description,
                ingredients,
                imageUrl,
                variants: {
                    create: Array.isArray(variants) ? variants.map(v => ({
                        price: parseFloat(v.price || 0),
                        sizeId: v.sizeId ? parseInt(v.sizeId) : null,
                        shapeId: v.shapeId ? parseInt(v.shapeId) : null,
                        flavorId: v.flavorId ? parseInt(v.flavorId) : null
                    })) : []
                }
            },
            include: { variants: true }
        });

        res.status(201).json(newCake);
    } catch (error) {
        console.error('Create Cake Error:', error); // Log full error
        // Return detailed error for debugging (remove in prod)
        res.status(500).json({ error: `Failed to create cake: ${error.message}` });
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

// PUT Update Cake
exports.updateCake = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, categoryId, description, ingredients, imageUrl, variants, availability } = req.body;

        // Transaction to handle variants update (replace strategy for simplicity or update existing?)
        // Simple strategy: Delete all variants and re-create them, or update carefully.
        // For editing, let's assume we replace the variant list for now.

        const updatedCake = await prisma.$transaction(async (prisma) => {
            // Update basic details
            const cake = await prisma.cake.update({
                where: { id: parseInt(id) },
                data: {
                    name,
                    categoryId: parseInt(categoryId),
                    description,
                    ingredients,
                    imageUrl,
                    availability
                }
            });

            // If variants provided, replace them
            if (variants) {
                // Delete existing
                await prisma.cakeVariant.deleteMany({
                    where: { cakeId: parseInt(id) }
                });

                // Create new
                await prisma.cakeVariant.createMany({
                    data: variants.map(v => ({
                        cakeId: parseInt(id),
                        price: v.price,
                        sizeId: v.sizeId,
                        shapeId: v.shapeId,
                        flavorId: v.flavorId
                    }))
                });
            }

            return cake;
        });

        res.json(updatedCake);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update cake' });
    }
};

// POST Create Size
exports.createSize = async (req, res) => {
    try {
        const { label, price } = req.body;
        const size = await prisma.cakeSize.create({ data: { label, price: parseFloat(price || 0) } });
        res.status(201).json(size);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// POST Create Shape
exports.createShape = async (req, res) => {
    try {
        const { label, price } = req.body;
        const shape = await prisma.cakeShape.create({ data: { label, price: parseFloat(price || 0) } });
        res.status(201).json(shape);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// POST Create Flavor
exports.createFlavor = async (req, res) => {
    try {
        const { label, price } = req.body;
        const flavor = await prisma.cakeFlavor.create({ data: { label, price: parseFloat(price || 0) } });
        res.status(201).json(flavor);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
