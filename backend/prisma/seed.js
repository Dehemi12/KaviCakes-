const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // --- 1. Master Data ---

    // Sizes
    const size1kg = await prisma.cakeSize.upsert({ where: { label: '1kg' }, update: {}, create: { label: '1kg', price: 0 } });
    const size2kg = await prisma.cakeSize.upsert({ where: { label: '2kg' }, update: {}, create: { label: '2kg', price: 1000 } });
    const size3kg = await prisma.cakeSize.upsert({ where: { label: '3kg' }, update: {}, create: { label: '3kg', price: 1800 } });

    // Shapes
    const shapeRound = await prisma.cakeShape.upsert({ where: { label: 'Round' }, update: {}, create: { label: 'Round', price: 0 } });
    const shapeSquare = await prisma.cakeShape.upsert({ where: { label: 'Square' }, update: {}, create: { label: 'Square', price: 200 } });
    const shapeHeart = await prisma.cakeShape.upsert({ where: { label: 'Heart' }, update: {}, create: { label: 'Heart', price: 200 } });

    // Flavors
    const flavorChoc = await prisma.cakeFlavor.upsert({ where: { label: 'Chocolate' }, update: {}, create: { label: 'Chocolate', price: 0 } });
    const flavorVan = await prisma.cakeFlavor.upsert({ where: { label: 'Vanilla' }, update: {}, create: { label: 'Vanilla', price: 0 } });
    const flavorRV = await prisma.cakeFlavor.upsert({ where: { label: 'Red Velvet' }, update: {}, create: { label: 'Red Velvet', price: 200 } });

    console.log('Master data created.');

    // --- 2. Categories ---

    const catBirthday = await prisma.cakeCategory.upsert({
        where: { name: 'Birthday' },
        update: {},
        create: { name: 'Birthday', basePrice: 1200 }
    });

    const catCupcakes = await prisma.cakeCategory.upsert({
        where: { name: 'Cupcakes' },
        update: {},
        create: { name: 'Cupcakes', basePrice: 950 }
    });

    const catAnniversary = await prisma.cakeCategory.upsert({
        where: { name: 'Anniversary' },
        update: {},
        create: { name: 'Anniversary', basePrice: 1400 }
    });

    const catWedding = await prisma.cakeCategory.upsert({
        where: { name: 'Wedding' },
        update: {},
        create: { name: 'Wedding', basePrice: 5000 }
    });

    console.log('Categories created.');

    // --- 3. Cakes ---

    const cake1 = await prisma.cake.create({
        data: {
            name: 'Chocolate Fudge Cake',
            description: 'Rich chocolate cake with fudge frosting and chocolate ganache drip. Perfect for any chocolate lover.',
            ingredients: 'Flour, Sugar, Cocoa Powder, Eggs, Butter, Milk',
            imageUrl: 'https://placehold.co/600x600/3e2723/ffffff?text=Chocolate',
            categoryId: catBirthday.id,
            variants: {
                create: [
                    { sizeId: size1kg.id, shapeId: shapeRound.id, flavorId: flavorChoc.id, price: 1200.00 },
                    { sizeId: size2kg.id, shapeId: shapeSquare.id, flavorId: flavorChoc.id, price: 2200.00 }
                ]
            }
        }
    });

    const cake2 = await prisma.cake.create({
        data: {
            name: 'Vanilla Buttercream',
            description: 'Classic vanilla sponge with smooth buttercream frosting.',
            ingredients: 'Flour, Sugar, Vanilla Extract, Eggs, Butter',
            imageUrl: 'https://placehold.co/600x600/fff9c4/fbc02d?text=Vanilla',
            categoryId: catCupcakes.id,
            variants: {
                create: [
                    { sizeId: size1kg.id, shapeId: shapeRound.id, flavorId: flavorVan.id, price: 950.00 }
                ]
            }
        }
    });

    const cake3 = await prisma.cake.create({
        data: {
            name: 'Red Velvet Cake',
            description: 'Soft and velvety crumb with signature cream cheese frosting.',
            ingredients: 'Flour, Sugar, Cocoa, Red Dye, Vinegar, Buttermilk',
            imageUrl: 'https://placehold.co/600x600/b71c1c/ffffff?text=Red+Velvet',
            categoryId: catAnniversary.id,
            variants: {
                create: [
                    { sizeId: size1kg.id, shapeId: shapeHeart.id, flavorId: flavorRV.id, price: 1600.00 }
                ]
            }
        }
    });

    const cake4 = await prisma.cake.create({
        data: {
            name: 'Elegant White Wedding',
            description: 'Tiered elegance for your special day.',
            ingredients: 'Flour, Sugar, Butter, Eggs, Fondant',
            imageUrl: 'https://placehold.co/600x600/eceff1/455a64?text=Wedding',
            categoryId: catWedding.id,
            variants: {
                create: [
                    { sizeId: size3kg.id, shapeId: shapeRound.id, flavorId: flavorVan.id, price: 5000.00 }
                ]
            }
        }
    });

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
