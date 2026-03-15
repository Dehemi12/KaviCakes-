const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing old templates...');
    await prisma.notificationTemplate.deleteMany({});

    console.log('Seeding new templates relevant to requirements...');
    const templates = [
        {
            name: 'ORDER_PAYMENT_REMINDER',
            title: 'Payment Required: Confirm Order (Full/Advance)',
            category: 'Payment',
            body: 'Your order #{{order_id}} is scheduled for delivery on {{delivery_date}}.\n\nTo confirm preparation, payment must be completed 2 days before delivery:\n- COD: 30% Advance Payment\n- Online: Full Payment\n\nPlease complete your payment before the deadline to avoid order cancellation.',
            actionButton: 'Make Payment'
        },
        {
            name: 'SEASONAL_OFFER_NOTIFICATION',
            title: 'Special Seasonal Offer Just for You 🎉',
            category: 'Promotion',
            body: 'Celebrate the season with our special cake offers!\n\nEnjoy exclusive discounts on selected cakes for a limited time.\n\nBrowse our latest collection and make your celebration even sweeter.\n\nOffer valid until {{date}}.',
            actionButton: 'View Offers'
        },
        {
            name: 'PAYMENT_RECEIVED_BAKING',
            title: 'Payment Received: Preparation Starting Soon',
            category: 'Order',
            body: 'Hi {{name}}, great news! We have received your payment for order #{{order_id}}. We are about to start preparation for your delivery on {{delivery_date}}. We will notify you once your cake is ready!',
            actionButton: 'Track Order'
        },
    ];

    for (const t of templates) {
        await prisma.notificationTemplate.create({ data: t });
    }

    console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
