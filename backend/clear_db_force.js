const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting Feedbacks...');
    await prisma.feedback.deleteMany({});

    console.log('Deleting Orders...');
    await prisma.order.deleteMany({});

    console.log('Deleting Customers...');
    await prisma.customer.deleteMany({});

    console.log('Cleaned up database');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
