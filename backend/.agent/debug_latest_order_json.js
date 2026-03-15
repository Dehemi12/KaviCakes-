const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestOrder() {
    const latest = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
    });
    console.log(JSON.stringify(latest, null, 2));
}
checkLatestOrder();
