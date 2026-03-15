const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const allOrders = await prisma.order.findMany({
            where: { status: { not: 'CANCELLED' } }
        });

        const currentMonthOrders = allOrders.filter(o => o.createdAt >= startOfMonth && o.createdAt <= endOfMonth);

        const totalRevenue = allOrders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);
        const currentMonthRevenue = currentMonthOrders.reduce((acc, o) => acc + parseFloat(o.total || 0), 0);

        console.log('Total Orders (Non-Cancelled):', allOrders.length);
        console.log('Total Revenue (All Time):', totalRevenue);
        console.log('--- Current Month ---');
        console.log('Orders this month:', currentMonthOrders.length);
        console.log('Revenue this month:', currentMonthRevenue);
        console.log('Month Range:', startOfMonth.toISOString(), 'to', endOfMonth.toISOString());
        
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrders();
