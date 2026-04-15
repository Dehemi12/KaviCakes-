const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const orders = await prisma.order.findMany({
        where: { advanceStatus: { in: ['UPLOADED_ADVANCE', 'UPLOADED_FULL', 'APPROVED', 'UPLOADED_BALANCE'] } },
        orderBy: { id: 'desc' },
        take: 1,
        select: { bankSlip: true }
    });
    console.log(orders[0].bankSlip);
}
main().finally(() => prisma.$disconnect());
