const fs = require('fs');
const file = 'e:/KaviCakes- Admin panel/backend/src/controllers/notificationController.js';
let content = fs.readFileSync(file, 'utf8');

// replace everything after the last `};`
content = content.replace(/\};\s*\/\/\s*Add\s*manual\s*individual\s*send\s*[\s\S]*$/, '};\n\n');

content += `exports.sendIndividualNotification = async (req, res) => {
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
            res.status(500).json({ error: 'Failed to send email. Check logs.' });
        }
    } catch (error) {
        console.error('[NotificationController:sendIndividual] Error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
`;

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
