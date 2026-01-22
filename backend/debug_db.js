const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const orders = await prisma.order.findMany({
            include: { customer: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log('--- ORDER DEBUG START ---');
        console.log(JSON.stringify(orders, null, 2));
        console.log('--- ORDER DEBUG END ---');
    } catch (error) {
        console.error('Error:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
