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
