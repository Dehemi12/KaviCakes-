const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP host
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send a generic email
 */
const sendEmail = async (to, subject, text, html = null) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
        console.log(`Body: ${text}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"KaviCakes" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>')
        });
        console.log(`[Email] Sent successfully to ${to}`);
    } catch (error) {
        console.error(`[Email] Error sending to ${to}:`, error.message);
    }
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmation = async (customerName, customerEmail, orderId, orderDate) => {
    const subject = 'Your Order Has Been Confirmed';
    const text = `Dear ${customerName},

Your order has been successfully confirmed.

Order ID: ${orderId}
Order Date: ${orderDate}

We will begin preparing your order and notify you once it is ready.

Thank you for choosing our cake shop.

Best Regards,
KaviCakes`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #db2777; text-align: center;">Order Confirmed!</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Your order has been successfully confirmed.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
            </div>
            <p>We will begin preparing your order and notify you once it is ready.</p>
            <p>Thank you for choosing <strong>KaviCakes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.8em; color: #666; text-align: center;">
                Best Regards,<br />
                <strong>KaviCakes Team</strong>
            </p>
        </div>
    `;

    return sendEmail(customerEmail, subject, text, html);
};

module.exports = {
    sendEmail,
    sendOrderConfirmation
};
