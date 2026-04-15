const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cats = await prisma.cakeCategory.findMany({
        where: { OR: [ { name: { contains: 'Cartoon' } }, { name: { contains: 'Kids' } } ] }
    });
    console.log(JSON.stringify(cats, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
