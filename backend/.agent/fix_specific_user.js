
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Searching for user 'dehemi'...");
        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: 'dehemi' } },
                    { email: { contains: 'dehemi' } }
                ]
            }
        });

        if (customers.length === 0) {
            console.log("No customer found matching 'dehemi'. Listing all:");
            const all = await prisma.customer.findMany();
            all.forEach(c => console.log(`- ${c.name} (${c.email}) ID: ${c.id}`));
            return;
        }

        const targetUser = customers[0];
        console.log(`Found target user: ${targetUser.name} (${targetUser.email}) ID: ${targetUser.id}`);

        // Assign orders to this user
        const update = await prisma.order.updateMany({
            data: { customerId: targetUser.id }
        });
        console.log(`Updated ${update.count} orders to belong to ${targetUser.name}.`);

    } catch (e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}

main();
