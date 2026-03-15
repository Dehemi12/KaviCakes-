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
                name: categoryName
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

        // Format to simplified structure for frontend
        const formatted = cakes.map(c => {
            // Calculate display price (logic: Category Base + Variant Price)
            // If no variants, just base price.
            // If variants exist, try to find a balanced one or just take the first.

            let displayPrice = parseFloat(c.category.basePrice || 0);

            // Prefer 1kg variant if exists to show "starting" or "standard" price
            const standardVariant = c.variants.find(v => v.size && v.size.label === '1kg') || c.variants[0];

            if (standardVariant) {
                // In new schema, variant.price is the Final/Computed price or Modifier. 
                // If it's the specific price for that combo, we use it directly.
                // If it's 0 (admin didn't set it), fallback to basePrice.
                displayPrice = parseFloat(standardVariant.price) || parseFloat(c.category.basePrice || 0);
            }

            return {
                id: c.id,
                name: c.name,
                description: c.description,
                imageUrl: c.imageUrl,
                ingredients: c.ingredients,
                availability: c.availability,
                categoryId: c.categoryId,
                categoryName: c.category.name,
                basePrice: parseFloat(c.category.basePrice),
                price: displayPrice,
                variants: c.variants.map(v => ({
                    id: v.id,
                    price: parseFloat(v.price),
                    size: v.size,
                    shape: v.shape,
                    flavor: v.flavor
                })),
                createdAt: c.createdAt
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('[CakeController] Error:', error);
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

        let displayPrice = parseFloat(cake.category.basePrice || 0);
        const standardVariant = cake.variants.find(v => v.size && v.size.label === '1kg') || cake.variants[0];
        if (standardVariant) {
            displayPrice = parseFloat(standardVariant.price) || parseFloat(cake.category.basePrice || 0);
        }

        const formatted = {
            id: cake.id,
            name: cake.name,
            description: cake.description,
            imageUrl: cake.imageUrl,
            ingredients: cake.ingredients,
            availability: cake.availability,
            categoryId: cake.categoryId,
            categoryName: cake.category.name,
            basePrice: parseFloat(cake.category.basePrice),
            price: displayPrice,
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
        console.error('[CakeController] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET Master Data (Dropdowns)
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
        console.error('[CakeController:getMasterData] Error:', error);
        res.status(500).json({ error: 'Failed to fetch master data' });
    }
};

// POST Create Category
exports.createCategory = async (req, res) => {
    try {
        const { name, basePrice, imageUrl } = req.body;
        const category = await prisma.cakeCategory.create({
            data: {
                name,
                basePrice: parseFloat(basePrice || 0),
                imageUrl: imageUrl || null
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('[CakeController:createCategory] Error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// PUT Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, basePrice, imageUrl } = req.body;

        const category = await prisma.cakeCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                basePrice: parseFloat(basePrice || 0),
                imageUrl
            }
        });
        res.json(category);
    } catch (error) {
        console.error('[CakeController:updateCategory] Error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// DELETE Category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if cakes exist
        const count = await prisma.cake.count({ where: { categoryId: parseInt(id) } });
        if (count > 0) {
            return res.status(400).json({ error: 'Cannot delete category with existing cakes' });
        }
        await prisma.cakeCategory.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('[CakeController:deleteCategory] Error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
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

        const category = await prisma.cakeCategory.findUnique({
            where: { id: parsedCategoryId }
        });

        if (!category) {
            return res.status(400).json({ error: 'Category not found' });
        }

        // Prepare variants data with strict validation
        const variantsData = [];
        if (Array.isArray(variants)) {
            for (const v of variants) {
                if (!v.sizeId || !v.shapeId || !v.flavorId) {
                    continue; // Skip invalid variants in the loop, or throw error
                }
                variantsData.push({
                    price: parseFloat(v.price || 0),
                    sizeId: parseInt(v.sizeId),
                    shapeId: parseInt(v.shapeId),
                    flavorId: parseInt(v.flavorId)
                });
            }
        }

        const newCake = await prisma.cake.create({
            data: {
                name,
                categoryId: parsedCategoryId,
                description,
                ingredients,
                imageUrl,
                variants: {
                    create: variantsData
                }
            },
            include: { variants: true }
        });

        res.status(201).json(newCake);
    } catch (error) {
        console.error('[CakeController:createCake] Error:', error);
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
        console.error('[CakeController:deleteCake] Error:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
};

// PUT Update Cake
exports.updateCake = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, categoryId, description, ingredients, imageUrl, variants, availability } = req.body;

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
            if (variants && Array.isArray(variants)) {
                // Delete existing
                await prisma.cakeVariant.deleteMany({
                    where: { cakeId: parseInt(id) }
                });

                // Filter valid variants
                const validVariants = variants
                    .filter(v => v.sizeId && v.shapeId && v.flavorId)
                    .map(v => ({
                        cakeId: parseInt(id),
                        price: parseFloat(v.price),
                        sizeId: parseInt(v.sizeId),
                        shapeId: parseInt(v.shapeId),
                        flavorId: parseInt(v.flavorId)
                    }));

                // Create new
                if (validVariants.length > 0) {
                    await prisma.cakeVariant.createMany({
                        data: validVariants
                    });
                }
            }

            return cake;
        });

        res.json(updatedCake);
    } catch (error) {
        console.error('[CakeController:updateCake] Error:', error);
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
        console.error('[CakeController] Error:', error); res.status(500).json({ error: 'Failed' });
    }
};

// POST Create Shape
exports.createShape = async (req, res) => {
    try {
        const { label, price } = req.body;
        const shape = await prisma.cakeShape.create({ data: { label, price: parseFloat(price || 0) } });
        res.status(201).json(shape);
    } catch (error) {
        console.error('[CakeController] Error:', error); res.status(500).json({ error: 'Failed' });
    }
};

// POST Create Flavor
exports.createFlavor = async (req, res) => {
    try {
        const { label, price } = req.body;
        const flavor = await prisma.cakeFlavor.create({ data: { label, price: parseFloat(price || 0) } });
        res.status(201).json(flavor);
    } catch (error) {
        console.error('[CakeController] Error:', error); res.status(500).json({ error: 'Failed' });
    }
};

