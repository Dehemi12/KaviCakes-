
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Customers ---');
    const customers = await prisma.customer.findMany();
    customers.forEach(c => console.log(`ID: ${c.id}, Email: ${c.email}, Name: ${c.name}`));

    console.log('\n--- Orders ---');
    const orders = await prisma.order.findMany();
    orders.forEach(o => console.log(`ID: ${o.id}, CustomerID: ${o.customerId}, Status: ${o.status}, Total: ${o.total}`));

    console.log('\n--- Payments ---');
    const payments = await prisma.payment.findMany();
    payments.forEach(p => console.log(`ID: ${p.id}, OrderID: ${p.orderId}, Status: ${p.paymentStatus}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
