
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const customers = await prisma.customer.findMany();
        // Simplified output to avoid truncation
        customers.forEach((c, i) => {
            console.log(`User ${i + 1}: ${c.email} | ID starts with: ${c.id.substring(0, 5)}`);
        });
    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
