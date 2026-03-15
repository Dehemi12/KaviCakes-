const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDehemi() {
    try {
        console.log("Searching for 'dehemi' users...");

        // Find users with 'dehemi' in email or name
        const users = await prisma.customer.findMany({
            where: {
                OR: [
                    { email: { contains: 'dehemi' } },
                    { name: { contains: 'dehemi' } }
                ]
            }
        });

        console.log("Found Users:", users.map(u => `${u.id} | ${u.email} | ${u.name}`));

        if (users.length === 0) {
            console.log("No Dehemi found. Listing ALL users:");
            const all = await prisma.customer.findMany({ select: { id: true, email: true } });
            console.log(all);
            return;
        }

        // Target: logic is to pick the one that looks like 'deheminimshara@gmail.com' or the last one
        let targetUser = users.find(u => u.email === 'deheminimshara@gmail.com') || users[0];
        console.log(`\nTARGET USER SELECTED: ${targetUser.email} (ID: ${targetUser.id})`);

        // Move ALL orders to this user
        const update = await prisma.order.updateMany({
            data: { customerId: targetUser.id }
        });

        console.log(`\n✅ MOVED ALL ${update.count} ORDRES TO [${targetUser.email}]`);
        console.log("Now refresh the page!");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixDehemi();
