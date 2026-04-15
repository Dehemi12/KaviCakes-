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

        // 1. Fetch Transactions (including those linked to orders)
        const transactions = await prisma.transaction.findMany({
            where: {
                ...(startDate ? { date: dateFilter } : {}),
                OR: [
                    { orderId: null },
                    { order: { status: { not: 'CANCELLED' } } }
                ]
            },
            orderBy: { date: 'desc' }
        });

        // 2. Normalize and Enhance with customer names for order-linked transactions
        // We'll fetch order details for those that have orderId
        const orderIds = transactions.filter(t => t.orderId).map(t => t.orderId);
        const relatedOrders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            include: { customer: { select: { name: true } } }
        });
        const orderMap = new Map(relatedOrders.map(o => [o.id, o]));

        const trxs = transactions.map(t => {
            const order = t.orderId ? orderMap.get(t.orderId) : null;
            return {
                id: t.orderId ? `PAY-${t.id}` : `TRX-${t.id}`,
                date: t.date,
                type: t.type,
                category: t.category,
                amount: parseFloat((t.amount || 0).toString()),
                description: t.description || (order ? `Order Payment #${t.orderId} - ${order.customer?.name}` : ''),
                isOrder: !!t.orderId,
                orderId: t.orderId,
                paymentMode: t.paymentMode || 'Cash',
                billUrl: t.billUrl
            };
        });

        const combined = trxs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 3. Calculate Opening Balance for Running Total (Strictly from transactions table)
        const previousTransactions = await prisma.transaction.findMany({
            where: {
                date: { lt: startDate ? new Date(startDate) : new Date(0) }
            },
            select: { type: true, amount: true }
        });

        let openingBalance = previousTransactions.reduce((acc, t) => {
            const val = parseFloat(t.amount.toString());
            return t.type === 'INCOME' ? acc + val : acc - val;
        }, 0);

        res.json({
            transactions: combined,
            openingBalance
        });

    } catch (error) {
        console.error('[TransactionController:getAllTransactions] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const { type, category, amount, description, date, paymentMode, billUrl } = req.body;
        const transaction = await prisma.transaction.create({
            data: {
                type,
                category,
                amount,
                description,
                paymentMode: paymentMode || 'Cash',
                billUrl: billUrl,
                date: date ? new Date(date) : new Date()
            }
        });
        res.json(transaction);
    } catch (error) {
        console.error('[TransactionController:addTransaction] Error:', error);
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

        // Fetch ALL transactions for Cash Flow
        // Fetch ALL valid transactions (exclude those of cancelled orders)
        const allTransactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { orderId: null },
                    { order: { status: { not: 'CANCELLED' } } }
                ]
            }
        });
        
        // Fetch ALL non-cancelled orders for Receivables
        const allOrders = await prisma.order.findMany({
            where: { status: { not: 'CANCELLED' } }
        });

        // 1. All-Time Calculations (The real "Cash In/Out")
        const absoluteTotalIncome = allTransactions.filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);
        const totalAllTimeExpenses = allTransactions.filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);
        
        const finalNetBalance = absoluteTotalIncome - totalAllTimeExpenses;

        // 2. Period Specific Calculations (Filtered by dates)
        const transactionsInPeriod = allTransactions.filter(t => 
            t.date >= start && t.date <= end
        );
        const ordersInPeriod = allOrders.filter(o => 
            o.createdAt >= start && o.createdAt <= end
        );

        const periodIncomeVal = transactionsInPeriod.filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        const periodExpenseVal = transactionsInPeriod.filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        // Group Income Breakdown by Category
        const incomeBreakdownMap = transactionsInPeriod.filter(t => t.type === 'INCOME')
            .reduce((acc, t) => {
                const cat = t.category || 'Other';
                acc[cat] = (acc[cat] || 0) + parseFloat(t.amount.toString());
                return acc;
            }, {});

        const incomeBreakdown = Object.entries(incomeBreakdownMap).map(([category, amount]) => ({
            category,
            amount
        }));

        const expenseBreakdownMap = transactionsInPeriod.filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => {
                const cat = t.category || 'Other';
                acc[cat] = (acc[cat] || 0) + parseFloat(t.amount.toString());
                return acc;
            }, {});

        const expenseBreakdown = Object.entries(expenseBreakdownMap).map(([category, amount]) => ({
            category,
            amount
        }));

        // Receivables (Money still owed by customers for orders in this period)
        const pendingReceivables = ordersInPeriod.reduce((acc, o) => acc + parseFloat(o.balanceAmount.toString()), 0);

        res.json({
            period: periodString,
            totalIncome: absoluteTotalIncome, 
            totalExpenses: totalAllTimeExpenses, 
            netBalance: finalNetBalance, 
            periodIncome: periodIncomeVal,
            periodExpenses: periodExpenseVal,
            periodNet: periodIncomeVal - periodExpenseVal,
            pendingReceivables,
            totalOrders: allOrders.length,
            incomeBreakdown,
            expenseBreakdown
        });

    } catch (error) {
        console.error('[TransactionController:getFinancialSummary] Error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
};
