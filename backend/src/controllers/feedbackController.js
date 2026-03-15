const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllFeedback = async (req, res) => {
    try {
        const feedback = await prisma.feedback.findMany({
            include: {
                customer: {
                    select: { id: true, name: true, displayId: true, loyaltyPoints: true }
                },
                order: {
                    select: { id: true, createdAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(feedback);
    } catch (error) {
        console.error('[FeedbackController] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createFeedback = async (req, res) => {
    try {
        const { orderId, rating, title, comment } = req.body;
        const customerId = req.user.id;

        // 1. Verify Ownership & Status
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.customerId !== customerId) return res.status(403).json({ error: 'Unauthorized' });

        // 2. Status Validation
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ error: 'Feedback can only be submitted for delivered orders' });
        }

        // 3. Check Duplicates
        const existing = await prisma.feedback.findUnique({
            where: { orderId: parseInt(orderId) }
        });
        if (existing) {
            return res.status(400).json({ error: 'Feedback already exists for this order' });
        }

        // 4. Create
        const feedback = await prisma.feedback.create({
            data: {
                rating: parseInt(rating),
                title,
                comment,
                customerId,
                orderId: parseInt(orderId),
                status: 'PENDING'
            }
        });

        res.status(201).json(feedback);

    } catch (error) {
        console.error('[FeedbackController:create] Error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};

exports.updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await prisma.feedback.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.json({ message: 'Feedback status updated' });
    } catch (error) {
        console.error('[FeedbackController] Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

exports.replyToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        const feedback = await prisma.feedback.update({
            where: { id: parseInt(id) },
            data: {
                reply,
                replyAt: new Date(),
                status: 'APPROVED'
            }
        });

        res.json({ message: 'Reply added and feedback approved', feedback });
    } catch (error) {
        console.error('[FeedbackController] Error:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
};

exports.getPublicFeedbacks = async (req, res) => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            where: { status: 'APPROVED' },
            include: {
                customer: { select: { name: true } }
            },
            take: 6, // Limit for homepage
            orderBy: { createdAt: 'desc' }
        });
        res.json(feedbacks);
    } catch (error) {
        console.error('[FeedbackController] Error:', error);
        res.status(500).json({ error: 'Failed to fetch public feedbacks' });
    }
};
