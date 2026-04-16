const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Schedule (Merged Events + Order Deliveries)
exports.getSchedule = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start, end;

        // Default to current month if not provided
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // 1. Fetch Manual Events
        const events = await prisma.event.findMany({
            where: {
                startTime: {
                    gte: start,
                    lte: end
                }
            }
        });

        // 2. Fetch Orders with Delivery Dates
        const orders = await prisma.orders.findMany({
            where: {
                status: { not: 'CANCELLED' },
                deliveryDate: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                id: true,
                deliveryDate: true,
                customer: { select: { name: true, address: true } },
                items: true, // To show what's in the order
                status: true
            }
        });

        // 3. Transform Orders to Virtual Events
        const orderEvents = orders.map(order => ({
            id: `ORD-${order.id}`,
            title: `Order #${order.id} Delivery`,
            description: `Customer: ${order.customer.name}\nItems: ${JSON.stringify(order.items)}\nAddress: ${order.customer.address}`,
            startTime: order.deliveryDate,
            endTime: new Date(new Date(order.deliveryDate).getTime() + 60 * 60 * 1000), // Approx 1 hour duration
            type: 'ORDER_DELIVERY',
            category: 'Delivery',
            isVirtual: true,
            status: order.status
        }));

        // 4. Transform Manual Events
        const manualEvents = events.map(e => ({
            ...e,
            isVirtual: false
        }));

        // 5. Merge and Sort
        const combinedSchedule = [...manualEvents, ...orderEvents].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        res.json(combinedSchedule);

    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
};

// Add Manual Event
exports.addEvent = async (req, res) => {
    try {
        const { title, description, startTime, endTime, category } = req.body;

        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                type: 'MANUAL',
                category: category || 'General',
                updatedAt: new Date()
            }
        });

        // Trigger Notification
        await prisma.notification.create({
            data: {
                title: 'New Schedule Event',
                message: `Event "${title}" has been added to the schedule for ${new Date(startTime).toLocaleDateString()}.`,
                type: 'SYSTEM'
            }
        });

        res.json(newEvent);

    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event' });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('[ScheduleController] Error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};
