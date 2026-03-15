const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating Pack Prices...');

    const updates = [
        { label: '12 pack', price: 2000 },
        { label: '6 pack', price: 1000 },
        // Usually user meant 1000. If they specifically meant "six pack" label, I'll add it too just in case.
        // But consistent naming suggests '6 pack'.
        { label: 'six pack', price: 1000 }
    ];

    for (const update of updates) {
        // Check if it exists first to avoid creating duplicates if we can avoid it, 
        // or just upsert if we want to support both spellings.
        // Given the previous list only showed '6 pack', I will focus on that, but upsert 'six pack' won't hurt if frontend uses it.
        // Actually, let's stick to updating existing ones first.

        // Find by label (flexible)
        const existing = await prisma.cakeSize.findFirst({
            where: { label: update.label }
        });

        if (existing) {
            await prisma.cakeSize.update({
                where: { id: existing.id },
                data: { price: update.price }
            });
            console.log(`Updated ${update.label}: Rs.${update.price}`);
        } else {
            // Only create 'six pack' if it doesn't exist AND '6 pack' wasn't the target.
            // If '6 pack' exists (which it does), I should probably just update that one if user meant it.
            // But user literally typed "six pack". 
            // I will assume they meant the existing '6 pack' record.
            if (update.label === 'six pack') {
                console.log("Skipping creation of 'six pack' to avoid duplicates, assuming '6 pack' was target or will be used.");
            } else {
                // Create if missing (e.g. 12 pack if not found, but it was found)
                await prisma.cakeSize.create({
                    data: { label: update.label, price: update.price }
                });
                console.log(`Created ${update.label}: Rs.${update.price}`);
            }
        }
    }

    // Explicitly update '6 pack' again to be sure if loop logic was fuzzy
    const sixPack = await prisma.cakeSize.findFirst({ where: { label: '6 pack' } });
    if (sixPack) {
        await prisma.cakeSize.update({ where: { id: sixPack.id }, data: { price: 1000 } });
        console.log("Confirmed '6 pack' update to 1000");
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
