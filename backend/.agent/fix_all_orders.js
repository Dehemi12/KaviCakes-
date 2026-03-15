const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        console.log("1. Finding user 'woofydehemi@gmail.com'...");
        const user = await prisma.customer.findUnique({
            where: { email: 'woofydehemi@gmail.com' }
        });

        if (!user) {
            console.error("User not found! Please register 'woofydehemi@gmail.com' first.");
            return;
        }

        console.log(`   Found User ID: ${user.id}`);

        console.log("2. Updating ALL orders to belong to this user...");
        const result = await prisma.order.updateMany({
            data: { customerId: user.id }
        });

        console.log(`   SUCCESS: Updated ${result.count} orders. They are now ALL linked to 'woofydehemi@gmail.com'.`);
        console.log("3. Please refresh the 'My Orders' page.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
