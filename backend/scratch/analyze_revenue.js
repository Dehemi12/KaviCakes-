const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRevenue() {
    try {
        // 1. Total Revenue from Orders (All non-cancelled)
        const orders = await prisma.orders.findMany({
            where: { status: { not: 'CANCELLED' } }
        });
        const totalOrderRevenue = orders.reduce((acc, o) => acc + Number(o.total), 0);
        const totalPending = orders.reduce((acc, o) => acc + Number(o.balanceAmount), 0);
        const totalAdvance = orders.reduce((acc, o) => acc + Number(o.advanceAmount), 0);

        // 2. Total Cash In from Transaction table
        const transactions = await prisma.transaction.findMany({
              where: {
                OR: [
                    { orderId: null },
                    { order: { status: { not: 'CANCELLED' } } }
                ]
            }
        });
        const totalCashIn = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + Number(t.amount), 0);
        
        const totalCashOut = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        console.log('--- Order-based Metrics ---');
        console.log('Total Orders:', orders.length);
        console.log('Total Revenue (Sum of Order Totals):', totalOrderRevenue.toFixed(2));
        console.log('Total Pending Receivables (Sum of Balance Amounts):', totalPending.toFixed(2));
        console.log('Total Advance Payments (Sum of Advance Amounts):', totalAdvance.toFixed(2));
        console.log('Calculated Received (Revenue - Pending):', (totalOrderRevenue - totalPending).toFixed(2));

        console.log('\n--- Transaction (Cashbook) Metrics ---');
        console.log('Total Cash In:', totalCashIn.toFixed(2));
        console.log('Total Cash Out:', totalCashOut.toFixed(2));
        console.log('Net Balance:', (totalCashIn - totalCashOut).toFixed(2));

        console.log('\n--- Reconciliation ---');
        console.log('Difference (Order Revenue - Cash In):', (totalOrderRevenue - totalCashIn).toFixed(2));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeRevenue();
