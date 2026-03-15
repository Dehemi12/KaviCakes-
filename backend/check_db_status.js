const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DIAGNOSTIC START ---');
    try {
        const adminCount = await prisma.admin.count();
        console.log(`Admins: ${adminCount}`);

        const customerCount = await prisma.customer.count();
        console.log(`Customers: ${customerCount}`);

        const orderCount = await prisma.order.count();
        console.log(`Orders: ${orderCount}`);

        const cakeCount = await prisma.cake.count();
        console.log(`Cakes: ${cakeCount}`);

        console.log('--- DB CONNECTION SUCCESSFUL ---');
    } catch (error) {
        console.error('--- DB CONNECTION FAILED ---');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
