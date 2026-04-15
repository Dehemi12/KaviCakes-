const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'saranimshara@gmail.com';
    const sara = await prisma.customer.findUnique({ where: { email } });
    
    if (!sara) {
        console.log('Sara not found');
        return;
    }

    console.log('Sara currently has:', sara.loyaltyPoints);
    
    // Give 5000 points
    await prisma.customer.update({
        where: { id: sara.id },
        data: { loyaltyPoints: 5000 }
    });
    console.log('Sara now has 5000 points!');

    // Create 3 orders to trigger different notifications
    // 1. Order delivering in 2 days (PAYMENT REMINDER)
    const d2 = new Date();
    d2.setDate(d2.getDate() + 2);
    const o1 = await prisma.order.create({
        data: {
            customerId: sara.id,
            total: 2500,
            balanceAmount: 2500,
            status: 'NEW',
            paymentMethod: 'ONLINE_PAYMENT',
            paymentStatus: 'PENDING',
            deliveryDate: d2
        }
    });
    console.log(`Created ORDER#${o1.id} (D-2) to trigger PAYMENT reminder notification`);

    // 2. Custom Order delivering in 4 days (EDIT REMINDER)
    const d4 = new Date();
    d4.setDate(d4.getDate() + 4);
    const o2 = await prisma.order.create({
        data: {
            customerId: sara.id,
            total: 3500,
            balanceAmount: 3500,
            status: 'NEW',
            orderType: 'CUSTOM',
            paymentMethod: 'COD',
            deliveryDate: d4
        }
    });
    console.log(`Created ORDER#${o2.id} (D-4) to trigger EDIT reminder notification`);

    // 3. Regular order (D-7) just for points testing
    const d7 = new Date();
    d7.setDate(d7.getDate() + 7);
    const o3 = await prisma.order.create({
        data: {
            customerId: sara.id,
            total: 1500,
            balanceAmount: 1500,
            status: 'NEW',
            deliveryDate: d7
        }
    });
    console.log(`Created ORDER#${o3.id} (D-7) for points/testing`);

    console.log('PLEASE REFRESH YOUR DASHBOARD - Notification triggers are checked upon page load on frontend');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
