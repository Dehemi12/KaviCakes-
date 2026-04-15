const fs = require('fs');
const file = 'e:/KaviCakes- Admin panel/backend/src/controllers/notificationController.js';
// Read as raw buffer to find the exact byte index of `sendBulkEmailsThrottled` area or the last `};`
let buf = fs.readFileSync(file);
let content = buf.toString('latin1'); // so every byte is a character, avoiding utf-16 mangling

// Find the string that represents the end of the correct file:
// `res.status(500).json({ error: 'Failed' });\n    }\n};`
const target = "res.status(500).json({ error: 'Failed' });\n    }\n};";
let idx = content.indexOf("res.status(500).json({ error: 'Failed' });");

if (idx !== -1) {
    // Find the closing brace after it
    let endIdx = content.indexOf("};", idx);
    if (endIdx !== -1) {
        // We know the good portion is up to endIdx + 2
        let goodPortionBuf = buf.slice(0, endIdx + 2);
        let goodPortionText = goodPortionBuf.toString('utf8');
        
        // Now append the individual send logic
        goodPortionText += `\n\nexports.sendIndividualNotification = async (req, res) => {
    try {
        const { orderId, templateType } = req.body;
        const { sendTemplateEmail } = require('../utils/emailService');
        const order = await prisma.order.findUnique({
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
};\n`;
        // Write it back
        fs.writeFileSync(file, goodPortionText, 'utf8');
        console.log("Successfully cleaned and repaired the file.");
    }
} else {
    console.log("Target string not found, cannot repair.");
}
