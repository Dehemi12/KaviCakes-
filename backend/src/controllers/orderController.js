const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST Create Order
exports.createOrder = async (req, res) => {
    try {
        const { items, total, subtotal, discount, deliveryFee, details, paymentMethod, orderType, specialNotes } = req.body;
        // customerId from authMiddleware (req.user)
        const customerId = req.user.id;

        // 1. Validate Items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must have at least one item' });
        }

        // 1. Calculate Loyalty Points Earned (e.g., 1 Point per Rs. 100)
        // Ensure total is valid
        const deliveryFeeVal = parseFloat(deliveryFee || 0);

        // We will calculate finalTotal AFTER items processing to ensure authority
        let pointsUsed = parseFloat(discount || 0);

        // 2. Transaction: Create Order & Update Customer Points
        const result = await prisma.$transaction(async (prisma) => {

            // Prepare Order Items with strict parsing
            // Prepare Order Items with strict parsing and backend price validation
            let customOrderDetails = null;

            const orderItemsData = await Promise.all(items.map(async (item) => {
                let vId = null;
                if (item.variantId) {
                    const parsed = parseInt(item.variantId);
                    if (!isNaN(parsed)) vId = parsed;
                }

                let unitPrice = parseFloat(item.price || 0);

                // --- CUSTOM ORDER PRICE AUTHENTICATION ---
                if (item.isCustom && item.customDetails) {
                    const { categoryId, sizeId, shapeId, flavorId, decorationPrice } = item.customDetails;

                    let calculatedPrice = 0;

                    // Fetch components prices
                    if (categoryId) {
                        const cat = await prisma.cakeCategory.findUnique({ where: { id: parseInt(categoryId) } });
                        if (cat) calculatedPrice += parseFloat(cat.basePrice);
                    }
                    if (sizeId) {
                        const size = await prisma.cakeSize.findUnique({ where: { id: parseInt(sizeId) } });
                        if (size) calculatedPrice += parseFloat(size.price);
                    }
                    if (shapeId) {
                        const shape = await prisma.cakeShape.findUnique({ where: { id: parseInt(shapeId) } });
                        if (shape) calculatedPrice += parseFloat(shape.price);
                    }
                    if (flavorId) {
                        const flavor = await prisma.cakeFlavor.findUnique({ where: { id: parseInt(flavorId) } });
                        if (flavor) calculatedPrice += parseFloat(flavor.price);
                    }

                    // Hardcoded Decoration Prices (Sync with Frontend until DB table exists)
                    const DECORATIONS = { 'None': 0, 'Flowers': 500, 'Topper': 300, 'Gold Leaf': 600 };
                    // item.customDetails spread includes topDecoration from frontend formData
                    const decorationName = item.customDetails.topDecoration || 'None';
                    calculatedPrice += (DECORATIONS[decorationName] || 0);

                    if (calculatedPrice > 0) {
                        unitPrice = calculatedPrice;
                    }

                    // Capture details for CustomOrder table (First one only due to schema constraint)
                    if (!customOrderDetails) {
                        customOrderDetails = {
                            sizeId: sizeId ? parseInt(sizeId) : null,
                            shapeId: shapeId ? parseInt(shapeId) : null,
                            flavorId: flavorId ? parseInt(flavorId) : null,
                            quantity: parseInt(item.quantity),
                            specialInstructions: item.customDetails.instructions || '',
                            calculatedPrice: unitPrice
                        };
                    }
                }
                // ----------------------------------------

                // --- BULK ORDER PRICE AUTHENTICATION ---
                if (item.isBulk && item.bulkDetails) {
                    const { cakeType, quantity: bulkQty, eventName, organization, instructions } = item.bulkDetails;
                    const qty = parseInt(bulkQty) || 0;

                    // Enforce Minimum Quantity Rule
                    if (qty < 50) {
                        throw new Error(`Bulk order quantity for ${cakeType} must be at least 50. Received: ${qty}`);
                    }

                    // Fetch Bulk Pricing Rule
                    const pricingRule = await prisma.bulkPricing.findUnique({
                        where: { categoryLabel: cakeType }
                    });

                    let calculatedTotal = 0;

                    if (pricingRule) {
                        const effectivePrice = (qty >= pricingRule.bulkThreshold)
                            ? parseFloat(pricingRule.bulkPrice)
                            : parseFloat(pricingRule.basePrice);

                        calculatedTotal = effectivePrice * qty;
                    } else {
                        // Fallback Backend Logic if rule missing (matching frontend fallback)
                        const effectivePrice = (qty >= 100) ? 220 : 250;
                        calculatedTotal = effectivePrice * qty;
                    }

                    if (calculatedTotal > 0) {
                        unitPrice = calculatedTotal; // For Bulk, ItemQuantity is 1, UnitPrice is Total for the batch
                    }

                    // Capture details for BulkOrder table
                    // We attach this to the request scope to use later in creation
                    if (!req.bulkOrderDetails) {
                        req.bulkOrderDetails = {
                            eventName: eventName,
                            organization: organization,
                            quantity: qty,
                            notes: instructions
                        };
                    }
                }
                // ----------------------------------------

                return {
                    variantId: vId,
                    quantity: parseInt(item.quantity) || 1,
                    unitPrice: unitPrice,
                    // Snapshot Fields for Order Items (Historical Data & Custom Orders)
                    name: item.name || item.productName || 'Unknown Item',
                    image: item.image || item.productImage || null,
                    description: item.description || (item.variant ? `${item.variant.size?.label || ''} ${item.variant.flavor?.label || ''}` : ''),
                    customDetails: item.customDetails || (item.isBulk ? item.bulkDetails : null)
                };
            }));

            // Prepare Delivery Data
            const deliveryData = details ? {
                create: {
                    recipientName: details.name || req.user.name,
                    phoneNumber: details.phone,
                    address: details.address || '',
                    deliveryMethod: details.method || 'Standard', // standard, express, etc.
                    deliveryFee: parseFloat(deliveryFee || 0)
                }
            } : undefined;

            // Prepare Payment Data (Initial State)
            const paymentData = {
                create: {
                    paymentMethod: paymentMethod || 'COD',
                    paymentStatus: 'PENDING'
                }
            };

            // Recalculate Total strictly
            const itemsTotal = orderItemsData.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
            const calculatedTotal = itemsTotal + deliveryFeeVal - pointsUsed;
            const pointsEarned = Math.floor(itemsTotal / 100);

            console.log("DEBUG LOYALTY:", {
                discountRaw: discount,
                pointsUsed,
                itemsTotal,
                calculatedTotal,
                pointsEarned,
                customerId
            });

            // --- PAYMENT LOGIC BASED ON USER INTENT ---
            const { paymentType, bankSlip } = req.body;
            const isFull = paymentType === 'full' && (paymentMethod === 'ONLINE_PAYMENT' || paymentMethod === 'BANK_TRANSFER');

            let advanceAmount = 0;
            let balanceAmount = calculatedTotal;
            let initialAdvanceStatus = 'PENDING';

            if (isFull) {
                if (bankSlip) initialAdvanceStatus = 'UPLOADED_FULL';
            } else {
                if (bankSlip) initialAdvanceStatus = 'UPLOADED_ADVANCE';
            }

            // Create Order
            const newOrder = await prisma.order.create({
                data: {
                    total: calculatedTotal,
                    loyaltyDiscount: pointsUsed,
                    status: 'NEW',

                    // Payment Fields
                    paymentStatus: 'PENDING', // Global status
                    paymentMethod: paymentMethod || 'COD',

                    // Advance Payment Fields
                    advanceAmount: advanceAmount,
                    balanceAmount: balanceAmount,
                    advanceStatus: initialAdvanceStatus,
                    bankSlip: bankSlip || null,

                    address: details && details.address ? details.address : '',
                    customerId: customerId,
                    orderType: orderType || 'REGULAR',
                    specialNotes: specialNotes || '',
                    items: {
                        create: orderItemsData
                    },
                    delivery: deliveryData,
                    payment: paymentData,
                    deliveryDate: details && details.deliveryDate ? new Date(details.deliveryDate) : null,
                    customOrder: customOrderDetails ? { create: customOrderDetails } : undefined,
                    bulkOrder: req.bulkOrderDetails ? { create: req.bulkOrderDetails } : undefined
                },
                include: {
                    items: true,
                    delivery: true,
                    payment: true
                }
            });

            // Update Customer Points
            // Urgent Order Effect: Deduct 500 points extra
            let totalPointsRedeemed = Math.floor(pointsUsed);
            if (orderType === 'URGENT') {
                totalPointsRedeemed += 500;
            }

            if (pointsEarned > 0 || totalPointsRedeemed > 0) {
                await prisma.customer.update({
                    where: { id: customerId },
                    data: {
                        loyaltyPoints: {
                            increment: pointsEarned - totalPointsRedeemed
                        },
                        // Log transaction
                        loyaltyTransactions: {
                            create: {
                                pointsEarned: pointsEarned,
                                pointsRedeemed: totalPointsRedeemed,
                                orderId: newOrder.id
                            }
                        }
                    }
                });
            }

            return { newOrder, pointsEarned };
        });

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                ...result.newOrder,
                isCustom: !!req.body.items.some(i => i.isCustom),
                isBulk: !!req.body.items.some(i => i.isBulk)
            },
            pointsEarned: result.pointsEarned
        });

    } catch (error) {
        console.error('[OrderController:createOrder] Error:', error);
        res.status(500).json({ error: 'Failed to create order: ' + error.message });
    }
};

