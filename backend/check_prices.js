
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sizes = await prisma.cakeSize.findMany();
    console.log("Cake Sizes:", sizes);

    const cakes = await prisma.cake.findMany({
        take: 5,
        include: {
            variants: {
                include: {
                    size: true
                }
            },
            category: true
        }
    });

    console.log("Sample Cakes Structure:");
    cakes.forEach(cake => {
        console.log(`Cake: ${cake.name} (Cat: ${cake.category?.name})`);
        cake.variants.forEach(v => {
            console.log(`  - Size: ${v.size?.label}, Price: ${v.price}`);
        });
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
