const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting deep clean of customer data...');

    // 1. Clean dependencies of Orders
    console.log('- Deleting ItemRatings...');
    await prisma.itemRating.deleteMany({});

    console.log('- Deleting Order Items...');
    await prisma.orderItem.deleteMany({});

    console.log('- Deleting Deliveries...');
    await prisma.delivery.deleteMany({});

    console.log('- Deleting Invoices...');
    await prisma.invoice.deleteMany({});

    console.log('- Deleting Custom/Bulk Order details...');
    await prisma.customOrder.deleteMany({});
    await prisma.bulkOrder.deleteMany({});

    // Transaction logic: only delete those linked to payments
    console.log('- Deleting Payment-linked Transactions...');
    await prisma.transaction.deleteMany({
        where: {
            paymentId: { not: null }
        }
    });

    console.log('- Deleting Payments...');
    await prisma.payment.deleteMany({});

    // 2. Clean Direct Customer Dependencies
    console.log('- Deleting Feedbacks...');
    await prisma.feedback.deleteMany({});

    console.log('- Deleting Orders...');
    await prisma.order.deleteMany({});

    console.log('- Deleting CartItems...');
    await prisma.cartItem.deleteMany({});

    console.log('- Deleting Carts...');
    await prisma.cart.deleteMany({});

    console.log('- Deleting LoyaltyTransactions...');
    await prisma.loyaltyTransaction.deleteMany({});

    // 3. Finally Customer
    console.log('- Deleting Customers...');
    await prisma.customer.deleteMany({});

    console.log('✅ Successfully erased all customer data.');
}

main()
    .catch(e => {
        console.error('Error wiping data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
