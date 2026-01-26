const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const count = await prisma.cakeCategory.count();
        console.log(`Category Count in DB: ${count}`);

        if (count > 0) {
            const categories = await prisma.cakeCategory.findMany();
            console.log('Categories:', JSON.stringify(categories, null, 2));
        } else {
            console.log('No categories found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
