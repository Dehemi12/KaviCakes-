const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cake = await prisma.cake.findUnique({
        where: { id: 13 },
        include: {
            variants: {
                include: { size: true }
            }
        }
    });

    if (cake) {
        console.log(`Cake: ${cake.name}`);
        cake.variants.forEach(v => {
            console.log(`Variant ID ${v.id}: ${v.size.label} -> Price: ${v.price}`);
        });
    } else {
        console.log('Cake 13 not found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
