
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const targetEmail = 'woofydehemi@gmail.com';
        const targetUser = await prisma.customer.findUnique({ where: { email: targetEmail } });

        if (!targetUser) {
            console.log(`User ${targetEmail} not found!`);
            // Try locating by name
            const byName = await prisma.customer.findFirst({ where: { name: 'dehemi' } });
            if (byName) {
                console.log(`Found by name 'dehemi': ${byName.email} (${byName.id})`);
                await moveOrders(byName.id);
            } else {
                console.log("No user found with name 'dehemi' either.");
            }
            return;
        }

        console.log(`Found target User: ${targetUser.email} (ID: ${targetUser.id})`);
        await moveOrders(targetUser.id);

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

async function moveOrders(userId) {
    const result = await prisma.order.updateMany({
        data: { customerId: userId }
    });
    console.log(`Moved ALL orders (${result.count}) to Customer ID: ${userId}`);
}

main();
