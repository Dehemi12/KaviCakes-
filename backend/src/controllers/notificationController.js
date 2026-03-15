const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { customerId: null },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error) {
        console.error('[NotificationController] Error:', error); res.status(500).json({ error: 'Server error' });
    }
};

exports.getCustomerNotifications = async (req, res) => {
    try {
        const customerId = req.user.id;
        const now = new Date();
        const todayAtMidnight = new Date(now.setHours(0, 0, 0, 0));

        // Fetch active orders
        const activeOrders = await prisma.order.findMany({
            where: {
                customerId: customerId,
                status: { notIn: ['DELIVERED', 'CANCELLED'] }
            },
            include: { customOrder: true, bulkOrder: true }
        });

        // Fetch existing notifications to avoid duplicates
        const existingNotifications = await prisma.notification.findMany({
            where: { customerId }
        });

        const hasNotification = (type, orderId) => {
            return existingNotifications.some(n => n.type === type && (n.metadata && n.metadata.orderId === orderId));
        };

        const newNotificationsData = [];

        for (const order of activeOrders) {
            const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
            if (!deliveryDate) continue;

            const dDate = new Date(deliveryDate);
            dDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((dDate - todayAtMidnight) / (1000 * 60 * 60 * 24));

            // Advance Payment (COD)
            if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' && order.advanceStatus !== 'APPROVED' && diffDays <= 2) {
                if (!hasNotification('PAYMENT_ADVANCE', order.id)) {
                    newNotificationsData.push({
                        customerId, title: 'Advance Payment Required',
                        message: `Your order #${order.id} requires an advance payment before the delivery date. Please complete the advance payment at least 2 days before delivery to avoid order cancellation.`,
                        type: 'PAYMENT_ADVANCE', metadata: { orderId: order.id }
                    });
                }
            }

            // Full Payment (Online)
            if ((order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER') && order.paymentStatus !== 'PAID' && diffDays <= 2) {
                if (!hasNotification('PAYMENT_FULL', order.id)) {
                    newNotificationsData.push({
                        customerId, title: 'Full Payment Required',
                        message: `Your order #${order.id} requires full payment before the delivery date. Please complete the payment at least 2 days before delivery to confirm your order.`,
                        type: 'PAYMENT_FULL', metadata: { orderId: order.id }
                    });
                }
            }


            // Edit Reminder
            const isCustomOrBulk = order.orderType === 'CUSTOM' || order.orderType === 'BULK' || !!order.customOrder || !!order.bulkOrder;
            if (isCustomOrBulk && !order.isEdited && order.paymentStatus !== 'PAID' && diffDays <= 4 && diffDays > 2) {
                if (!hasNotification('EDIT_REMINDER', order.id)) {
                    newNotificationsData.push({
                        customerId, title: 'Last Chance to Edit Your Order',
                        message: `You can edit your custom order (#${order.id}) only once. If you need to make changes, please edit your order before 2 days prior to the delivery date.`,
                        type: 'EDIT_REMINDER', metadata: { orderId: order.id }
                    });
                }
            }
        }

        if (newNotificationsData.length > 0) {
            await prisma.notification.createMany({ data: newNotificationsData });
        }

        // Return all
        const userNotifications = await prisma.notification.findMany({
            where: { customerId: customerId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(userNotifications);
    } catch (error) {
        console.error('[NotificationController:getCustomerNotifications] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const templates = await prisma.notificationTemplate.findMany();
        res.json(templates);
    } catch (error) {
        console.error('[NotificationController] Error:', error); res.status(500).json({ error: 'Server error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { title, category, body, name, actionButton } = req.body;
        const newTemplate = await prisma.notificationTemplate.create({
            data: { title, category, body, name, actionButton }
        });
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('[NotificationController:createTemplate] Error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
};

exports.sendManualNotification = async (req, res) => {
    try {
        const { orderIds, messageTitle, messageBody } = req.body;

        if (!orderIds || orderIds.length === 0) {
            return res.status(400).json({ error: 'No orders selected' });
        }

        // 1. Sanitize IDs (Convert to numbers)
        const numericIds = orderIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (numericIds.length === 0) {
            return res.status(400).json({ error: 'All provided IDs are invalid' });
        }

        const orders = await prisma.order.findMany({
            where: { id: { in: numericIds } },
            select: {
                id: true,
                total: true,
                deliveryDate: true,
                customerId: true,
                customer: { select: { name: true } }
            }
        });

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Matching orders not found' });
        }

        const notificationsData = orders.map(order => {
            let finalBody = String(messageBody);

            // Replace {{name}} with First Name
            if (order.customer?.name) {
                const firstName = String(order.customer.name).split(' ')[0];
                finalBody = finalBody.replace(/\{\{name\}\}/gi, firstName);
                finalBody = finalBody.replace(/\{\{full_name\}\}/gi, String(order.customer.name));
            }

            // Replace {{order_id}} accurately
            finalBody = finalBody.replace(/\{\{order_id\}\}/gi, String(order.id));

            // Replace {{delivery_date}}
            if (order.deliveryDate) {
                const dateStr = new Date(order.deliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                finalBody = finalBody.replace(/\{\{delivery_date\}\}/gi, dateStr);
                finalBody = finalBody.replace(/\{\{date\}\}/gi, dateStr);
            } else {
                finalBody = finalBody.replace(/\{\{delivery_date\}\}/gi, 'N/A');
                finalBody = finalBody.replace(/\{\{date\}\}/gi, 'N/A');
            }

            // Replace {{amount}}
            const amount = parseFloat(order.total || 0);
            const amountStr = `Rs.${amount.toLocaleString()}`;
            finalBody = finalBody.replace(/\{\{amount\}\}/gi, amountStr);
            finalBody = finalBody.replace(/\{\{total\}\}/gi, amountStr);

            // Compatibility
            finalBody = finalBody.replace(/\{ORDER_ID\}/g, String(order.id));
            finalBody = finalBody.replace(/\{DELIVERY_DATE\}/g, order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A');

            return {
                customerId: order.customerId,
                title: messageTitle || 'Notification from KaviCakes',
                message: finalBody,
                type: 'SYSTEM',
                metadata: { orderId: order.id }
            };
        });

        // Use transaction or createMany
        const result = await prisma.notification.createMany({
            data: notificationsData,
            skipDuplicates: true
        });

        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('[NotificationController:sendManualNotification] CRITICAL ERROR:', error);
        res.status(500).json({
            error: 'Failed to send notifications system-side',
            details: error.message
        });
    }
};

exports.approvePayment = async (req, res) => {
    try {
        const { notificationId } = req.body;

        const notification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        res.json({ message: 'Payment Approved and Order Updated' });
    } catch (error) {
        console.error('[NotificationController:approvePayment] Error:', error);
        res.status(500).json({ error: 'Failed to approve' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('[NotificationController:markAsRead] Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};
