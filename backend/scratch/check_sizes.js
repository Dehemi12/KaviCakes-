const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSizes() {
    try {
        const sizes = await prisma.cakesize.findMany();
        console.log('Existing Sizes:');
        console.table(sizes);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSizes();
