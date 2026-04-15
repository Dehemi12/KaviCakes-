const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cakes = await prisma.cake.findMany({
        where: { name: { contains: 'Cartoon' } },
        include: {
            variants: { include: { size: true } }
        }
    });

    cakes.forEach(cake => {
        console.log(`Cake: ${cake.id} | ${cake.name}`);
        cake.variants.forEach(v => {
            console.log(`  - Variant ${v.id}: ${v.size.label} -> Rs.${v.price}`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
