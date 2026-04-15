const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultTemplates = [
    {
        name: 'ORDER_CONFIRMED_DEFAULT',
        type: 'ORDER_CONFIRMED',
        subject: 'Order Confirmation - Kavi Cakes',
        body: '<p>Hi {customer_name},</p><p>Your order #{order_id} scheduled for {delivery_date} has been confirmed.</p><p>Thank you for choosing Kavi Cakes!</p>'
    },
    {
        name: 'PAYMENT_CONFIRMED_DEFAULT',
        type: 'PAYMENT_CONFIRMED',
        subject: 'Payment Received - Kavi Cakes',
        body: '<p>Hi {customer_name},</p><p>We have successfully received your payment for order #{order_id}.</p><p><strong>Total:</strong> {total_amount}<br/><strong>Paid:</strong> {advance_amount}<br/><strong>Remaining Balance:</strong> {balance_amount}</p><p>Your cake will be ready by {delivery_date}.</p>'
    },
    {
        name: 'PAYMENT_REMINDER_DEFAULT',
        type: 'PAYMENT_REMINDER',
        subject: 'Action Required: Payment Reminder for Order #{order_id}',
        body: '<p>Hi {customer_name},</p><p>This is a quick reminder regarding your upcoming order #{order_id} on {delivery_date}.</p><p>Please ensure your payment is completed as per our policy to avoid any delays in preparation.</p><p>Thank you!</p>'
    },
    {
        name: 'ADVANCE_REQUIRED_DEFAULT',
        type: 'ADVANCE_REQUIRED',
        subject: '⚠️ Action Required: Advance Payment for your KaviCakes Order #{order_id}',
        body: '<p>Hi {customer_name},</p><p>We have received your order #{order_id}. To begin preparation for your delivery on {delivery_date}, we require an <strong>advance payment (COD)</strong>.</p><p>Please ensure you upload the payment slip early to avoid delays.</p>'
    },
    {
        name: 'FULL_PAYMENT_REQUIRED_DEFAULT',
        type: 'FULL_PAYMENT_REQUIRED',
        subject: '💳 Action Required: Full Payment for your KaviCakes Order #{order_id}',
        body: '<p>Hi {customer_name},</p><p>Thank you for your order #{order_id}! To proceed with your delivery on {delivery_date}, we require <strong>full payment</strong> to be completed.</p><p>Please ensure you complete the payment and upload the slip at least 2 days before delivery.</p>'
    },
    {
        name: 'QUICK_REMINDER_DEFAULT',
        type: 'QUICK_REMINDER',
        subject: 'Last Chance to Edit Your Order #{order_id}',
        body: '<p>Hi {customer_name},</p><p>Your custom order will start preparation soon for delivery on {delivery_date}.</p><p>This is your last chance to make any edits to your order. Please contact us via our website immediately if you need changes.</p>'
    },
    {
        name: 'READY_DEFAULT',
        type: 'READY',
        subject: 'Your Cake is Ready! - Kavi Cakes',
        body: '<p>Hi {customer_name},</p><p>Your order #{order_id} is now complete and ready for pickup/delivery!</p><p>Thank you for choosing Kavi Cakes.</p>'
    },
    {
        name: 'DELIVERED_DEFAULT',
        type: 'DELIVERED',
        subject: 'Your Cake has been Delivered',
        body: '<p>Hi {customer_name},</p><p>We hope you enjoyed your order #{order_id}!</p><p>If you loved it, please leave us a review.</p><p>Best regards,<br/>Kavi Cakes</p>'
    },
    {
        name: 'ORDER_REJECTED_DEFAULT',
        type: 'ORDER_REJECTED',
        subject: 'Update regarding your KaviCakes Order #{order_id}',
        body: '<p>Hi {customer_name},</p><p>We regret to inform you that your order #{order_id} has been cancelled/rejected.</p><p>If you have already made a payment, please contact us immediately regarding the refund. We apologize for any inconvenience.</p>'
    }
];

async function seed() {
    console.log('Seeding default email templates...');
    for (const data of defaultTemplates) {
        // Find existing template by type to avoid duplicating on re-runs
        const existing = await prisma.notificationTemplate.findFirst({
            where: { type: data.type }
        });
        if (!existing) {
            await prisma.notificationTemplate.create({ data });
            console.log(`Created template: ${data.name}`);
        } else {
            console.log(`Template for ${data.type} already exists.`);
        }
    }
    console.log('Seeding completed.');
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
