const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
    try {
        const totalOrders = await prisma.order.count();
        const inDelivery = await prisma.order.count({ where: { status: 'IN_DELIVERY' } });
        const completed = await prisma.order.count({ where: { status: 'COMPLETED' } });

        // Calculate total revenue
        const revenueAgg = await prisma.order.aggregate({
            _sum: { total: true },
            where: { status: { not: 'CANCELLED' } } // Assuming cancelled orders don't count
        });
        const totalRevenue = revenueAgg._sum.total || 0;

        res.json({
            totalOrders,
            inDelivery,
            completed,
            totalRevenue: parseFloat(totalRevenue)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { name: true }
                }
            }
        });

        // Format for frontend
        const formatted = recentOrders.map(order => ({
            id: order.id,
            customer: order.customer.name,
            date: order.createdAt,
            total: parseFloat(order.total),
            status: order.status
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
