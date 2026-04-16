const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate or Retrieve Invoice for an Order
exports.getInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const id = parseInt(orderId);
        console.log(`[InvoiceController] Fetching invoice for order #${id}`);

        const order = await prisma.orders.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                cake: true,
                                size: true,
                                flavor: true,
                                shape: true
                            }
                        }
                    }
                },
                delivery: true,
                invoice: true
            }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // If not delivered yet (and not admin), restrict access? 
        // User said: "customers can view the invoice when order become delivered"
        if (order.status !== 'DELIVERED' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Invoice is available only after order is delivered.' });
        }

        let invoice = order.invoice;

        // If no invoice record exists but order is delivered, create it on the fly
        if (!invoice && order.status === 'DELIVERED') {
            const year = new Date().getFullYear();
            const invoiceNumber = `INV-${year}-${order.id.toString().padStart(5, '0')}`;
            
            invoice = await prisma.invoice.create({
                data: {
                    orderId: order.id,
                    invoiceNumber: invoiceNumber,
                    issuedAt: new Date()
                }
            });
        }

        if (!invoice) {
             return res.status(404).json({ error: 'Invoice not yet generated for this order.' });
        }

        res.json({
            invoice,
            order: {
                id: order.id,
                total: order.total,
                subtotal: Number(order.total) + Number(order.loyaltyDiscount) - Number(order.delivery?.deliveryFee || 0), // Basic reversal for breakdown
                loyaltyDiscount: Number(order.loyaltyDiscount),
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                status: order.status,
                deliveryDate: order.deliveryDate,
                specialNotes: order.specialNotes,
                createdAt: order.createdAt,
                customer: order.customer,
                items: order.items.map(item => ({
                    name: item.name || item.variant?.cake?.name || 'Item',
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.unitPrice) * item.quantity,
                    variant: item.variant ? {
                        size: item.variant.size?.label,
                        flavor: item.variant.flavor?.label,
                        shape: item.variant.shape?.label
                    } : null
                })),
                delivery: order.delivery
            }
        });

    } catch (error) {
        console.error('[InvoiceController] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
