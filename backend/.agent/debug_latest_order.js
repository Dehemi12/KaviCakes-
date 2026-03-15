const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestOrder() {
    try {
        const latestOrder = await prisma.order.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        if (!latestOrder) {
            console.log("No orders found in DB.");
            return;
        }

        console.log("=== LATEST ORDER DEBUG ===");
        console.log(`Order ID: ${latestOrder.id}`);
        console.log(`Created At: ${latestOrder.createdAt}`);
        console.log(`Customer ID: ${latestOrder.customerId}`);
        console.log(`Customer Email: ${latestOrder.customer?.email}`);
        console.log(`Customer Name: ${latestOrder.customer?.firstName} ${latestOrder.customer?.lastName}`);
        console.log("==========================");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestOrder();
