exports.getLogs = async (req, res) => {
    try {
        const logs = await prisma.emailLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (error) {
        console.error('[NotificationController:getLogs] Error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body } = req.body;
        
        const template = await prisma.notificationTemplate.update({
            where: { id: parseInt(id) },
            data: { subject, body }
        });
        res.json({ message: 'Template updated', template });
    } catch (error) {
        console.error('[NotificationController:updateTemplate] Error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
};

exports.getPendingBulkNotifications = async (req, res) => {
    try {
        const type = req.query.type;
        const now = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(now.getDate() + 2);
        
        let pendingRecords = [];
        const startOfTwoDaysFromNow = new Date(twoDaysFromNow);
        startOfTwoDaysFromNow.setHours(0, 0, 0, 0);
        const endOfTwoDaysFromNow = new Date(twoDaysFromNow);
        endOfTwoDaysFromNow.setHours(23, 59, 59, 999);

        if (type === 'PAYMENT_REMINDER') {
            const orders = await prisma.order.findMany({
                where: {
                    deliveryDate: { gte: startOfTwoDaysFromNow, lte: endOfTwoDaysFromNow },
                    status: { notIn: ['CANCELLED', 'DELIVERED', 'READY', 'OUT_FOR_DELIVERY'] }
                },
                include: { customer: true }
            });

            const filteredOrders = orders.filter(order => {
                const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                if (isOnline) return order.paymentStatus !== 'PAID';
                else return order.advanceStatus !== 'APPROVED';
            });

            pendingRecords = filteredOrders.map(order => ({
                orderId: order.id,
                customerName: order.customer.name,
                email: order.customer.email,
                deliveryDate: order.deliveryDate,
                reason: order.paymentMethod === 'COD' ? 'Advance Payment Pending' : 'Full Payment Pending'
            }));

        } else if (type === 'LAST_EDIT_REMINDER') {
            const orders = await prisma.order.findMany({
                where: {
                    deliveryDate: { gte: startOfTwoDaysFromNow, lte: endOfTwoDaysFromNow },
                    orderType: { in: ['CUSTOM', 'BULK'] },
                    status: { notIn: ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] }
                },
                include: { customer: true }
            });

            pendingRecords = orders.map(order => ({
                orderId: order.id,
                customerName: order.customer.name,
                email: order.customer.email,
                deliveryDate: order.deliveryDate,
                reason: 'Last Chance to Edit'
            }));

        } else if (type === 'READY') {
            const orders = await prisma.order.findMany({
                where: { status: 'READY' },
                include: { customer: true }
            });

            pendingRecords = orders.map(order => ({
                orderId: order.id,
                customerName: order.customer.name,
                email: order.customer.email,
                deliveryDate: order.deliveryDate,
                reason: 'Order is Ready'
            }));
        }

        res.json({ pendingCount: pendingRecords.length, records: pendingRecords, type });
    } catch (error) {
        console.error('[NotificationController:getPendingBulk] Error:', error);
        res.status(500).json({ error: 'Failed to fetch pending notifications' });
    }
};

exports.sendBulkNotifications = async (req, res) => {
    try {
        const { type } = req.body;
        const { sendBulkEmailsThrottled } = require('../utils/emailService');
        
        const now = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(now.getDate() + 2);
        const startOfTwoDaysFromNow = new Date(twoDaysFromNow);
        startOfTwoDaysFromNow.setHours(0, 0, 0, 0);
        const endOfTwoDaysFromNow = new Date(twoDaysFromNow);
        endOfTwoDaysFromNow.setHours(23, 59, 59, 999);

        let emailQueue = [];

        if (type === 'PAYMENT_REMINDER') {
            const orders = await prisma.order.findMany({
                where: {
                    deliveryDate: { gte: startOfTwoDaysFromNow, lte: endOfTwoDaysFromNow },
                    status: { notIn: ['CANCELLED', 'DELIVERED', 'READY', 'OUT_FOR_DELIVERY'] }
                },
                include: { customer: true }
            });
            const filteredOrders = orders.filter(order => {
                const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                if (isOnline) return order.paymentStatus !== 'PAID';
                else return order.advanceStatus !== 'APPROVED';
            });

            emailQueue = filteredOrders.map(order => ({
                to: order.customer.email,
                templateType: 'PAYMENT_REMINDER',
                variables: {
                    '{customer_name}': order.customer.name,
                    '{order_id}': order.id,
                    '{delivery_date}': new Date(order.deliveryDate).toLocaleDateString()
                },
                orderId: order.id
            }));
        } else if (type === 'LAST_EDIT_REMINDER') {
            const orders = await prisma.order.findMany({
                where: {
                    deliveryDate: { gte: startOfTwoDaysFromNow, lte: endOfTwoDaysFromNow },
                    orderType: { in: ['CUSTOM', 'BULK'] },
                    status: { notIn: ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] }
                },
                include: { customer: true }
            });

            emailQueue = orders.map(order => ({
                to: order.customer.email,
                templateType: 'QUICK_REMINDER',
                variables: {
                    '{customer_name}': order.customer.name,
                    '{order_id}': order.id,
                    '{delivery_date}': new Date(order.deliveryDate).toLocaleDateString()
                },
                orderId: order.id
            }));
        } else if (type === 'READY') {
            const orders = await prisma.order.findMany({
                where: { status: 'READY' },
                include: { customer: true }
            });

            emailQueue = orders.map(order => ({
                to: order.customer.email,
                templateType: 'READY',
                variables: {
                    '{customer_name}': order.customer.name,
                    '{order_id}': order.id
                },
                orderId: order.id
            }));
        }

        if (emailQueue.length === 0) {
            return res.status(400).json({ error: 'No pending emails found for this type.' });
        }

        sendBulkEmailsThrottled(emailQueue, 2500)
            .catch(e => console.error('[NotificationController:BulkSendError]', e));

        res.json({ message: `Queued ${emailQueue.length} emails to process in background.`, count: emailQueue.length });
    } catch (error) {
        console.error('[NotificationController:sendBulk] Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};
