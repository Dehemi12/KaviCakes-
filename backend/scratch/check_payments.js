const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPaymentMethods() {
    try {
        const methods = await prisma.orders.groupBy({
            by: ['paymentMethod'],
            _count: {
                paymentMethod: true
            }
        });
        console.log('Payment Method Distribution:');
        console.table(methods);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPaymentMethods();
