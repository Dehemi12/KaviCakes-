const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOnlineOrders() {
    try {
        const stats = await prisma.orders.groupBy({
            by: ['status', 'paymentMethod'],
            _count: {
                id: true
            }
        });
        console.log('Order Status + Payment Method Breakdown:');
        console.table(stats);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOnlineOrders();
