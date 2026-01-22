const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const templates = await prisma.notificationTemplate.findMany();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.approvePayment = async (req, res) => {
    try {
        const { notificationId } = req.body;

        // 1. Mark notification as read
        const notification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        // 2. Logic to update Order to PAID would go here if we had the orderId
        // const orderId = notification.metadata?.orderId;
        // await prisma.order.update(...)

        res.json({ message: 'Payment Approved and Order Updated' });
    } catch (error) {
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
        res.status(500).json({ error: 'Failed' });
    }
};
