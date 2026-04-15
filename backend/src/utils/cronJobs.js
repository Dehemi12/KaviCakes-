const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendBulkEmailsThrottled } = require('./emailService');

/**
 * Core notification logic that can be triggered by cron or on server start
 */
const runDailyJobs = async () => {
    console.log('[Cron] Running automated notifications audit...');
    try {
        const now = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(now.getDate() + 2);
        
        const startSearch = new Date(now);
        const endSearch = new Date(twoDaysFromNow);
        endSearch.setHours(23, 59, 59, 999);

        // EXTRA: Check for recently sent emails in the last 6 hours to prevent duplication on restarts
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const recentLogs = await prisma.emaillog.findMany({
            where: {
                sentAt: { gte: sixHoursAgo },
                status: 'SENT'
            },
            select: { orderId: true }
        });
        const recentlyEmailedOrderIds = new Set(recentLogs.map(l => l.orderId).filter(Boolean));

        let emailQueue = [];

        // 1. Payment Reminders
        const paymentOrders = await prisma.orders.findMany({
            where: {
                deliveryDate: { gte: startSearch, lte: endSearch },
                status: { notIn: ['CANCELLED', 'DELIVERED', 'READY', 'OUT_FOR_DELIVERY'] }
            },
            include: { customer: true }
        });

        const paymentQueue = paymentOrders
            .filter(order => !recentlyEmailedOrderIds.has(order.id)) // SKIP RECENTLY EMAILED
            .filter(order => {
                const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                if (isOnline) return order.paymentStatus !== 'PAID';
                else return order.advanceStatus !== 'APPROVED';
            }).map(order => {
                const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                return {
                    to: order.customer.email,
                    templateType: isOnline ? 'FULL_PAYMENT_REQUIRED' : 'ADVANCE_REQUIRED',
                    variables: {
                        '{customer_name}': order.customer.name,
                        '{order_id}': order.id,
                        '{delivery_date}': new Date(order.deliveryDate).toLocaleDateString()
                    },
                    orderId: order.id
                };
            });

        // 2. Last Edit Reminders
        const editOrders = await prisma.orders.findMany({
            where: {
                deliveryDate: { gte: startSearch, lte: endSearch },
                orderType: { in: ['CUSTOM', 'BULK'] },
                status: { notIn: ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] }
            },
            include: { customer: true }
        });

        const editQueue = editOrders
            .filter(order => !recentlyEmailedOrderIds.has(order.id)) // SKIP RECENTLY EMAILED
            .map(order => ({
                to: order.customer.email,
                templateType: 'QUICK_REMINDER',
                variables: {
                    '{customer_name}': order.customer.name,
                    '{order_id}': order.id,
                    '{delivery_date}': new Date(order.deliveryDate).toLocaleDateString()
                },
                orderId: order.id
            }));

        emailQueue = [...paymentQueue, ...editQueue];

        // Deduplicate
        const uniqueQueue = [];
        const seenOrderIds = new Set();
        emailQueue.forEach(item => {
            if (!seenOrderIds.has(item.orderId)) {
                uniqueQueue.push(item);
                seenOrderIds.add(item.orderId);
            }
        });

        if (uniqueQueue.length > 0) {
            console.log(`[Cron] Queuing ${uniqueQueue.length} emails for pending upcoming orders.`);
            await sendBulkEmailsThrottled(uniqueQueue, 2500);
        } else {
            console.log('[Cron] No automated actions needed right now.');
        }

    } catch (error) {
        console.error('[Cron] Error running daily jobs:', error);
    }
};

const initCronJobs = () => {
    console.log('[Cron] Initializing automated daily scheduled tasks...');

    // NOTE: Startup audit removed to prevent duplication on server restarts.
    // Reliability is maintained by the daily 8:00 AM run and creation-time triggers.

    // Schedule to run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        await runDailyJobs();
    });
};

module.exports = { initCronJobs };
