const dayjs = require('dayjs');

/**
 * Generates an HTML representation of the invoice based on the order data.
 * @param {Object} order - Full order object with items, customer, delivery, and invoice record.
 * @returns {string} - HTML string
 */
exports.generateInvoiceHTML = (order) => {
    const { invoice, customer, items, delivery } = order;
    
    // Calculate Subtotal manually if not stored (sum of items)
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.unitPrice) * item.quantity), 0);
    const deliveryFee = parseFloat(delivery?.deliveryFee || 0);
    const loyaltyDiscount = parseFloat(order.loyaltyDiscount || 0);
    const total = parseFloat(order.total);

    const invoiceNo = invoice?.invoiceNumber || `INV-${dayjs().year()}-${order.id.toString().padStart(5, '0')}`;
    const invoiceDate = dayjs(invoice?.issuedAt || new Date()).format('DD MMMM YYYY');
    const deliveryDateStr = order.deliveryDate ? dayjs(order.deliveryDate).format('DD MMMM YYYY') : 'N/A';

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; margin: 20px auto; color: #334155; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #be185d; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">KaviCakes</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">1st Lane, Wabada Road, Kadawatha</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">077 123 4567 • Kavicakes@gmail.com</p>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 15px 0; margin-bottom: 25px;">
            <table style="width: 100%; font-size: 13px;">
                <tr>
                    <td style="color: #94a3b8; padding-bottom: 4px;">Invoice No:</td>
                    <td style="text-align: right; font-weight: 500; padding-bottom: 4px;">${invoiceNo}</td>
                </tr>
                <tr>
                    <td style="color: #94a3b8; padding-bottom: 4px;">Date:</td>
                    <td style="text-align: right; padding-bottom: 4px;">${invoiceDate}</td>
                </tr>
                <tr>
                    <td style="color: #94a3b8;">Billed To:</td>
                    <td style="text-align: right; font-weight: 500;">${customer?.name || 'Customer'}</td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Items Summary</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                ${items.map(item => `
                    <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                            <span style="font-weight: 500;">${item.name || 'Item'}</span>
                            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                                ${item.quantity} x Rs. ${parseFloat(item.unitPrice).toLocaleString()}
                                ${item.customDetails ? `<br/>${item.customDetails}` : ''}
                            </div>
                        </td>
                        <td style="padding: 6px 0; text-align: right; vertical-align: top;">
                            Rs. ${(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}
                        </td>
                    </tr>
                `).join('')}
                ${deliveryFee > 0 ? `
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Delivery Charge</td>
                        <td style="padding: 6px 0; text-align: right;">Rs. ${deliveryFee.toLocaleString()}</td>
                    </tr>
                ` : ''}
            </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-bottom: 30px;">
            <table style="width: 100%; font-size: 14px;">
                <tr>
                    <td style="padding-bottom: 6px; color: #64748b;">Subtotal</td>
                    <td style="text-align: right; padding-bottom: 6px;">Rs. ${subtotal.toLocaleString()}</td>
                </tr>
                ${loyaltyDiscount > 0 ? `
                    <tr>
                        <td style="padding-bottom: 6px; color: #be185d;">Discount (Loyalty)</td>
                        <td style="text-align: right; padding-bottom: 6px; color: #be185d;">-Rs. ${loyaltyDiscount.toLocaleString()}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td style="padding-top: 10px; font-weight: 600; font-size: 16px;">Total Amount</td>
                    <td style="text-align: right; padding-top: 10px; font-weight: 700; font-size: 18px; color: #be185d;">Rs. ${total.toLocaleString()}</td>
                </tr>
            </table>

            <div style="text-align: right; margin-top: 15px; font-size: 12px; color: #64748b;">
                ${order.paymentMethod} • <span style="color: ${order.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b'};">${order.paymentStatus}</span>
            </div>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; padding-top: 20px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 500; color: #334155;">Delivery due on ${deliveryDateStr}</p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">${order.address || delivery?.address || 'Store Pickup'}</p>
            ${order.specialNotes ? `<p style="margin: 10px 0 0 0; font-size: 12px; color: #be185d;">Note: ${order.specialNotes}</p>` : ''}
        </div>

        <div style="margin-top: 30px; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">Thank You</p>
        </div>
    </div>
    `;
};
