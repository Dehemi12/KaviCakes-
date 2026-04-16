const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCustomers = async (req, res) => {
    try {
        const { minLoyalty } = req.query;

        const where = {};
        if (minLoyalty) {
            where.loyaltyPoints = { gte: parseInt(minLoyalty) };
        }

        const customers = await prisma.customer.findMany({
            where,
            include: {
                _count: {
                    select: { orders: true }
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // To get the last order date
                    select: { createdAt: true }
                }
            },
            orderBy: { displayId: 'asc' }
        });

        // We also need total spent. Prisma aggregate is separate or we can do it in the query if we structure it differently.
        // For simplicity, let's fetch total spent for each customer or better yet, use a separate aggregate query.
        // But since we are paginating or listing, let's just fetch orders sum per customer efficiently?
        // Actually, finding many with relation aggregation for sum is tricky in one go in standard Prisma without groupBy.
        // We will do a map with a separate query or include all orders (expensive).
        // BETTER: Use groupBy for totals.

        const totals = await prisma.orders.groupBy({
            by: ['customerId'],
            _sum: {
                total: true,
            },
        });

        const totalsMap = {};
        totals.forEach(t => {
            totalsMap[t.customerId] = t._sum.total || 0;
        });

        const formatted = customers.map(c => ({
            id: c.id,
            displayId: c.displayId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            loyaltyPoints: c.loyaltyPoints,
            orderCount: c._count.orders,
            lastOrderDate: c.orders[0]?.createdAt || null,
            totalSpent: parseFloat(totalsMap[c.id] || 0)
        }));

        res.json(formatted);
    } catch (error) {
        console.error('[CustomerController:getCustomers] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
