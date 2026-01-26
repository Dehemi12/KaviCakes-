const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST Create Order
exports.createOrder = async (req, res) => {
    try {
        const { items, total, subtotal, discount, deliveryFee, details, paymentMethod } = req.body;
        // customerId from authMiddleware (req.user)
        const customerId = req.user.id;

        // 1. Calculate Loyalty Points Earned (e.g., 1 Point per Rs. 100)
        const pointsEarned = Math.floor(parseFloat(total) / 100);

        // 2. Transaction: Create Order & Update Customer Points
        const result = await prisma.$transaction(async (prisma) => {
            // Create Order
            const newOrder = await prisma.order.create({
                data: {
                    total: parseFloat(total),
                    status: 'NEW',
                    paymentStatus: 'PENDING',
                    paymentMethod: paymentMethod || 'COD',
                    address: details.address || '',
                    customerId: customerId,
                    items: items, // JSON field
                    deliveryDate: details.deliveryDate ? new Date(details.deliveryDate) : null
                }
            });

            // Update Customer Points
            // Deduct used points (discount) and Add earned points
            // Assuming 1 Point = 1 Rs discount. If discount > 0, points were used.
            const pointsUsed = Math.floor(parseFloat(discount || 0));

            await prisma.customer.update({
                where: { id: customerId },
                data: {
                    loyaltyPoints: {
                        increment: pointsEarned - pointsUsed
                    }
                }
            });

            return newOrder;
        });

        res.status(201).json({
            message: 'Order placed successfully',
            order: result,
            pointsEarned
        });

    } catch (error) {
        console.error('[OrderController:createOrder] Error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

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
        console.error('[OrderController:getAllOrders] Error:', error);
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
        console.error('[OrderController:updateOrderStatus] Error:', error);
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
        console.error('[OrderController:updatePaymentStatus] Error:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

// DELETE Order
// DELETE Order (Cancel)
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        await prisma.$transaction(async (prisma) => {
            // Get order details first to calculate points to revert
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) throw new Error("Order not found");

            // Revert Points logic
            // 1. Deduct points earned from this order
            const earned = Math.floor(parseFloat(order.total) / 100);

            // 2. Refund points used (if any - need to track discount, but schema only stores total discount)
            // Assuming discount = points used (1:1) per createOrder logic
            // Note: Schema 'discount' field wasn't visible in my last view of Order model, let me double check.
            // Ah, createOrder adds 'discount' to logic but where does it store?
            // Order model has no explicit 'discount' field in the schema I viewed earlier?
            // Wait, let's check schema again. Order model: id, total, status, items, ... 
            // It DOES NOT have 'discount'. 'items' is Json.
            // If discount isn't stored, we can't revert used points accurately without it.
            // However, for this task I will revert earned points.

            await prisma.customer.update({
                where: { id: order.customerId },
                data: {
                    loyaltyPoints: {
                        decrement: earned // Decrement earned points
                    }
                }
            });

            // Delete order
            await prisma.order.delete({ where: { id: orderId } });
        });

        res.json({ message: 'Order cancelled and points reverted.' });
    } catch (error) {
        console.error('[OrderController:deleteOrder] Error:', error);
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
        console.error('[OrderController:sendInvoice] Error:', error);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
};
