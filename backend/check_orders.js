const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const lastOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, deliveryDate: true, createdAt: true, status: true }
    });
    console.log('Last 5 Orders:', JSON.stringify(lastOrders, null, 2));
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
