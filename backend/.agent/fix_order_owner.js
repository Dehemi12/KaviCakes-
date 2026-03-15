
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const customers = await prisma.customer.findMany();
        if (customers.length === 0) {
            console.log("No customers found!");
            return;
        }

        // Pick the first customer (usually the one being used in dev)
        const targetCustomer = customers[0];
        console.log(`Assigning ALL orders to Customer: ${targetCustomer.email} (ID: ${targetCustomer.id})`);

        const updateResult = await prisma.order.updateMany({
            data: {
                customerId: targetCustomer.id
            }
        });

        console.log(`Updated ${updateResult.count} orders.`);

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
