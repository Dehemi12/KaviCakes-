
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const customers = await prisma.customer.findMany();
        console.log(`\nFound ${customers.length} Customers:`);
        customers.forEach(c => console.log(JSON.stringify({ id: c.id, email: c.email, name: c.name })));

        const orders = await prisma.order.findMany();
        console.log(`\nFound ${orders.length} Orders:`);
        orders.forEach(o => console.log(JSON.stringify({
            id: o.id,
            customerId: o.customerId,
            status: o.status,
            paymentStatus: o.paymentStatus
        })));

        if (customers.length > 0 && orders.length > 0) {
            // Check for mismatch
            const firstCustomer = customers[0];
            const ordersForFirst = orders.filter(o => o.customerId === firstCustomer.id);
            console.log(`\nOrders belonging to first customer (${firstCustomer.email}): ${ordersForFirst.length}`);

            const orphans = orders.filter(o => !customers.find(c => c.id === o.customerId));
            console.log(`Orphan orders (no valid customer): ${orphans.length}`);

            if (ordersForFirst.length === 0 && orders.length > 0) {
                console.log("WARNING: First customer has 0 orders, but orders exist in DB.");
            }
        }

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
