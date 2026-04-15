const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const orders = await prisma.order.findMany({
        where: { bankSlip: { not: null } },
        select: { id: true, bankSlip: true }
    });
    for (let o of orders) {
        if (o.bankSlip.includes('/uploads/file-') || o.bankSlip.includes('/uploads/slip-')) {
            console.log('Updating order', o.id, o.bankSlip);
            await prisma.order.update({
                where: { id: o.id },
                data: { bankSlip: o.bankSlip.replace('/uploads/', '/uploads/slips/') }
            });
        } else if (o.bankSlip.includes('/uploads/') && !o.bankSlip.includes('/uploads/slips/')) {
            console.log('Updating general order', o.id, o.bankSlip);
            await prisma.order.update({
                where: { id: o.id },
                data: { bankSlip: o.bankSlip.replace('/uploads/', '/uploads/slips/') }
            });
        }
    }
    console.log('Done mapping existing DB slips. All existing ones are now prefixed with slips/ properly.');
}
main().finally(() => prisma.$disconnect());
