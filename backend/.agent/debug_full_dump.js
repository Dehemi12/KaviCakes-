
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- All Customers ---");
        const customers = await prisma.customer.findMany();
        customers.forEach(c => console.log(`[Customer] Name: ${c.name}, Email: ${c.email}, ID: ${c.id}`));

        console.log("\n--- All Orders ---");
        const orders = await prisma.order.findMany();
        orders.forEach(o => console.log(`[Order] ID: ${o.id}, Assigned CustomerID: ${o.customerId}`));

        const targetEmail = 'woofydehemi@gmail.com'; // Based on previous output hint
        // Wait, the previous output was truncated: "(woofydehemi@gmail.com): 6"

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
