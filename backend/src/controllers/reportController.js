const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dayjs = require('dayjs');

exports.getSalesRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Default to last 30 days if not provided
        const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().endOf('day').toDate();
        const start = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs(end).subtract(30, 'day').startOf('day').toDate();

        // 1. Basic Stats (Revenue, Orders, Profit)
        const orders = await prisma.orders.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            }
        });

        const totalOrders = orders.length;
        const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length;
        const pendingOrders = orders.filter(o => o.paymentStatus !== 'PAID').length;

        // Revenue from non-cancelled orders
        const revenueAgg = orders.reduce((acc, curr) => acc + Number(curr.total), 0);

        // Profit from Cashbook Transactions (Income - Expense)
        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: start, lte: end }
            }
        });

        const totalIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);
        
        const totalExpense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        const netProfit = totalIncome - totalExpense;

        // 2. Revenue by Order Type (Standard, Custom, Bulk)
        const orderTypeStats = {
            STANDARD: 0,
            CUSTOM: 0,
            BULK: 0
        };

        const mapType = (type) => {
            if (!type || type === 'REGULAR' || type === 'URGENT') return 'STANDARD';
            return type; // CUSTOM, BULK
        };

        orders.forEach(order => {
            const type = mapType(order.orderType);
            if (orderTypeStats[type] !== undefined) {
                orderTypeStats[type] += Number(order.total);
            }
        });

        // 3. Payment Method & Status Analysis (Pie Chart)
        // We include ALL orders in this period to count Cancelled ones
        const allOrdersInPeriod = await prisma.orders.findMany({
            where: { createdAt: { gte: start, lte: end } }
        });

        const paymentStats = {
            ONLINE: 0,
            COD: 0,
            CANCELLED: 0
        };

        allOrdersInPeriod.forEach(order => {
            if (order.status === 'CANCELLED') {
                paymentStats.CANCELLED++;
            } else if (order.paymentMethod === 'ONLINE_PAYMENT') {
                paymentStats.ONLINE++;
            } else {
                paymentStats.COD++;
            }
        });

        // 4. Grouped Trends (By Month for 'Previous Revenue' chart style)
        const groupedTrends = {};
        orders.forEach(order => {
            const month = dayjs(order.createdAt).format('MMMM');
            if (!groupedTrends[month]) {
                groupedTrends[month] = { month, STANDARD: 0, CUSTOM: 0, BULK: 0, total: 0 };
            }
            const type = mapType(order.orderType);
            if (groupedTrends[month][type] !== undefined) {
                groupedTrends[month][type] += Number(order.total);
                groupedTrends[month].total += Number(order.total);
            }
        });

        const revenueTrendsByMonth = Object.values(groupedTrends);

        // 5. Peak Month
        const peakMonth = revenueTrendsByMonth.length > 0 
            ? revenueTrendsByMonth.reduce((a, b) => a.total > b.total ? a : b).month 
            : 'N/A';

        // 6. Best Selling Products
        const orderItems = await prisma.orderitem.findMany({
            where: { order: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }
        });
        
        const itemCounts = {};
        orderItems.forEach(item => {
            const itemName = item.name || 'Unknown Product';
            if (!itemCounts[itemName]) {
                itemCounts[itemName] = { name: itemName, image: item.image, count: 0 };
            }
            itemCounts[itemName].count += item.quantity;
        });
        const bestSellers = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

        // 7. Loyalty Customers (Points > 2000)
        const loyaltyCustomers = await prisma.customer.findMany({
            where: { loyaltyPoints: { gte: 2000 } },
            select: { name: true, email: true, loyaltyPoints: true, displayId: true }
        });

        // 8. Specific Periodic Revenue (Daily, Weekly, Monthly)
        const now = dayjs();
        const dailyRevenue = orders
            .filter(o => dayjs(o.createdAt).isSame(now, 'day'))
            .reduce((acc, curr) => acc + Number(curr.total), 0);
        
        const weeklyRevenue = orders
            .filter(o => dayjs(o.createdAt).isAfter(now.subtract(7, 'day')))
            .reduce((acc, curr) => acc + Number(curr.total), 0);
        
        const monthlyRevenue = orders
            .filter(o => dayjs(o.createdAt).isAfter(now.subtract(30, 'day')))
            .reduce((acc, curr) => acc + Number(curr.total), 0);

        // 9. Growth
        const periodLength = dayjs(end).diff(start, 'day');
        const prevStart = dayjs(start).subtract(periodLength + 1, 'day').toDate();
        const prevEnd = dayjs(start).subtract(1, 'day').toDate();
        const prevOrders = await prisma.orders.findMany({
            where: { createdAt: { gte: prevStart, lte: prevEnd }, status: { not: 'CANCELLED' } }
        });
        const prevRevenue = prevOrders.reduce((acc, curr) => acc + Number(curr.total), 0);
        const growth = prevRevenue === 0 ? 100 : ((revenueAgg - prevRevenue) / prevRevenue) * 100;

        res.json({
            dateRange: { start, end },
            summary: {
                totalRevenue: revenueAgg,
                dailyRevenue,
                weeklyRevenue,
                monthlyRevenue,
                totalOrders,
                paidOrders,
                pendingOrders,
                netProfit,
                growth: parseFloat(growth.toFixed(2)),
                peakMonth
            },
            trends: revenueTrendsByMonth,
            paymentStats,
            bestSellers,
            loyaltyCustomers
        });

    } catch (error) {
        console.error('[ReportController:getSalesRevenueReport] Error:', error);
        res.status(500).json({ error: 'Server error generating report' });
    }
};
