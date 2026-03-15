
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log("Checking Customers and Orders...");
        const customers = await prisma.customer.findMany({
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        console.log("------------------------------------------------");
        console.log(`Total Customers: ${customers.length}`);
        console.log("------------------------------------------------");
        customers.forEach(c => {
            console.log(`ID: ${c.id} | Email: ${c.email} | Orders: ${c._count.orders}`);
        });
        console.log("------------------------------------------------");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
