const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendBulkEmailsThrottled } = require('../utils/emailService');

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
        const activeOrders = await prisma.orders.findMany({
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
        const templates = await prisma.notificationtemplate.findMany();
        res.json(templates);
    } catch (error) {
        console.error('[NotificationController] Error:', error); res.status(500).json({ error: 'Server error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { subject, type, body, name, templateName } = req.body;
        const newTemplate = await prisma.notificationtemplate.create({
            data: { 
                subject, 
                type, 
                body, 
                name: name || templateName,
                updatedAt: new Date()
            }
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

        const orders = await prisma.orders.findMany({
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

exports.sendIndividualNotification = async (req, res) => {
    try {
        const { orderId, templateType } = req.body;
        const { sendTemplateEmail } = require('../utils/emailService');
        const order = await prisma.orders.findUnique({
            where: { id: parseInt(orderId) },
            include: { customer: true }
        });
        
        if (!order || !order.customer) {
            return res.status(404).json({ error: 'Order or customer not found' });
        }

        const success = await sendTemplateEmail(templateType, order.customer.email, {
            '{customer_name}': order.customer.name,
            '{order_id}': order.id,
            '{delivery_date}': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'your scheduled date'
        }, order.id);

        if (success) {
            res.json({ message: 'Email sent successfully!' });
        } else {
            res.status(500).json({ error: 'Failed' });
        }
    } catch (error) {
        console.error('[NotificationController:sendIndividual] Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};


exports.getLogs = async (req, res) => {
    try {
        const logs = await prisma.emaillog.findMany({
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
        const { subject, body, type } = req.body;
        
        const template = await prisma.notificationtemplate.update({
            where: { id: parseInt(id) },
            data: { 
                subject, 
                body,
                type,
                updatedAt: new Date()
            }
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
            const orders = await prisma.orders.findMany({
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
            const orders = await prisma.orders.findMany({
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
            const orders = await prisma.orders.findMany({
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
            const orders = await prisma.orders.findMany({
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
            const orders = await prisma.orders.findMany({
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
            const orders = await prisma.orders.findMany({
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

exports.sendMarketingCampaign = async (req, res) => {
    try {
        const { targetType, customerIds, subject, body } = req.body;
        const { sendBulkEmailsThrottled, parseTemplate } = require('../utils/emailService');

        let customers = [];
        if (targetType === 'ALL') {
             customers = await prisma.customer.findMany({ select: { id: true, email: true, name: true } });
        } else if (targetType === 'SELECTED' && Array.isArray(customerIds)) {
             customers = await prisma.customer.findMany({
                 where: { id: { in: customerIds } },
                 select: { id: true, email: true, name: true }
             });
        }

        if (customers.length === 0) {
            return res.status(400).json({ error: 'No customers selected or found.' });
        }

        if (!subject || !body) {
            return res.status(400).json({ error: 'Subject and body are required.' });
        }

        const emailQueue = customers.map(c => {
            const firstName = c.name ? c.name.split(' ')[0] : 'Customer';
            const variables = {
               '{customer_name}': c.name || 'Customer',
               '{name}': firstName
            };
            const parsedBody = parseTemplate(body, variables);
            const parsedSubject = parseTemplate(subject, variables);

            return {
                to: c.email,
                subject: parsedSubject,
                html: parsedBody,
                orderId: null
            };
        });

        // Fire and forget
        sendBulkEmailsThrottled(emailQueue, 2500)
            .catch(e => console.error('[NotificationController:MarketingSendError]', e));

        res.json({ message: `Marketing campaign queued for ${emailQueue.length} customers.`, count: emailQueue.length });
    } catch (error) {
        console.error('[NotificationController:sendMarketingCampaign] Error:', error);
        res.status(500).json({ error: 'Failed to dispatch marketing campaign' });
    }
};
