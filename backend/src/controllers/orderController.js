const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all orders with optional filters
exports.getAllOrders = async (req, res) => {
    try {
        const { status, paymentStatus } = req.query;

        // Build where clause
        const where = {};
        if (status && status !== 'All') {
            where.status = status;
        }
        if (paymentStatus && paymentStatus !== 'All') {
            where.paymentStatus = paymentStatus;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: true, // Get customer details
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform data for frontend if needed (e.g. parsing Decimals)
        // Transform data for frontend if needed (e.g. parsing Decimals)
        const formatted = orders.map(order => {
            // Fix for potential malformed items structure (Prisma 'create' object)
            let items = order.items;
            if (items && typeof items === 'object' && items.create && Array.isArray(items.create)) {
                items = items.create;
            }

            return {
                ...order,
                items,
                total: parseFloat(order.total)
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT Update Order Status (Manual)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate Status (Optional, can expand list)
        const validStatuses = ['NEW', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// PUT Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        // Validate Status
        const validStatuses = ['PENDING', 'PAID', 'REFUNDED'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { paymentStatus }
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

// DELETE Order
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.order.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
};

// POST Send Invoice (Mock)
exports.sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        // Mock email sending logic...
        console.log(`Sending invoice for Order #${id} to customer...`);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({ message: 'Invoice sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
};
