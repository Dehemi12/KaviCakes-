const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log("=== DIAGNOSTIC REPORT ===");

        // 1. List all customers
        const customers = await prisma.customer.findMany({
            select: { id: true, email: true, name: true }
        });
        console.log("\n--- CUSTOMERS ---");
        console.table(customers);

        // 2. Count orders per customer
        const orders = await prisma.order.findMany({
            select: { id: true, customerId: true, status: true }
        });

        console.log("\n--- ORDER COUNTS ---");
        const counts = {};
        orders.forEach(o => {
            counts[o.customerId] = (counts[o.customerId] || 0) + 1;
        });
        console.table(counts);

        console.log("\nTOTAl ORDERS:", orders.length);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
