const { PrismaClient } = require('@prisma/client');
const { sendOrderConfirmation } = require('../utils/mailer');
const { sendTemplateEmail } = require('../utils/emailService');
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
                    let catBase = 0;
                    let sizeMultiplier = 1; // Default to 1x
                    let flavorPremium = 0;

                    if (categoryId) {
                        const cat = await prisma.cakecategory.findUnique({ where: { id: parseInt(categoryId) } });
                        if (cat) catBase = parseFloat(cat.basePrice);
                    }
                    if (sizeId) {
                        const size = await prisma.cakesize.findUnique({ where: { id: parseInt(sizeId) } });
                        if (size) {
                            // Logic: If size price is > 10, treat as additive. If < 10, treat as multiplier.
                            // OR just trust the admin setting. Let's assume weights/multipliers are stored here.
                            sizeMultiplier = parseFloat(size.price) || 1;
                        }
                    }
                    if (flavorId) {
                        const flavor = await prisma.cakeflavor.findUnique({ where: { id: parseInt(flavorId) } });
                        if (flavor) flavorPremium = parseFloat(flavor.price);
                    }

                    // PROPER TECHNIQUE: (Category Base * Size Multiplier) + Flavor Premium
                    calculatedPrice = (catBase * sizeMultiplier) + flavorPremium;

                    // Support for any surviving legacy decorations (optional)
                    const DECORATIONS = { 'None': 0, 'Flowers': 500, 'Topper': 300, 'Gold Leaf': 600 };
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
                    const qty = parseInt(item.bulkDetails.qty_estimate || item.bulkDetails.quantity) || 0;

                    // Enforce Minimum Quantity Rule
                    if (qty < 50) {
                        throw new Error(`Bulk order quantity must be at least 50. Received: ${qty}`);
                    }

                    // For dynamic bulk orders, we trust the calculated frontend unitPrice 
                    // since it's built dynamically from Admin-configured FormFields.
                    // The cart bundle itself acts as quantity=1, with item.price = Total.
                    unitPrice = parseFloat(item.price || 0);

                    // Capture details for BulkOrder table
                    if (!req.bulkOrderDetails) {
                        req.bulkOrderDetails = {
                            eventName: item.bulkDetails.event_name || item.bulkDetails.eventName || 'Dynamic Bulk Event',
                            organization: item.bulkDetails.organization || 'Various',
                            quantity: qty,
                            notes: item.bulkDetails.special_instructions || item.bulkDetails.instructions || ''
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
                    deliveryMethod: details.method || 'Standard',
                    distanceKm: details.distance ? parseFloat(details.distance) : null,
                    deliveryFee: parseFloat(deliveryFee || 0),
                    approximateDeliveryTime: details.deliveryTime || null
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
            // Logic: Trust the frontend unitPrice for Standard items if it's passed 
            // (since variants might have dynamic modifiers or specific pricing)
            const itemsTotal = orderItemsData.reduce((acc, item) => {
                const price = parseFloat(item.unitPrice || 0);
                const qty = parseInt(item.quantity) || 1;
                return acc + (price * qty);
            }, 0);

            const finalDeliveryFee = parseFloat(deliveryFeeVal || 0);
            const rawOrderTotal = itemsTotal + finalDeliveryFee;

            // RULE: Loyalty discount capped at 30% of order gross (matches frontend rule)
            const LOYALTY_CAP_PERCENT = 0.30;
            const maxAllowedDiscount = Math.floor(rawOrderTotal * LOYALTY_CAP_PERCENT);
            const requestedDiscount = parseFloat(pointsUsed || 0);
            const finalLoyaltyDiscount = Math.min(requestedDiscount, maxAllowedDiscount);

            // Ensure total is never negative
            const calculatedTotal = Math.max(0, rawOrderTotal - finalLoyaltyDiscount);
            const pointsEarned = Math.floor(itemsTotal / 100);

            console.log("DEBUG PRICING:", {
                itemsTotal,
                finalDeliveryFee,
                finalLoyaltyDiscount,
                calculatedTotal,
                pointsEarned,
                customerId
            });

            // --- PAYMENT LOGIC BASED ON USER INTENT ---
            const { paymentType, bankSlip } = req.body;
            const isFull = paymentType === 'full' || paymentMethod === 'ONLINE_PAYMENT' || paymentMethod === 'BANK_TRANSFER';

            let startAdvanceAmount = 0;
            let startBalanceAmount = calculatedTotal;
            let initialAdvanceStatus = 'PENDING';

            if (isFull) {
                if (bankSlip) initialAdvanceStatus = 'UPLOADED_FULL';
            } else if (paymentMethod === 'COD') {
                if (bankSlip) initialAdvanceStatus = 'UPLOADED_ADVANCE';
            } else {
                if (bankSlip) initialAdvanceStatus = 'UPLOADED_ADVANCE';
            }

            // Create Order
            const newOrder = await prisma.orders.create({
                data: {
                    total: calculatedTotal,
                    loyaltyDiscount: pointsUsed,
                    status: 'NEW',

                    // Payment Fields
                    paymentStatus: 'PENDING', // Global status
                    paymentMethod: paymentMethod || 'COD',

                    // Advance Payment Fields
                    advanceAmount: startAdvanceAmount,
                    balanceAmount: startBalanceAmount,
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
                    bulkOrder: req.bulkOrderDetails ? { create: req.bulkOrderDetails } : undefined,
                    updatedAt: new Date()
                },
                include: {
                    items: true,
                    delivery: true,
                    payment: true
                }
            });

            // Update Customer Points
            // Use the capped discount (not the uncapped request from frontend)
            let totalPointsRedeemed = Math.floor(finalLoyaltyDiscount);
            // Urgent Order Effect: Deduct 500 points extra as urgency fee
            if (orderType === 'URGENT') {
                totalPointsRedeemed += 500;
            }

            // Safety guard: total points redeemed cannot exceed customer's current balance
            const customerRecord = await prisma.customer.findUnique({ where: { id: customerId }, select: { loyaltyPoints: true } });
            const currentBalance = customerRecord?.loyaltyPoints || 0;
            if (totalPointsRedeemed > currentBalance) {
                throw new Error(`Insufficient loyalty points. Required: ${totalPointsRedeemed}, Available: ${currentBalance}`);
            }

            if (pointsEarned > 0 || totalPointsRedeemed > 0) {
                await prisma.customer.update({
                    where: { id: customerId },
                    data: {
                        loyaltyPoints: {
                            increment: pointsEarned - totalPointsRedeemed
                        },
                        // Log transaction
                        loyaltytransaction: {
                            create: {
                                pointsEarned: pointsEarned,
                                pointsRedeemed: totalPointsRedeemed,
                                orderId: newOrder.id
                            }
                        },
                        updatedAt: new Date()
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

        // Trigger Immediate Notifications for the new order
        const createdOrder = result.newOrder;
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        
        if (customer) {
            // 1. Send Order Placed Confirmation
            sendTemplateEmail('ORDER_CONFIRMED', customer.email, {
                '{customer_name}': customer.name,
                '{order_id}': createdOrder.id,
                '{delivery_date}': createdOrder.deliveryDate ? new Date(createdOrder.deliveryDate).toLocaleDateString() : 'your scheduled date'
            }, createdOrder.id).catch(e => console.error('[OrderController:EmailError]', e));

            // 2. If delivery is within 2 days, trigger payment reminder IMMEDIATELY
            if (createdOrder.deliveryDate) {
                const now = new Date();
                const dDate = new Date(createdOrder.deliveryDate);
                const diffTime = dDate - now;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                // If due tomorrow (diffDays <= 1.1), trigger payment reminder IMMEDIATELY
                if (diffDays <= 1.1) {
                    const isOnline = createdOrder.paymentMethod === 'ONLINE_PAYMENT' || createdOrder.paymentMethod === 'BANK_TRANSFER';
                    const needsPayment = isOnline ? createdOrder.paymentStatus !== 'PAID' : createdOrder.advanceStatus !== 'APPROVED';
                    
                    if (needsPayment) {
                        const templateType = isOnline ? 'FULL_PAYMENT_REQUIRED' : 'ADVANCE_REQUIRED';
                        console.log(`[OrderController] Triggering immediate urgent ${templateType} for Order #${createdOrder.id}`);
                        sendTemplateEmail(templateType, customer.email, {
                            '{customer_name}': customer.name,
                            '{order_id}': createdOrder.id,
                            '{delivery_date}': dDate.toLocaleDateString()
                        }, createdOrder.id).catch(e => console.error('[OrderController:EmailError]', e));
                    }
                }
            }
        }
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

        const order = await prisma.orders.findUnique({
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

        const orders = await prisma.orders.findMany({
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

        const orders = await prisma.orders.findMany({
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
            const existingOrder = await prisma.orders.findUnique({
                where: { id: orderId },
                include: { customOrder: true, bulkOrder: true }
            });

            if (!existingOrder) throw new Error("Order not found");
            
            if (existingOrder.status === 'CANCELLED') {
                throw new Error("Cannot edit a cancelled order.");
            }
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
                await prisma.orderitem.deleteMany({ where: { orderId } });
            }
            await prisma.delivery.deleteMany({ where: { orderId } });
            // Payment might be kept or updated. Let's update payment intent if needed.

            const updateData = {
                specialNotes: existingOrder.specialNotes && specialNotes 
                    ? `${existingOrder.specialNotes}\n[Customer Update]: ${specialNotes}` 
                    : (specialNotes || existingOrder.specialNotes || ''),
                isEdited: true,
                delivery: details ? {
                    create: {
                        recipientName: details.name || req.user.name,
                        phoneNumber: details.phone,
                        address: details.address || '',
                        deliveryMethod: details.method || 'Standard',
                        deliveryFee: parseFloat(deliveryFee || 0),
                        approximateDeliveryTime: details.deliveryTime || null
                    }
                } : undefined,
                deliveryDate: (details && details.deliveryDate) ? new Date(details.deliveryDate) : existingOrder.deliveryDate,
                updatedAt: new Date()
            };

            if (!req.body.detailsOnly) {
                const newTotal = parseFloat(total);
                updateData.total = newTotal;
                updateData.balanceAmount = Math.max(0, newTotal - parseFloat(existingOrder.advanceAmount || 0));
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
            const updatedOrder = await prisma.orders.update({
                where: { id: orderId },
                data: updateData,
                include: { items: true, delivery: true, customer: true }
            });

            return updatedOrder;
        });

        res.json({ message: 'Order updated successfully', order: result });

        // Trigger Notification if now within 2 days due to update
        if (result.customer && result.deliveryDate) {
            const now = new Date();
            const dDate = new Date(result.deliveryDate);
            const diffTime = dDate - now;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays <= 2.1) {
                const isOnline = result.paymentMethod === 'ONLINE_PAYMENT' || result.paymentMethod === 'BANK_TRANSFER';
                const needsPayment = isOnline ? result.paymentStatus !== 'PAID' : result.advanceStatus !== 'APPROVED';
                
                if (needsPayment) {
                    const templateType = isOnline ? 'FULL_PAYMENT_REQUIRED' : 'ADVANCE_REQUIRED';
                    console.log(`[OrderController] Triggering immediate urgent ${templateType} after update for Order #${result.id}`);
                    sendTemplateEmail(templateType, result.customer.email, {
                        '{customer_name}': result.customer.name,
                        '{order_id}': result.id,
                        '{delivery_date}': dDate.toLocaleDateString()
                    }, result.id).catch(e => console.error('[OrderController:EmailError]', e));
                }
            }
        }
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

        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: { customer: true }
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot update status of a cancelled order.' });
        }

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

            // NEW BLOCKER: Date Constraint — Preparation can only start within 4 days of delivery
            if (order.deliveryDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Reset today's time
                const dDate = new Date(order.deliveryDate);
                dDate.setHours(0, 0, 0, 0); // Reset delivery date time

                const diffTime = dDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 4) {
                    return res.status(400).json({
                        error: `Too early to start preparation. Preparation can only start within 4 days of the scheduled delivery date (${dDate.toLocaleDateString()}).`
                    });
                }
            }
        }

        const updatedOrder = await prisma.orders.update({
            where: { id: orderId },
            data: { 
                status,
                updatedAt: new Date()
            }
        });

        // Trigger Notification Email if status moved to CONFIRMED
        if (status === 'CONFIRMED' && order.customer) {
            // 1. Send Order Confirmed Confirmation
            sendTemplateEmail('ORDER_CONFIRMED', order.customer.email, {
                '{customer_name}': order.customer.name,
                '{order_id}': order.id,
                '{delivery_date}': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'your scheduled date'
            }, order.id);

            // 2. If delivery is within 2 days, and payment is pending, trigger payment reminder as well
            if (order.deliveryDate) {
                const now = new Date();
                const dDate = new Date(order.deliveryDate);
                const diffTime = dDate - now;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                // If due tomorrow (diffDays <= 1.1), trigger payment reminder IMMEDIATELY
                if (diffDays <= 1.1) {
                    const isOnline = order.paymentMethod === 'ONLINE_PAYMENT' || order.paymentMethod === 'BANK_TRANSFER';
                    const needsPayment = isOnline ? order.paymentStatus !== 'PAID' : order.advanceStatus !== 'APPROVED';
                    
                    if (needsPayment) {
                        const templateType = isOnline ? 'FULL_PAYMENT_REQUIRED' : 'ADVANCE_REQUIRED';
                        console.log(`[OrderController] Triggering urgent ${templateType} upon confirmation for Order #${order.id}`);
                        sendTemplateEmail(templateType, order.customer.email, {
                            '{customer_name}': order.customer.name,
                            '{order_id}': order.id,
                            '{delivery_date}': dDate.toLocaleDateString()
                        }, order.id).catch(e => console.error('[OrderController:EmailError]', e));
                    }
                }
            }
        }

        if (status === 'READY' && order.customer) {
            sendTemplateEmail('READY', order.customer.email, {
                '{customer_name}': order.customer.name,
                '{order_id}': order.id
            }, order.id).catch(e => console.error('[OrderController:ReadyEmailError]', e));
        }

        if (status === 'DELIVERED' && order.customer) {
            // 1. Generate Invoice Record if not exists
            const { generateInvoiceHTML } = require('../utils/invoiceGenerator');
            const dayjs = require('dayjs');
            
            let invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
            if (!invoice) {
                const year = dayjs().year();
                const invoiceNumber = `INV-${year}-${order.id.toString().padStart(5, '0')}`;
                invoice = await prisma.invoice.create({
                    data: {
                        orderId: order.id,
                        invoiceNumber,
                        issuedAt: new Date()
                    }
                });
            }

            // 2. Fetch full order details for invoice generation
            const fullOrder = await prisma.orders.findUnique({
                where: { id: order.id },
                include: {
                    customer: true,
                    items: true,
                    delivery: true,
                    invoice: true
                }
            });

            // 3. Generate HTML
            const invoiceHTML = generateInvoiceHTML(fullOrder);

            // 4. Send Email (Pass the invoice HTML as a variable)
            sendTemplateEmail('DELIVERED', order.customer.email, {
                '{customer_name}': order.customer.name,
                '{order_id}': order.id,
                '{invoice_content}': invoiceHTML
            }, order.id).catch(e => console.error('[OrderController:InvoiceEmailError]', e));
        }

        if (status === 'CANCELLED' && order.customer) {
            console.log(`[OrderController] Sending Order Rejected email to ${order.customer.email} for Order #${order.id}`);
            sendTemplateEmail('ORDER_REJECTED', order.customer.email, {
                '{customer_name}': order.customer.name,
                '{order_id}': order.id
            }, order.id).catch(e => console.error('[OrderController:RejectEmailError]', e));
        }

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
        const { paymentStatus, total, note } = req.body;
        const orderId = parseInt(id);

        const order = await prisma.orders.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot update a cancelled order.' });
        }

        const updateData = {};

        // Case 1: Admin is adjusting the price/total
        if (total !== undefined) {
            const newTotal = parseFloat(total);
            if (isNaN(newTotal) || newTotal < 0) {
                return res.status(400).json({ error: 'Invalid total amount' });
            }
            const currentAdvance = parseFloat(order.advanceAmount || 0);
            updateData.total = newTotal;
            // Recalculate balance based on new total
            updateData.balanceAmount = Math.max(0, newTotal - currentAdvance);

            // Log the adjustment to specialNotes
            const adjNote = note ? `[Price Adjusted by Admin: Rs.${newTotal} — ${note}]` : `[Price Adjusted by Admin: Rs.${newTotal}]`;
            updateData.specialNotes = order.specialNotes
                ? `${order.specialNotes}\n${adjNote}`
                : adjNote;
        }

        // Case 2: Admin is changing payment status
        if (paymentStatus) {
            const validStatuses = ['PENDING', 'PAID', 'REFUNDED', 'ADVANCE_RECEIVED'];
            if (!validStatuses.includes(paymentStatus)) {
                return res.status(400).json({ error: 'Invalid payment status' });
            }
            updateData.paymentStatus = paymentStatus;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateData.updatedAt = new Date();
        const updatedOrder = await prisma.orders.update({
            where: { id: orderId },
            data: updateData
        });

        if (paymentStatus) {
            await prisma.payment.updateMany({
                where: { orderId },
                data: { paymentStatus }
            });
        }

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
            const order = await prisma.orders.findUnique({
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
                    loyaltytransaction: {
                        create: {
                            orderId: orderId,
                            pointsEarned: -earned,
                            pointsRedeemed: -Math.floor(used)
                        }
                    },
                    updatedAt: new Date()
                }
            });

            // Delete dependencies first (if Cascade not set)
            await prisma.orderitem.deleteMany({ where: { orderId } });
            await prisma.delivery.deleteMany({ where: { orderId } });
            await prisma.payment.deleteMany({ where: { orderId } });
            await prisma.invoice.deleteMany({ where: { orderId } });
            await prisma.customorder.deleteMany({ where: { orderId } });
            await prisma.bulkorder.deleteMany({ where: { orderId } });
            await prisma.itemrating.deleteMany({ where: { orderItem: { orderId } } });
            await prisma.transaction.deleteMany({ where: { orderId } });

            // Delete order
            await prisma.orders.delete({ where: { id: orderId } });
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
        const order = await prisma.orders.findUnique({ where: { id: parseInt(id) } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot send invoice for a cancelled order.' });
        }
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

        const url = req.originalUrl || '';
        let folder;
        if (url.includes('/upload-slip')) {
            folder = 'slips';
        } else if (url.includes('/upload/site') || url.includes('/content')) {
            folder = 'site';
        } else {
            folder = 'cakes'; // default: cake images
        }
        const bankSlipUrl = `${req.protocol}://${req.get('host')}/uploads/${folder}/${req.file.filename}`;

        const order = await prisma.orders.findUnique({ where: { id: orderId } });
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
        const updated = await prisma.orders.update({
            where: { id: orderId },
            data: {
                bankSlip: bankSlipUrl,
                advanceStatus: (function () {
                    if (order.paymentStatus === 'ADVANCE_RECEIVED') return 'UPLOADED_BALANCE';
                    if (order.balanceAmount <= 0) return 'UPLOADED_FULL';
                    return 'UPLOADED_ADVANCE';
                })(),
                updatedAt: new Date()
            },
            include: { customer: true }
        });

        // Send email to customer
        if (updated.customer) {
            const { sendTemplateEmail } = require('../utils/emailService');
            sendTemplateEmail('BANK_SLIP_RECEIVED', updated.customer.email, {
                '{customer_name}': updated.customer.name,
                '{order_id}': updated.id,
                '{delivery_date}': updated.deliveryDate ? new Date(updated.deliveryDate).toLocaleDateString() : 'your scheduled date'
            }, updated.id).catch(e => console.error('Failed to send BANK_SLIP_RECEIVED email', e));
        }

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

        const order = await prisma.orders.findUnique({ 
            where: { id: orderId },
            include: { payment: true } 
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot approve payment for a cancelled order.' });
        }

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
        // Bulk orders require 50% advance, regular orders 30%
        const isBulk = order.orderType === 'BULK' || order.orderType === 'CUSTOM'; // Custom/Bulk prioritized
        const advancePercentage = isBulk ? 0.50 : 0.30;
        const advanceToPay = total * advancePercentage;
        
        const approvedAmount = fullPayment ? total : advanceToPay;

        // NOTE: Order status is NOT changed here. Payment and order status are independent.
        // Admin must manually update order status in the Orders page.
        const updated = await prisma.orders.update({
            where: { id: orderId },
            data: {
                advanceStatus: 'APPROVED',
                paymentStatus: fullPayment ? 'PAID' : 'ADVANCE_RECEIVED',
                advanceAmount: approvedAmount,
                balanceAmount: total - approvedAmount,
                updatedAt: new Date()
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
                date: new Date(),
                updatedAt: new Date()
            }
        });

        // Fetch customer to send email
        const customerData = await prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customerData) {
            sendTemplateEmail('PAYMENT_CONFIRMED', customerData.email, {
                '{customer_name}': customerData.name,
                '{order_id}': order.id,
                '{total_amount}': `Rs.${total}`,
                '{advance_amount}': `Rs.${approvedAmount}`,
                '{balance_amount}': `Rs.${total - approvedAmount}`,
                '{delivery_date}': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'your scheduled date'
            }, order.id);
        }

        console.log(`[OrderController] Payment Approved. Status: ${updated.status}, Amount: ${approvedAmount}`);

        res.json({ message: `Payment approved (${fullPayment ? 'Full' : 'Advance'}).`, order: updated });

    } catch (error) {
        console.error('[OrderController:approvePayment] Error:', error);
        res.status(500).json({ error: 'Failed to approve payment' });
    }
};

exports.rejectPaymentSlip = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);

        const order = await prisma.orders.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot reject payment slip for a cancelled order.' });
        }

        const updated = await prisma.orders.update({
            where: { id: orderId },
            data: {
                advanceStatus: 'REJECTED',
                bankSlip: null,
                updatedAt: new Date()
            },
            include: { customer: true }
        });

        if (updated.customer) {
            const { sendTemplateEmail } = require('../utils/emailService');
            sendTemplateEmail('PAYMENT_SLIP_REJECTED', updated.customer.email, {
                '{customer_name}': updated.customer.name,
                '{order_id}': updated.id
            }, updated.id).catch(e => console.error('Failed to send PAYMENT_SLIP_REJECTED email', e));
        }

        res.json({ message: 'Payment slip rejected. Customer will need to upload a new one.', order: updated });

    } catch (error) {
        console.error('[OrderController:rejectPaymentSlip] Error:', error);
        res.status(500).json({ error: 'Failed to reject payment slip' });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await prisma.orders.findUnique({ where: { id: orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot confirm a cancelled order.' });
        }

        let newNotes = order.specialNotes || '';
        if (!newNotes.includes('Customer Confirmed')) {
            newNotes = newNotes ? `${newNotes} | Customer Confirmed` : 'Customer Confirmed';
        }

        const updated = await prisma.orders.update({
            where: { id: orderId },
            data: { 
                specialNotes: newNotes,
                updatedAt: new Date()
            }
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

        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: { customer: true, payment: true }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Cannot record payment for a cancelled order.' });
        }

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
        let newAdvanceStatus = order.advanceStatus;

        if (newBalance <= 0) {
            newPaymentStatus = 'PAID';
            newAdvanceStatus = 'APPROVED'; // Also approve advance if fully paid
        } else if (newAdvance > 0) {
            newPaymentStatus = 'PARTIAL'; // Not fully paid, but advance collected
            newAdvanceStatus = 'APPROVED'; // If any money is collected, mark advance as approved
        } else if (newAdvance === 0) {
            newPaymentStatus = 'PENDING';
        }

        const updatedOrder = await prisma.orders.update({
            where: { id: orderId },
            data: {
                advanceAmount: newAdvance,
                balanceAmount: newBalance,
                paymentStatus: newPaymentStatus,
                advanceStatus: newAdvanceStatus,
                status: markAsDelivered ? 'DELIVERED' : undefined,
                updatedAt: new Date(),
                // Update payment record too for sync
                payment: {
                    update: {
                        paymentStatus: newPaymentStatus
                    }
                }
            },
            include: { customer: true }
        });

        if (updatedOrder.paymentStatus === 'PAID' && updatedOrder.customer) {
            const { sendTemplateEmail } = require('../utils/emailService');
            sendTemplateEmail('PAYMENT_CONFIRMED', updatedOrder.customer.email, {
                '{customer_name}': updatedOrder.customer.name,
                '{order_id}': updatedOrder.id,
                '{total_amount}': `Rs.${totalAmount}`,
                '{advance_amount}': `Rs.${newAdvance}`,
                '{balance_amount}': `Rs.${newBalance}`,
                '{delivery_date}': updatedOrder.deliveryDate ? new Date(updatedOrder.deliveryDate).toLocaleDateString() : 'your scheduled date'
            }, updatedOrder.id).catch(e => console.error('Failed to send PAYMENT_CONFIRMED email', e));
        }

        if (markAsDelivered && updatedOrder.customer) {
            const { sendTemplateEmail } = require('../utils/emailService');
            sendTemplateEmail('DELIVERED', updatedOrder.customer.email, {
                '{customer_name}': updatedOrder.customer.name,
                '{order_id}': updatedOrder.id
            }, updatedOrder.id).catch(e => console.error('Failed to send DELIVERED email', e));
        }

        // Create Transaction History
        await prisma.transaction.create({
            data: {
                orderId: orderId,
                paymentId: order.payment?.id,
                type: 'INCOME',
                category: 'Order Payment',
                amount: received,
                description: `Payment Received config: Rs.${received}. Balance remaining: Rs.${newBalance}. Method: ${paymentMethod || 'Cash'}`,
                paymentMode: paymentMethod || 'Cash',
                date: new Date(),
                updatedAt: new Date()
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

// PUT Cancel Order (Customer-initiated, no payment made)
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);
        const customerId = req.user.id;

        const order = await prisma.orders.findUnique({
            where: { id: orderId },
            include: { customer: true }
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Only the order owner can cancel
        if (String(order.customerId) !== String(customerId)) {
            return res.status(403).json({ error: 'You are not authorized to cancel this order.' });
        }

        // Already cancelled
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ error: 'This order is already cancelled.' });
        }

        // Block if order is past early stages
        const nonCancellableStatuses = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
        if (nonCancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                error: 'This order cannot be cancelled as it is already being prepared or delivered.'
            });
        }

        // Block if any payment has been submitted or approved
        const hasPaid = order.paymentStatus === 'PAID' ||
            order.advanceStatus === 'APPROVED' ||
            (order.advanceStatus && order.advanceStatus.startsWith('UPLOADED'));

        if (hasPaid) {
            return res.status(400).json({
                error: 'This order cannot be cancelled because a payment has already been submitted. Please contact us directly.'
            });
        }

        // Restore loyalty points that were redeemed on this order
        if (order.loyaltyDiscount && parseFloat(order.loyaltyDiscount) > 0) {
            const pointsToRestore = Math.floor(parseFloat(order.loyaltyDiscount));
            await prisma.customer.update({
                where: { id: customerId },
                data: { 
                    loyaltyPoints: { increment: pointsToRestore },
                    updatedAt: new Date()
                }
            });
        }

        // Cancel the order
        await prisma.orders.update({
            where: { id: orderId },
            data: { 
                status: 'CANCELLED',
                updatedAt: new Date()
            }
        });

        // Send cancellation notification email
        if (order.customer?.email) {
            sendTemplateEmail('ORDER_REJECTED', order.customer.email, {
                '{customer_name}': order.customer.name,
                '{order_id}': order.id
            }, order.id).catch(e => console.error('[cancelOrder:EmailError]', e));
        }

        res.json({ message: 'Order cancelled successfully.' });
    } catch (error) {
        console.error('[OrderController:cancelOrder] Error:', error);
        res.status(500).json({ error: 'Failed to cancel order: ' + error.message });
    }
};
