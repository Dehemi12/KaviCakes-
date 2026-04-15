const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configure the transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Replace variables in template body with dynamic data
 * @param {string} templateBody - HTML body with variables like {customer_name}
 * @param {object} variables - Key-value pairs for replacement
 * @returns {string} parsed HTML
 */
const parseTemplate = (templateBody, variables) => {
    let parsedBody = templateBody;
    
    // Fallback dictionary for known variables to prevent breaking errors
    const fallbacks = {
        '{customer_name}': 'Customer',
        '{delivery_date}': 'your scheduled date',
        '{order_id}': 'your order',
        '{total_amount}': 'the total amount',
        '{advance_amount}': 'the advance amount',
        '{balance_amount}': 'the balance amount'
    };

    // Replace all variables that look like {variable_name}
    parsedBody = parsedBody.replace(/\{([^}]+)\}/g, (match) => {
        // If the variable exists in the provided data, use it. Otherwise, use fallback.
        if (variables && variables[match] !== undefined && variables[match] !== null) {
            return variables[match];
        } else if (fallbacks[match]) {
            console.warn(`[EmailService] Missing variable ${match}, using fallback: ${fallbacks[match]}`);
            return fallbacks[match];
        } else {
            console.warn(`[EmailService] Missing an unknown variable ${match}, leaving blank.`);
            return '';
        }
    });

    return parsedBody;
};

/**
 * Send an individual email and log the result to EmailLog
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Parsed HTML body
 * @param {number|null} orderId - Optional order ID for logging
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (to, subject, html, orderId = null) => {
    try {
        await transporter.sendMail({
            from: `"Kavi Cakes" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        // Log success
        await prisma.emailLog.create({
            data: {
                orderId: orderId ? parseInt(orderId) : null,
                email: to,
                status: 'SENT',
                error: null
            }
        });

        return true;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        
        // Log failure
        await prisma.emailLog.create({
            data: {
                orderId: orderId ? parseInt(orderId) : null,
                email: to,
                status: 'FAILED',
                error: error.message
            }
        });

        return false;
    }
};

/**
 * Fetch a template by its type and send it, mapping dynamic variables
 * @param {string} templateType - Template type (e.g., ORDER_CONFIRMED)
 * @param {string} to - Recipient email
 * @param {object} variables - Dynamic variables for replacement
 * @param {number|null} orderId - Related order ID
 */
const sendTemplateEmail = async (templateType, to, variables = {}, orderId = null) => {
    try {
        const template = await prisma.notificationTemplate.findFirst({
            where: { type: templateType }
        });

        if (!template) {
            console.error(`[EmailService] Template of type '${templateType}' not found.`);
            return false;
        }

        let parsedBody = parseTemplate(template.body, variables);
        const parsedSubject = parseTemplate(template.subject || 'Notification from Kavi Cakes', variables);

        // Merge logic: If this is a payment requirement for a Customizable order, append the edit reminder
        const paymentTriggers = ['ADVANCE_REQUIRED', 'FULL_PAYMENT_REQUIRED', 'PAYMENT_REMINDER'];
        if (orderId && paymentTriggers.includes(templateType)) {
            try {
                const order = await prisma.orders.findUnique({ where: { id: parseInt(orderId) } });
                if (order && (order.orderType === 'CUSTOM' || order.orderType === 'BULK')) {
                    const editNote = `
                        <div style="margin-top: 20px; padding: 15px; border: 1px dashed #be185d; background-color: #fff1f2; border-radius: 8px; font-family: sans-serif;">
                            <p style="margin: 0; color: #be185d; font-weight: bold; font-size: 14px;">⚠️ Action Required: Last Chance to Edit Your Order</p>
                            <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 13px;">Since this is a custom/bulk order, this is your <strong>final opportunity</strong> to make any adjustments to your design or specifications. Once your payment is approved, preparation will begin and no further changes will be permitted.</p>
                        </div>
                    `;
                    parsedBody += editNote;
                }
            } catch (err) {
                console.error('[EmailService] Error fetching order for merge logic:', err);
            }
        }

        return await sendEmail(to, parsedSubject, parsedBody, orderId);
    } catch (error) {
        console.error('[EmailService] Error in sendTemplateEmail:', error);
        return false;
    }
};

/**
 * Function to pause execution (Used for throttling)
 * @param {number} ms - Milliseconds to delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send bulk emails sequentially with throttling to avoid SMTP rate limits
 * @param {Array<{to: string, templateType: string, variables: object, orderId: number|null}>} emailQueue - List of emails to process
 * @param {number} throttleMs - Delay between emails in milliseconds (default 2500ms)
 */
const sendBulkEmailsThrottled = async (emailQueue, throttleMs = 2500) => {
    let sentCount = 0;
    let failedCount = 0;

    console.log(`[EmailService] Starting bulk email send of ${emailQueue.length} emails. Throttling: ${throttleMs}ms.`);

    for (const emailData of emailQueue) {
        const { to, templateType, variables, orderId, subject, html } = emailData;
        
        let success = false;
        if (subject && html) {
             success = await sendEmail(to, subject, html, orderId);
        } else {
             success = await sendTemplateEmail(templateType, to, variables, orderId);
        }
        
        if (success) sentCount++;
        else failedCount++;

        // Wait before sending the next one
        await delay(throttleMs);
    }

    console.log(`[EmailService] Bulk send completed. Sent: ${sentCount}, Failed: ${failedCount}`);
    return { sentCount, failedCount };
};

module.exports = {
    sendEmail,
    parseTemplate,
    sendTemplateEmail,
    sendBulkEmailsThrottled
};
