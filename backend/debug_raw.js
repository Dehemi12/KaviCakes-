const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const data = await prisma.$queryRaw`SELECT id FROM customer LIMIT 1`;
    console.log('Customer raw:', data);
    
    if (data.length > 0) {
        const order = await prisma.orders.findMany({
            where: { customerId: data[0].id },
            take: 1
        });
        console.log('Order for customer:', order);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