// GET single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                cake: { include: { category: true } },
                                size: true,
                                shape: true,
                                flavor: true
                            }
                        }
                    }
                },
                delivery: true,
                payment: true,
                customOrder: true,
                bulkOrder: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Format for frontend consistency
        const formatted = {
            ...order,
            total: parseFloat(order.total),
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice),
                currentPrice: parseFloat(item.variant?.price || item.variant?.cake?.category?.basePrice || 0),
                name: item.name || item.variant?.cake?.name || 'Unknown Item',
                image: item.image || item.variant?.cake?.imageUrl || 'https://via.placeholder.com/150',
                description: item.description,
                customDetails: item.customDetails,
                variantDescription: item.variant ? `${item.variant.size.label}, ${item.variant.flavor.label}` : ''
            })),
            isCustom: !!order.customOrder,
            isBulk: !!order.bulkOrder
        };

        res.json(formatted);
    } catch (error) {
        console.error('[OrderController:getOrderById] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET all orders with optional filters
exports.getAllOrders = async (req, res) => {
    try {
        const { status, paymentStatus } = req.query;

        // Build where clause
        const where = {};
        if (status && status !== 'All') {
            where.status = status;
        }
        if (paymentStatus && paymentStatus !== 'All') {
            where.paymentStatus = paymentStatus;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                cake: true,
                                size: true,
                                shape: true,
                                flavor: true
                            }
                        }
                    }
                },
                delivery: true,
                payment: true,
                customOrder: true,
                bulkOrder: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Backend transformation
        const formatted = orders.map(order => ({
            ...order,
            total: parseFloat(order.total),
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice),
                name: item.name || item.variant?.cake?.name || 'Unknown Item',
                image: item.image || item.variant?.cake?.imageUrl,
                description: item.description,
                customDetails: item.customDetails,
                variant: item.variant // Pass full variant details
            })),
            isCustom: !!order.customOrder,
            isBulk: !!order.bulkOrder,
            bulkInfo: order.bulkOrder ? { event: order.bulkOrder.eventName, org: order.bulkOrder.organization } : null
        }));

        res.json(formatted);
    } catch (error) {
        console.error('[OrderController:getAllOrders] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET My Orders (Customer)
exports.getMyOrders = async (req, res) => {
    try {
        const customerId = req.user.id; // From Auth Middleware
        console.log(`[OrderController:getMyOrders] REQUEST DETECTED:`);
        console.log(`[OrderController:getMyOrders] Auth User ID: ${customerId}`);
        console.log(`[OrderController:getMyOrders] Auth User Role: ${req.user.role}`);

        if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

        const orders = await prisma.order.findMany({
            where: { customerId: customerId },
            include: {
                payment: true,
                delivery: true,
                items: {
                    include: {
                        variant: {
                            include: { cake: { include: { category: true } }, size: true, flavor: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[OrderController:getMyOrders] DB Query Result: Found ${orders.length} orders for this ID.`);

        // Format
        const formatted = orders.map(order => ({
            id: order.id,
            date: new Date(order.createdAt).toLocaleDateString(),
            status: order.status,
            total: parseFloat(order.total),
            items: order.items.map(i => ({
                id: i.id, // Important for keying
                productId: i.variant?.cake?.id || i.productId, // Ensure we get product ID
                variantId: i.variantId,
                name: i.name || i.variant?.cake?.name || 'Item',
                quantity: i.quantity,
                price: parseFloat(i.unitPrice || 0),
                currentPrice: parseFloat(i.variant?.price || i.variant?.cake?.category?.basePrice || 0),
                image: i.image || i.variant?.cake?.imageUrl || 'https://via.placeholder.com/150',
                description: i.description,
                customDetails: i.customDetails,
                isBulk: !!order.bulkOrder,
                variant: i.variant
            })),
            deliveryMethod: order.delivery?.deliveryMethod || 'Standard',
            deliveryAddress: order.address || order.delivery?.address || '',
            expected: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Pending'
        }));

        res.json(formatted);

    } catch (error) {
        console.error('[OrderController:getMyOrders] Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT Full Order Update (Edit Order)
exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);
        const { items, total, discount, deliveryFee, details, paymentMethod, orderType, specialNotes } = req.body;
        const customerId = req.user.id;

        const result = await prisma.$transaction(async (prisma) => {
            // 1. Check if order exists and belongs to user
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { customOrder: true, bulkOrder: true }
            });

            if (!existingOrder) throw new Error("Order not found");
            if (String(existingOrder.customerId) !== String(customerId) && req.user.role !== 'ADMIN') {
                throw new Error(`Unauthorized to edit this order. User: ${customerId}, Order Owner: ${existingOrder.customerId}`);
            }

            // --- STRICT VERIFICATION RULES ---
            if (req.user.role !== 'ADMIN') {
                const status = existingOrder.status;
                const paymentStatus = existingOrder.paymentStatus;
                const deliveryDate = existingOrder.deliveryDate ? new Date(existingOrder.deliveryDate) : null;
                const now = new Date();

                // Order Type must be Custom OR Bulk
                const isCustomOrBulk = existingOrder.orderType === 'CUSTOM' || existingOrder.orderType === 'BULK' || !!existingOrder.customOrder || !!existingOrder.bulkOrder;
                if (!isCustomOrBulk) {
                    throw new Error("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
                }

                // Payment Status = Not Paid (i.e. not PAID)
                if (paymentStatus === 'PAID') {
                    throw new Error("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
                }

                // Order Status != Preparing
                if (status === 'PREPARING' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED' || status === 'CANCELLED') {
                    throw new Error("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
                }

                // Delivery Date > Current Date + 2 days
                if (deliveryDate) {
                    // Reset time parts
                    const dDate = new Date(deliveryDate);
                    dDate.setHours(0, 0, 0, 0);
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);

                    const diffTime = dDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 2) {
                        throw new Error("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
                    }
                }

                // Order has not been edited before
                if (existingOrder.isEdited) {
                    throw new Error("This order cannot be edited. Orders can only be modified once, before payment, and at least 2 days before the delivery date.");
                }
            }
            // ---------------------------------

            // 2. Clear existing items and related info that will be replaced
            if (!req.body.detailsOnly) {
                await prisma.orderItem.deleteMany({ where: { orderId } });
            }
            await prisma.delivery.deleteMany({ where: { orderId } });
            // Payment might be kept or updated. Let's update payment intent if needed.

            const updateData = {
                specialNotes: specialNotes || '',
                isEdited: true,
                delivery: details ? {
                    create: {
                        recipientName: details.name || req.user.name,
                        phoneNumber: details.phone,
                        address: details.address || '',
                        deliveryMethod: details.method || 'Standard',
                        deliveryFee: parseFloat(deliveryFee || 0)
                    }
                } : undefined,
                deliveryDate: (details && details.deliveryDate) ? new Date(details.deliveryDate) : existingOrder.deliveryDate
            };

            if (!req.body.detailsOnly) {
                updateData.total = parseFloat(total);
                updateData.loyaltyDiscount = parseFloat(discount || 0);
                updateData.paymentMethod = paymentMethod || 'COD';

                // 3. Prepare New Items
                const orderItemsData = items.map(item => ({
                    variantId: item.variantId ? parseInt(item.variantId) : null,
                    quantity: parseInt(item.quantity) || 1,
                    unitPrice: parseFloat(item.price || 0)
                }));
                updateData.items = { create: orderItemsData };
            }

            // 4. Update Order
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: updateData,
                include: { items: true, delivery: true }
            });

            return updatedOrder;
        });

        res.json({ message: 'Order updated successfully', order: result });

    } catch (error) {
        console.error('[OrderController:updateOrder] Error:', error);
        res.status(500).json({ error: 'Failed to update order: ' + error.message });
    }
};

// PUT Update Order Status (Manual)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['NEW', 'ORDER_PLACED', 'ADMIN_CONFIRMED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const orderId = parseInt(id);

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // BLOCKER: Strict Payment Rules for entering PREPARING stage
        if (status === 'PREPARING') {
            const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';

            if (isOnline) {
                // Online Rule: FULL PAYMENT (100%) required before preparing
                // Advance is not enough. The balance must be cleared too.
                if (order.paymentStatus !== 'PAID') {
                    return res.status(400).json({
                        error: 'Online Orders: Full Payment (100%) must be verified before preparation can start.'
                    });
                }
            } else {
                // COD Rule: Advance (30%) required
                if (order.advanceStatus !== 'APPROVED') {
                    return res.status(400).json({
                        error: 'COD Orders: Mandatory Advance Payment (30%) has not been approved yet.'
                    });
                }
            }
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error('[OrderController:updateOrderStatus] Error:', error);
        res.status(500).json({ error: 'Failed to update status: ' + error.message });
    }
};

// PUT Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        const validStatuses = ['PENDING', 'PAID', 'REFUNDED'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { paymentStatus }
        });

        // Also update the linked Payment record if it exists
        await prisma.payment.updateMany({
            where: { orderId: parseInt(id) },
            data: { paymentStatus: paymentStatus }
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error('[OrderController:updatePaymentStatus] Error:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

// DELETE Order (Cancel)
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        await prisma.$transaction(async (prisma) => {
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) throw new Error("Order not found");

            // --- STRICT VERIFICATION RULES ---
            if (req.user.role !== 'ADMIN') {
                const status = order.status;
                const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
                const now = new Date();

                // Rule 1: Cannot cancel if PREPARING or later
                const blockedStatuses = ['PREPARING', 'ready', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                if (blockedStatuses.includes(status)) {
                    throw new Error(`Cannot cancel order with status: ${status}`);
                }

                // Rule 2: 3-Day Rule
                if (deliveryDate) {
                    const diffTime = deliveryDate - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 3) {
                        throw new Error(`Cannot cancel order within 3 days of delivery. Days remaining: ${diffDays}`);
                    }
                }
            }
            // ---------------------------------

            // Revert Points
            const earned = Math.floor(parseFloat(order.total) / 100);
            const used = parseFloat(order.loyaltyDiscount || 0);

            await prisma.customer.update({
                where: { id: order.customerId },
                data: {
                    loyaltyPoints: {
                        decrement: earned,
                        increment: Math.floor(used) // Give back used points
                    },
                    loyaltyTransactions: {
                        create: {
                            orderId: orderId,
                            pointsEarned: -earned,
                            pointsRedeemed: -Math.floor(used)
                        }
                    }
                }
            });

            // Delete dependencies first (if Cascade not set)
            await prisma.orderItem.deleteMany({ where: { orderId } });
            await prisma.delivery.deleteMany({ where: { orderId } });
            await prisma.payment.deleteMany({ where: { orderId } });
            await prisma.invoice.deleteMany({ where: { orderId } });
            await prisma.customOrder.deleteMany({ where: { orderId } });
            await prisma.bulkOrder.deleteMany({ where: { orderId } });
            await prisma.itemRating.deleteMany({ where: { orderItem: { orderId } } });

            // Delete order
            await prisma.order.delete({ where: { id: orderId } });
        });

        res.json({ message: 'Order cancelled and points reverted.' });
    } catch (error) {
        console.error('[OrderController:deleteOrder] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete order' });
    }
};

// POST Send Invoice (Mock)
exports.sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Sending invoice for Order #${id} to customer...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ message: 'Invoice sent successfully!' });
    } catch (error) {
        console.error('[OrderController:sendInvoice] Error:', error);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
};

// POST Upload Bank Slip (Customer)
// POST Upload Bank Slip (Customer)
exports.uploadBankSlip = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please select an image or PDF.' });
        }

        const bankSlipUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Strict Block: DELIVERED or CANCELLED or already APPROVED
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot upload slip for delivered or cancelled orders.' });
        }

        if (order.advanceStatus === 'APPROVED') {
            // Special Case: Online Orders need Full Payment. Allow Balance Slip upload.
            const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';

            if (isOnline && order.paymentStatus !== 'PAID') {
                // Allow upload for Balance
            } else {
                return res.status(400).json({ error: 'Advance Payment already approved. No need to upload again.' });
            }
        }

        // Update
        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                bankSlip: bankSlipUrl,
                advanceStatus: (function () {
                    if (order.paymentStatus === 'ADVANCE_RECEIVED') return 'UPLOADED_BALANCE';
                    if (order.balanceAmount <= 0) return 'UPLOADED_FULL';
                    return 'UPLOADED_ADVANCE';
                })()
            }
        });

        res.json({ message: 'Payment slip uploaded successfully. Waiting for admin approval.', order: updated });

    } catch (error) {
        console.error('[OrderController:uploadBankSlip] Error:', error);
        res.status(500).json({ error: 'Failed to upload bank slip: ' + error.message });
    }
};

// PUT Approve Payment (Admin)
exports.approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.paymentMethod !== 'ONLINE_PAYMENT' && order.paymentMethod !== 'BANK_TRANSFER' && order.paymentMethod !== 'COD') {
            return res.status(400).json({ error: 'Approval only for supported payment methods (Online, Bank Transfer, COD)' });
        }

        if (!order.bankSlip) {
            return res.status(400).json({ error: 'No bank slip uploaded' });
        }

        let { fullPayment } = req.body;

        // Force Full Payment for Online Orders
        if (order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER') {
            fullPayment = true;
        }

        const total = parseFloat(order.total || 0);
        const advanceToPay = total * 0.30;
        const approvedAmount = fullPayment ? total : advanceToPay;

        // Logic: If status is NEW or ORDER_PLACED, auto-move to CONFIRMED (Production Queue)
        const newStatus = ['NEW', 'ORDER_PLACED'].includes(order.status) ? 'CONFIRMED' : undefined;

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                advanceStatus: 'APPROVED',
                paymentStatus: fullPayment ? 'PAID' : 'ADVANCE_RECEIVED',
                advanceAmount: approvedAmount,
                balanceAmount: total - approvedAmount,
                ...(newStatus && { status: newStatus })
            }
        });

        // Create Transaction History
        await prisma.transaction.create({
            data: {
                orderId: orderId,
                paymentId: order.payment?.id,
                type: 'INCOME',
                category: 'Order Payment',
                amount: approvedAmount,
                description: `Slip Approval for Order #${orderId} (${fullPayment ? 'Full' : 'Advance'}).`,
                paymentMode: 'Bank',
                date: new Date()
            }
        });

        console.log(`[OrderController] Payment Approved. Status: ${updated.status}, Amount: ${approvedAmount}`);

        res.json({ message: `Payment approved (${fullPayment ? 'Full' : 'Advance'}).`, order: updated });

    } catch (error) {
        console.error('[OrderController:approvePayment] Error:', error);
        res.status(500).json({ error: 'Failed to approve payment' });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        let newNotes = order.specialNotes || '';
        if (!newNotes.includes('Customer Confirmed')) {
            newNotes = newNotes ? `${newNotes} | Customer Confirmed` : 'Customer Confirmed';
        }

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { specialNotes: newNotes }
        });

        res.json({ message: 'Order confirmed successfully', order: updated });
    } catch (error) {
        console.error('[OrderController:confirmOrder] Error:', error);
        res.status(500).json({ error: 'Failed to confirm order' });
    }
};

exports.markPaymentReceived = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountReceived, paymentMethod, markAsDelivered } = req.body;
        const orderId = parseInt(id);
        const received = parseFloat(amountReceived);

        if (isNaN(received) || received <= 0) {
            return res.status(400).json({ error: 'Invalid amount received' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true, payment: true }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const currentBalance = parseFloat(order.balanceAmount || 0);
        const currentAdvance = parseFloat(order.advanceAmount || 0);
        const totalAmount = parseFloat(order.total || 0);

        if (received > currentBalance) {
            // Optional: prevent overpayment or just allow it? User said "Recalculate BalanceAmount"
            // For now let's allow but cap it at total? No, let's just do math.
        }

        const newAdvance = currentAdvance + received;
        const newBalance = Math.max(0, totalAmount - newAdvance);

        // Determine Payment Status: PENDING / PARTIAL / PAID
        let newPaymentStatus = 'PARTIAL';
        if (newBalance <= 0) {
            newPaymentStatus = 'PAID';
        } else if (newAdvance === 0) {
            newPaymentStatus = 'PENDING';
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                advanceAmount: newAdvance,
                balanceAmount: newBalance,
                paymentStatus: newPaymentStatus,
                status: markAsDelivered ? 'DELIVERED' : undefined,
                // Update payment record too for sync
                payment: {
                    update: {
                        paymentStatus: newPaymentStatus
                    }
                }
            }
        });

        // Create Transaction History
        await prisma.transaction.create({
            data: {
                orderId: orderId,
                paymentId: order.payment?.id,
                type: 'INCOME',
                category: 'Order Payment',
                amount: received,
                description: `Payment Received for Order #${orderId} (${received === totalAmount ? 'Full' : 'Balance/Advance'}). Method: ${paymentMethod || 'Cash'}`,
                paymentMode: paymentMethod || 'Cash',
                date: new Date()
            }
        });

        res.json({
            message: 'Payment recorded successfully',
            order: updatedOrder,
            receivedAmount: received,
            newBalance: newBalance
        });

    } catch (error) {
        console.error('[OrderController:markPaymentReceived] Error:', error);
        res.status(500).json({ error: 'Failed to record payment: ' + error.message });
    }
};
