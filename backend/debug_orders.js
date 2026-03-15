const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTICS START ---');

    try {
        // 1. Check DB Connection & Counts
        const userCount = await prisma.customer.count();
        const orderCount = await prisma.order.count();
        console.log(`Customers: ${userCount}`);
        console.log(`Orders: ${orderCount}`);

        if (userCount === 0) {
            console.log('WARNING: No customers found. Cannot create test order.');
            return;
        }

        // 2. Get a customer
        const customer = await prisma.customer.findFirst();
        console.log(`Using Customer: ${customer.email} (ID: ${customer.id})`);

        // 3. Attempt to Create a Test Order
        console.log('Attempting to create TEST order...');

        // Create a dummy order
        // Note: We need valid relations. If variants exist, use one, else use null.
        // Check variants
        const variant = await prisma.cakeVariant.findFirst();
        const variantId = variant ? variant.id : null;

        const order = await prisma.order.create({
            data: {
                customerId: customer.id,
                total: 1500,
                status: 'NEW',
                items: {
                    create: [{
                        quantity: 1,
                        unitPrice: 1500,
                        variantId: variantId // Nullable
                    }]
                },
                payment: {
                    create: {
                        paymentMethod: "COD",
                        paymentStatus: "PENDING"
                    }
                },
                delivery: {
                    create: {
                        address: "Test Address",
                        deliveryFee: 100
                    }
                }
            }
        });

        console.log('SUCCESS: Order created via Prisma.');
        console.log(`Created Order ID: ${order.id}`);

        // 4. Verify Dashboard query
        console.log('Verifying Dashboard Query...');
        const recent = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        console.log(`Dashboard would fetch ${recent.length} orders.`);
        if (recent.length > 0) {
            console.log('Top order customer:', recent[0].customer?.name);
        }

    } catch (e) {
        console.error('FAILURE:', e);
    } finally {
        console.log('--- DIAGNOSTICS END ---');
        await prisma.$disconnect();
    }
}

main();
