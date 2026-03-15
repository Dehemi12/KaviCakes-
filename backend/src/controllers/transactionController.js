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

        // 1. Fetch Manual Transactions (excluding those already linked to orders to avoid double counting)
        const transactions = await prisma.transaction.findMany({
            where: {
                ...(startDate ? { date: dateFilter } : {}),
                orderId: null // Only fetch manual entries NOT tied to orders
            },
            orderBy: { date: 'desc' }
        });

        // 2. Fetch all non-cancelled orders
        const allOrders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                ...(startDate ? { createdAt: dateFilter } : {})
            },
            include: { customer: { select: { name: true } } }
        });

        // 3. Normalize & Merge
        const trxs = transactions.map(t => ({
            id: `TRX-${t.id}`,
            date: t.date,
            type: t.type,
            category: t.category,
            amount: parseFloat((t.amount || 0).toString()),
            description: t.description,
            isOrder: false,
            paymentMode: t.paymentMode || 'Cash',
            billUrl: t.billUrl
        }));

        const automatedTrxs = allOrders.map(o => ({
            id: `ORD-${o.id}`,
            date: o.createdAt,
            type: 'INCOME',
            category: 'Order Sales',
            amount: parseFloat((o.total || 0).toString()), // Always show full price
            description: `Order Sales #${o.id} - ${o.customer?.name || 'Customer'}`,
            isOrder: true,
            orderId: o.id,
            paymentMode: o.paymentMethod === 'ONLINE_PAYMENT' ? 'Bank' : 'Cash',
            billUrl: null
        }));

        const combined = [...trxs, ...automatedTrxs].sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Calculate Opening Balance for Running Total
        const previousTransactions = await prisma.transaction.findMany({
            where: {
                date: { lt: startDate ? new Date(startDate) : new Date(0) }
            },
            select: { type: true, amount: true, orderId: true }
        });

        const previousOrders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { lt: startDate ? new Date(startDate) : new Date(0) }
            }
        });

        const existingPrevTrxOrderIds = new Set(previousTransactions.filter(t => t.orderId).map(t => t.orderId));

        let openingBalance = previousTransactions.reduce((acc, t) => {
            const val = parseFloat(t.amount.toString());
            return t.type === 'INCOME' ? acc + val : acc - val;
        }, 0);

        previousOrders.forEach(o => {
            if (!existingPrevTrxOrderIds.has(o.id)) {
                openingBalance += parseFloat(o.total.toString());
            }
        });

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

        // Fetch ALL non-cancelled orders for All-Time Income
        const allOrders = await prisma.order.findMany({
            where: { status: { not: 'CANCELLED' } }
        });
        const totalOrderRevenue = allOrders.reduce((acc, o) => acc + parseFloat(o.total.toString()), 0);

        // Fetch ALL transactions for All-Time Income/Expense
        const allTransactions = await prisma.transaction.findMany({});
        const totalManualIncome = allTransactions.filter(t => t.type === 'INCOME' && !t.orderId)
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);
        const totalAllTimeExpenses = allTransactions.filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        const absoluteTotalIncome = totalOrderRevenue + totalManualIncome;
        const finalNetBalance = absoluteTotalIncome - totalAllTimeExpenses;

        // --- Period Specific Calculations (For Breakdowns) ---
        const transactionsInPeriod = allTransactions.filter(t => 
            t.date >= start && t.date <= end
        );
        const ordersInPeriod = allOrders.filter(o => 
            o.createdAt >= start && o.createdAt <= end
        );

        const periodIncomeVal = ordersInPeriod.reduce((acc, o) => acc + parseFloat(o.total.toString()), 0) +
            transactionsInPeriod.filter(t => t.type === 'INCOME' && !t.orderId)
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        const periodExpenseVal = transactionsInPeriod.filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

        const incomeBreakdown = [
            { category: 'Order Sales (This Period)', amount: ordersInPeriod.reduce((acc, o) => acc + parseFloat(o.total.toString()), 0) },
            ...Object.entries(transactionsInPeriod.filter(t => t.type === 'INCOME' && !t.orderId).reduce((acc, t) => {
                acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + parseFloat(t.amount.toString());
                return acc;
            }, {})).map(([category, amount]) => ({ category, amount }))
        ].filter(i => i.amount > 0);

        const expenseBreakdown = Object.entries(transactionsInPeriod.filter(t => t.type === 'EXPENSE').reduce((acc, t) => {
            acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + parseFloat(t.amount.toString());
            return acc;
        }, {})).map(([category, amount]) => ({ category, amount }));

        // Receivables (Unpaid balances from active orders in period)
        const pendingReceivables = ordersInPeriod.reduce((acc, o) => acc + parseFloat(o.balanceAmount.toString()), 0);

        res.json({
            period: periodString,
            totalIncome: absoluteTotalIncome, // Total Cash In (All Time)
            totalExpenses: totalAllTimeExpenses, // Total Cash Out (All Time)
            netBalance: finalNetBalance, // Final Wallet Balance
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
