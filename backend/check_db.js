const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Database Content...');

    const productCount = await prisma.product.count();
    console.log(`Products Found: ${productCount}`);

    const products = await prisma.product.findMany({
        include: { variants: true }
    });

    if (products.length > 0) {
        console.log('Sample Product:', JSON.stringify(products[0], null, 2));
    } else {
        console.log('❌ No products found! Seed might have failed silently or wasn\'t run.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
