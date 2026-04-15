const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // detailed logging
    console.log('Connecting to database...');

    // Find a customer to attach order to
    const customer = await prisma.customer.findFirst();
    if (!customer) {
        console.log('❌ No customers found. Run seed.js first.');
        return;
    }

    console.log(`Found customer: ${customer.name}`);

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const total = Math.floor(Math.random() * 5000) + 1000;
    
    // Create a new random order
    const newOrder = await prisma.order.create({
        data: {
            customerId: customer.id,
            total: total,
            balanceAmount: total,
            status: 'NEW',
            deliveryDate: deliveryDate,
            createdAt: new Date(),
        }
    });

    console.log(`✅ Created Order #${newOrder.id} for Rs.${newOrder.total}`);
    console.log('PLEASE REFRESH YOUR DASHBOARD TO SEE THE CHANGE!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
