const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Sales Revenue Report
exports.getSalesRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'daily' } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        const orders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { gte: start, lte: end }
            },
            select: {
                total: true,
                createdAt: true,
                orderType: true
            }
        });

        const revenueMap = {};

        orders.forEach(order => {
            let key;
            const date = new Date(order.createdAt);
            if (groupBy === 'daily') {
                key = date.toISOString().split('T')[0];
            } else if (groupBy === 'monthly') {
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            } else if (groupBy === 'yearly') {
                key = `${date.getFullYear()}`;
            }

            if (!revenueMap[key]) {
                revenueMap[key] = { date: key, orders: 0, revenue: 0 };
            }
            revenueMap[key].orders += 1;
            revenueMap[key].revenue += parseFloat(order.total);
        });

        const report = Object.values(revenueMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json(report);
    } catch (error) {
        console.error('[ReportController:getSalesRevenueReport] Error:', error);
        res.status(500).json({ error: 'Failed to generate Sales Revenue Report' });
    }
};



// 3. Transaction History Report
exports.getTransactionHistoryReport = async (req, res) => {
    try {
        const { startDate, endDate, paymentMethod, orderId } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        const where = {
            date: { gte: start, lte: end }
        };

        if (paymentMethod) where.paymentMode = paymentMethod;
        if (orderId) where.orderId = parseInt(orderId);

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { order: { select: { id: true } } }
        });

        const report = transactions.map(t => ({
            transactionId: t.id,
            orderId: t.orderId,
            type: t.category || 'Payment',
            amount: parseFloat(t.amount),
            method: t.paymentMode,
            date: t.date
        }));

        res.json(report);
    } catch (error) {
        console.error('[ReportController:getTransactionHistoryReport] Error:', error);
        res.status(500).json({ error: 'Failed to generate Transaction History Report' });
    }
};

// 4. Monthly Financial Summary
exports.getMonthlyFinancialSummary = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: new Date(targetYear, 0, 1),
                    lte: new Date(targetYear, 11, 31, 23, 59, 59)
                },
                status: { not: 'CANCELLED' }
            }
        });

        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: new Date(targetYear, 0, 1),
                    lte: new Date(targetYear, 11, 31, 23, 59, 59)
                },
                type: 'INCOME'
            }
        });

        const monthlyData = {};

        // Initialize 12 months
        for (let i = 0; i < 12; i++) {
            const monthName = new Date(targetYear, i).toLocaleString('default', { month: 'long' });
            monthlyData[i] = { month: monthName, orders: 0, revenue: 0, paymentsReceived: 0, outstanding: 0 };
        }

        orders.forEach(order => {
            const m = new Date(order.createdAt).getMonth();
            monthlyData[m].orders += 1;
            monthlyData[m].revenue += parseFloat(order.total);
            monthlyData[m].outstanding += parseFloat(order.balanceAmount);
        });

        transactions.forEach(t => {
            const m = new Date(t.date).getMonth();
            monthlyData[m].paymentsReceived += parseFloat(t.amount);
        });

        res.json(Object.values(monthlyData));
    } catch (error) {
        console.error('[ReportController:getMonthlyFinancialSummary] Error:', error);
        res.status(500).json({ error: 'Failed to generate Monthly Financial Summary' });
    }
};

// 5. Order Type Revenue Report
exports.getOrderTypeRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        const orders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { gte: start, lte: end }
            },
            include: {
                customOrder: true,
                bulkOrder: true
            }
        });

        const typeMap = {
            'STANDARD': { type: 'Standard Orders', orders: 0, revenue: 0, icon: 'ShoppingOutlined', color: '#1890ff' },
            'CUSTOM': { type: 'Custom Orders', orders: 0, revenue: 0, icon: 'StarOutlined', color: '#eb2f96' },
            'BULK': { type: 'Bulk Orders', orders: 0, revenue: 0, icon: 'AppstoreAddOutlined', color: '#722ed1' }
        };

        orders.forEach(order => {
            let type = 'STANDARD';
            if (order.customOrder) type = 'CUSTOM';
            else if (order.bulkOrder) type = 'BULK';
            
            if (typeMap[type]) {
                typeMap[type].orders += 1;
                typeMap[type].revenue += parseFloat(order.total);
            }
        });

        res.json(Object.values(typeMap));
    } catch (error) {
        console.error('[ReportController:getOrderTypeRevenueReport] Error:', error);
        res.status(500).json({ error: 'Failed to generate Order Type Revenue Report' });
    }
};

// 6. Top Selling Cake Report
exports.getTopSellingCakeReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    status: { not: 'CANCELLED' },
                    createdAt: { gte: start, lte: end }
                }
            },
            include: {
                variant: {
                    include: { cake: { select: { name: true } } }
                }
            }
        });

        const cakeMap = {};

        orderItems.forEach(item => {
            const cakeName = item.name || item.variant?.cake?.name || 'Other';
            if (!cakeMap[cakeName]) {
                cakeMap[cakeName] = { cake: cakeName, orders: 0, revenue: 0 };
            }
            cakeMap[cakeName].orders += item.quantity;
            cakeMap[cakeName].revenue += parseFloat(item.unitPrice) * item.quantity;
        });

        const report = Object.values(cakeMap).sort((a, b) => b.orders - a.orders);

        res.json(report);
    } catch (error) {
        console.error('[ReportController:getTopSellingCakeReport] Error:', error);
        res.status(500).json({ error: 'Failed to generate Top Selling Cake Report' });
    }
};

// 7. Outstanding Payment Report
exports.getOutstandingPaymentReport = async (req, res) => {
    try {
        const { sortBy = 'deliveryDate' } = req.query;

        const orders = await prisma.order.findMany({
            where: {
                balanceAmount: { gt: 0 },
                status: { not: 'CANCELLED' }
            },
            include: { customer: { select: { name: true } } },
            orderBy: sortBy === 'deliveryDate' ? { deliveryDate: 'asc' } : { createdAt: 'desc' }
        });

        const report = orders.map(order => ({
            orderId: order.id,
            customer: order.customer?.name || 'Guest',
            balance: parseFloat(order.balanceAmount),
            deliveryDate: order.deliveryDate
        }));

        res.json(report);
    } catch (error) {
        console.error('[ReportController:getOutstandingPaymentReport] Error:', error);
        res.status(500).json({ error: 'Failed to generate Outstanding Payment Report' });
    }
};


