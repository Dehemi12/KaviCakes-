const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const category = await prisma.cakeCategory.findFirst({
        where: { imageUrl: { not: null } }
    });
    if (category) {
        console.log("URL: " + category.imageUrl);
    } else {
        console.log("No category with image found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
