const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cakes = await prisma.cake.findMany({
        take: 5,
        include: { variants: true }
    });
    console.log('Cakes:', JSON.stringify(cakes, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
