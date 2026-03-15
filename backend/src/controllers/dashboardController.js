const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Use Promise.all with individual logic to prevent one failure from blocking others
        /*
        const [totalOrders, inDelivery, completed, orderRevenueAgg, transactionRevenueAgg] = await prisma.$transaction([
           ...
        ]);
        */

        // Safer approach:
        const totalOrders = await prisma.order.count();

        const inDelivery = await prisma.order.count({
            where: {
                status: 'ready',
                deliveryDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const completed = await prisma.order.count({
            where: { status: 'DELIVERED' }
        });

        const orderRevenueAgg = await prisma.order.aggregate({
            _sum: { total: true },
            where: { 
                status: 'DELIVERED',
                paymentStatus: 'PAID'
            }
        });

        // Safely fetch transaction revenue
        let transactionRevenue = 0;
        try {
            const transactionRevenueAgg = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { type: 'INCOME' }
            });
            transactionRevenue = transactionRevenueAgg._sum.amount || 0;
        } catch (txnError) {
            console.warn('[Dashboard] Transaction aggregation failed, defaulting to 0:', txnError.message);
        }

        // Calculate total revenue from results
        // As per user request: "Total revenue means the total amount of order prices which is payment completed (PAID) and delivered (DELIVERED)"
        const totalRevenue = Number(orderRevenueAgg._sum.total || 0);

        res.json({
            totalOrders,
            inDelivery,
            completed,
            totalRevenue: totalRevenue
        });

    } catch (error) {
        console.error('[DashboardController] Error:', error);
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
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        variant: {
                            include: {
                                cake: { select: { name: true, imageUrl: true } },
                                size: true,
                                flavor: true,
                                shape: true
                            }
                        }
                    }
                },
                customOrder: true,
                bulkOrder: true
            }
        });

        // Format for frontend
        const formatted = recentOrders.map(order => ({
            id: order.id,
            customer: order.customer.name,
            customerEmail: order.customer.email,
            date: order.createdAt,
            total: parseFloat(order.total),
            status: order.status,
            paymentMethod: order.paymentMethod,
            items: order.items.map(item => ({
                id: item.id,
                name: item.name || item.variant?.cake?.name || 'Unknown Item',
                quantity: item.quantity,
                variant: item.variant,
                customDetails: item.customDetails
            })),
            isCustom: !!order.customOrder,
            isBulk: !!order.bulkOrder,
            orderType: order.orderType,
            bulkInfo: order.bulkOrder ? { event: order.bulkOrder.eventName, org: order.bulkOrder.organization } : null
        }));

        console.log(`[Dashboard] Sending ${formatted.length} recent orders.`);
        res.json(formatted);
    } catch (error) {
        console.error('[DashboardController] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMonthlyAnalysis = async (req, res) => {
    try {
        const { year, month } = req.query; // e.g. year=2026, month=3
        
        const targetDate = new Date();
        const y = year ? parseInt(year) : targetDate.getFullYear();
        const m = month ? parseInt(month) - 1 : targetDate.getMonth();
        
        const startOfMonth = new Date(y, m, 1);
        const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            include: {
                customer: { select: { name: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                cake: { 
                                    select: { 
                                        name: true,
                                        imageUrl: true,
                                        category: { select: { name: true } }
                                    } 
                                },
                                size: true,
                                flavor: true,
                                shape: true
                            }
                        }
                    }
                },
                customOrder: true,
                bulkOrder: true
            }
        });

        let totalRevenue = 0;
        let standardCount = 0;
        let customCount = 0;
        let bulkCount = 0;
        const itemSales = {};

        const validOrders = orders.filter(o => o.status !== 'CANCELLED');
        const totalValidOrders = validOrders.length;

        // Map for table
        const formattedOrders = orders.map(order => {
            let type = 'Standard';
            if (order.customOrder) type = 'Custom';
            else if (order.bulkOrder) type = 'Bulk';

            // Counts
            if (type === 'Standard') standardCount++;
            else if (type === 'Custom') customCount++;
            else if (type === 'Bulk') bulkCount++;

            // Revenue (only if PAID and DELIVERED as per user definition)
            if (order.status === 'DELIVERED' && order.paymentStatus === 'PAID') {
                totalRevenue += Number(order.total);
            }

            // Always track item sales for analytics if not cancelled
            if (order.status !== 'CANCELLED') {
                order.items.forEach(item => {
                    const displayName = item.name || item.variant?.cake?.name || 'Unknown Item';
                    if (!itemSales[displayName]) {
                        itemSales[displayName] = {
                            name: displayName,
                            quantity: 0,
                            revenue: 0,
                            image: item.image || item.variant?.cake?.imageUrl,
                            category: item.variant?.cake?.category?.name || 'Cakes'
                        };
                    }
                    itemSales[displayName].quantity += item.quantity;
                    itemSales[displayName].revenue += (Number(item.unitPrice) * item.quantity);
                });
            }

            return {
                id: order.id,
                customer: order.customer?.name || 'Unknown',
                customerEmail: order.customer?.email || '',
                type,
                date: order.createdAt,
                deliveryDate: order.deliveryDate,
                paymentStatus: order.paymentStatus,
                status: order.status,
                total: Number(order.total),
                items: order.items.map(item => ({
                    id: item.id,
                    name: item.name || item.variant?.cake?.name || 'Unknown Item',
                    quantity: item.quantity,
                    variant: item.variant
                }))
            };
        });

        // Most selling items
        const topItems = Object.values(itemSales)
            .sort((a, b) => b.quantity - a.quantity);

        res.json({
            summary: {
                totalOrders: totalValidOrders, // or keep all orders count? Requirement says mostly non-cancelled for sales
                totalRevenue,
                standardCount,
                customCount,
                bulkCount,
                allCount: orders.length
            },
            orders: formattedOrders,
            topItems
        });
    } catch (error) {
        console.error('[DashboardController:getMonthlyAnalysis] Error:', error);
        res.status(500).json({ error: 'Server error parsing monthly analysis' });
    }
};
