const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllTransactions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.gte = new Date(startDate);
            dateFilter.lte = new Date(endDate);
        }

        // 1. Fetch Manual Transactions
        const transactions = await prisma.transaction.findMany({
            where: startDate ? { date: dateFilter } : {},
            orderBy: { date: 'desc' }
        });

        // 2. Fetch Orders (Automated Income)
        // We consider CONFIRMED, OUT_FOR_DELIVERY, DELIVERED as 'valid' for cashbook viewing? 
        // Or strictly 'PAID'? User said "orders are automatically added into transaction". 
        // Usually, we track generated revenue regardless of payment status for "Sales", 
        // but for "Cashbook" strictly it should be PAID orders.
        // However, for simplicity and common bakery workflow, we often treat CONFIRMED orders as expected income.
        // Let's stick to status not CANCELLED for broader view, or maybe filter by paymentStatus = 'PAID'?
        // The user prompt: "in cashbook dash board there are some analyses, it should calculated by orders."
        // Let's assume all non-cancelled orders count towards Sales/Income for the dashboard.

        const orders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                ...(startDate ? { createdAt: dateFilter } : {})
            },
            select: {
                id: true,
                total: true, // Decimal
                createdAt: true,
                status: true,
                paymentStatus: true,
                customer: { select: { name: true } }
            }
        });

        // 3. Normalize & Merge
        const orderTransactions = orders.map(o => ({
            id: `ORD-${o.id}`,
            date: o.createdAt,
            type: 'INCOME',
            category: 'Order Sales',
            amount: parseFloat((o.total || 0).toString()), // Robust conversion
            description: `Order #${o.id} - ${o.customer.name} (${o.status}, ${o.paymentStatus})`,
            isOrder: true,
            status: o.status
        }));

        const manualTransactions = transactions.map(t => ({
            id: `TRX-${t.id}`,
            date: t.date,
            type: t.type,
            category: t.category,
            amount: parseFloat((t.amount || 0).toString()), // Robust conversion
            description: t.description,
            isOrder: false
        }));

        const combined = [...orderTransactions, ...manualTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(combined);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;
        const transaction = await prisma.transaction.create({
            data: {
                type,
                category,
                amount,
                description,
                date: new Date(date)
            }
        });
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
};

exports.getFinancialSummary = async (req, res) => {
    console.log('API: getFinancialSummary called', req.query);
    try {
        const { startDate, endDate } = req.query;
        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            // Ensure end date includes the full day
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current month
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }
        console.log('Date Range:', start, end);

        const periodString = start.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }) +
            ' – ' +
            end.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });

        // Fetch Orders for the month
        const orders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: {
                    gte: start,
                    lte: end
                }
            }
        });
        console.log('Orders found:', orders.length);

        // Fetch Transactions for the month
        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            }
        });
        console.log('Transactions found:', transactions.length);

        // Helper to sum
        const sum = (arr) => arr.reduce((acc, curr) => acc + parseFloat((curr.amount || curr.total || 0).toString()), 0);

        // --- Breakdown Calculation ---

        // 1. Income Breakdown
        const onlineOrderTotal = sum(orders);
        const manualIncomeTrx = transactions.filter(t => t.type === 'INCOME');
        const manualIncomeTotal = sum(manualIncomeTrx);

        // Group Manual Income by Category
        const manualIncomeByCat = manualIncomeTrx.reduce((acc, t) => {
            const val = parseFloat((t.amount || 0).toString());
            acc[t.category] = (acc[t.category] || 0) + val;
            return acc;
        }, {});

        const incomeBreakdown = [
            { category: 'Online Orders (Automated)', amount: onlineOrderTotal },
            ...Object.entries(manualIncomeByCat).map(([cat, amt]) => ({ category: cat, amount: amt }))
        ];

        // 2. Expense Breakdown
        const expenseTrx = transactions.filter(t => t.type === 'EXPENSE');
        const expenseTotal = sum(expenseTrx);

        const expenseByCat = expenseTrx.reduce((acc, t) => {
            const val = parseFloat((t.amount || 0).toString());
            acc[t.category] = (acc[t.category] || 0) + val;
            return acc;
        }, {});

        const expenseBreakdown = Object.entries(expenseByCat).map(([cat, amt]) => ({ category: cat, amount: amt }));

        res.json({
            period: periodString,
            totalIncome: onlineOrderTotal + manualIncomeTotal,
            totalExpenses: expenseTotal,
            netProfit: (onlineOrderTotal + manualIncomeTotal) - expenseTotal,
            totalOrders: orders.length,
            incomeBreakdown,
            expenseBreakdown
        });

    } catch (error) {
        console.error('Error in getFinancialSummary:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
};
