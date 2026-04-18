const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const htmlWrapper = (content) => `
<div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
    <h2 style="color: #be185d; text-align: center;">{title}</h2>
    ${content}
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="text-align: center; color: #999; font-size: 12px;">Thank you for choosing KaviCakes! We hope you love it.</p>
</div>
`;

async function main() {
    const templates = [
        {
            name: 'ORDER_CONFIRMED',
            type: 'ORDER_CONFIRMED',
            subject: 'Order Confirmation - Kavi Cakes',
            body: htmlWrapper(`
                <p>Hi {customer_name},</p>
                <p>Your order <strong>#{order_id}</strong> scheduled for <strong>{delivery_date}</strong> has been confirmed.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">Our team is now beginning the preparation for your special cake.</p>
                </div>
            `).replace('{title}', 'Order Confirmed')
        },
        {
            name: 'PAYMENT_CONFIRMED',
            type: 'PAYMENT_CONFIRMED',
            subject: 'Payment Successful - Kavi Cakes',
            body: htmlWrapper(`
                <p>Hi {customer_name},</p>
                <p>We have successfully received your payment for order <strong>#{order_id}</strong>.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> {total_amount}</p>
                    <p style="margin: 5px 0;"><strong>Paid So Far:</strong> {advance_amount}</p>
                    <p style="margin: 5px 0; color: #166534;"><strong>Remaining Balance:</strong> {balance_amount}</p>
                </div>
                <p>Your cake will be ready by <strong>{delivery_date}</strong>.</p>
            `).replace('{title}', 'Payment Confirmed')
        },
        {
            name: 'BANK_SLIP_RECEIVED',
            type: 'BANK_SLIP_RECEIVED',
            subject: 'Payment Slip Received - Verification Pending',
            body: htmlWrapper(`
                <p>Hi {customer_name},</p>
                <p>We've received the payment slip you uploaded for order <strong>#{order_id}</strong>.</p>
                <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;">Our team is now verifying your payment. You will receive another update once it is approved.</p>
                </div>
                <p style="color: #666; font-size: 14px;">Typically, verification takes 1-2 hours during business hours. Thank you for your patience!</p>
            `).replace('{title}', 'Slip Uploaded')
        },
        {
            name: 'ADVANCE_REQUIRED',
            type: 'ADVANCE_REQUIRED',
            subject: 'Advance Payment Required - Kavi Cakes',
            body: htmlWrapper(`
                <p>Hi {customer_name},</p>
                <p>To begin preparation for your order <strong>#{order_id}</strong>, we require an advance payment.</p>
                <div style="background-color: #fdf2f8; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbcfe8;">
                    <p style="margin: 0; color: #be185d; font-weight: bold;">Required Advance: {advance_amount}</p>
                </div>
                <p>Please upload your payment slip through the Order Tracking page.</p>
            `).replace('{title}', 'Action Required')
        },
        {
            name: 'PAYMENT_REMINDER',
            type: 'PAYMENT_REMINDER',
            subject: 'Payment Reminder - Kavi Cakes',
            body: htmlWrapper(`
                <p>Hi {customer_name},</p>
                <p>This is a quick reminder regarding your upcoming order <strong>#{order_id}</strong> on <strong>{delivery_date}</strong>.</p>
                <p>Please ensure your payment is completed as per our policy to avoid any delays in preparation.</p>
            `).replace('{title}', 'Payment Reminder')
        }
    ];

    console.log('Syncing and Styling ALL templates...');
    for (const t of templates) {
        await prisma.notificationtemplate.upsert({
            where: { name: t.name },
            update: {
                subject: t.subject,
                body: t.body,
                updatedAt: new Date()
            },
            create: {
                ...t,
                updatedAt: new Date()
            }
        });
        console.log(`- ${t.name} styled and synced.`);
    }
}

main().finally(() => prisma.$disconnect());
