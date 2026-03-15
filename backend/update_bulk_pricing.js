const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating Bulk Pricing Rules...');

    const rules = [
        { label: 'Jar Cakes', basePrice: 250, bulkPrice: 230 }, // Assuming small discount for bulk
        { label: 'Wedding Cake', basePrice: 80, bulkPrice: 75 }, // "Wedding Cake" usually implies per piece/serving? 80 seems low for a whole cake. Assuming serving/piece.
        { label: 'Cupcakes', basePrice: 120, bulkPrice: 110 },
        { label: 'Mini Cakes', basePrice: 350, bulkPrice: 320 }
    ];

    for (const rule of rules) {
        await prisma.bulkPricing.upsert({
            where: { categoryLabel: rule.label },
            update: {
                basePrice: rule.basePrice,
                bulkPrice: rule.bulkPrice
            },
            create: {
                categoryLabel: rule.label,
                basePrice: rule.basePrice,
                bulkPrice: rule.bulkPrice,
                bulkThreshold: 100,
                minOrderQty: 50
            }
        });
        console.log(`Updated ${rule.label}: Base Rs.${rule.basePrice}, Bulk Rs.${rule.bulkPrice}`);
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
