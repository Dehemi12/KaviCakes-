const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // --- Seed Bulk Pricing ---
    console.log('Seeding Bulk Pricing...');
    const bulkItems = [
        { categoryLabel: 'Cupcakes', basePrice: 200, bulkPrice: 180, bulkThreshold: 100, minOrderQty: 50 },
        { categoryLabel: 'Mini Cakes', basePrice: 350, bulkPrice: 320, bulkThreshold: 100, minOrderQty: 50 },
        { categoryLabel: 'Jar Cakes', basePrice: 450, bulkPrice: 400, bulkThreshold: 50, minOrderQty: 25 },
        { categoryLabel: 'Brownies', basePrice: 150, bulkPrice: 130, bulkThreshold: 100, minOrderQty: 50 },
    ];

    for (const item of bulkItems) {
        await prisma.bulkPricing.upsert({
            where: { categoryLabel: item.categoryLabel },
            update: item,
            create: item
        });
    }

    // 1. Create Admin
    const email = 'admin@kavicakes.com';
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.admin.upsert({
        where: { email },
        update: {},
        create: { email, password: hashedPassword, name: 'Super Admin' },
    });

    // 2. Master Data
    const sizes = [
        { label: '500g', price: 0 },
        { label: '1kg', price: 1000 },
        { label: '2kg', price: 2500 },
        { label: '3kg', price: 4000 }
    ];
    const shapes = [
        { label: 'Round', price: 0 },
        { label: 'Square', price: 500 },
        { label: 'Heart', price: 800 },
        { label: 'Rectangle', price: 600 }
    ];
    const flavors = [
        { label: 'Chocolate', price: 500 },
        { label: 'Vanilla', price: 0 },
        { label: 'Red Velvet', price: 800 },
        { label: 'Strawberry', price: 400 },
        { label: 'Coffee', price: 450 },
        { label: 'Butterscotch', price: 600 }
    ];

    const sizeMap = {};
    for (const s of sizes) {
        const res = await prisma.cakeSize.upsert({ where: { label: s.label }, update: { price: s.price }, create: { label: s.label, price: s.price } });
        sizeMap[s.label] = res.id;
    }
    const shapeMap = {};
    for (const s of shapes) {
        const res = await prisma.cakeShape.upsert({ where: { label: s.label }, update: { price: s.price }, create: { label: s.label, price: s.price } });
        shapeMap[s.label] = res.id;
    }
    const flavorMap = {};
    for (const s of flavors) {
        const res = await prisma.cakeFlavor.upsert({ where: { label: s.label }, update: { price: s.price }, create: { label: s.label, price: s.price } });
        flavorMap[s.label] = res.id;
    }

    // 3. Cake Categories
    const categories = [
        { name: 'Cakes', basePrice: 4500 },
        { name: 'Cupcakes', basePrice: 2000 },
        { name: 'Pastries', basePrice: 1500 },
        { name: 'Cookies', basePrice: 1000 }
    ];

    const categoryMap = {};
    for (const c of categories) {
        const res = await prisma.cakeCategory.upsert({
            where: { name: c.name },
            update: { basePrice: c.basePrice },
            create: { name: c.name, basePrice: c.basePrice }
        });
        categoryMap[c.name] = res.id;
    }

    // 4. Products (Cakes)
    const products = [
        { name: 'Chocolate Cake', category: 'Cakes', description: 'Rich chocolate cake.', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=500' },
        { name: 'Vanilla Cupcakes', category: 'Cupcakes', description: 'Classic vanilla cupcakes.', imageUrl: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&q=80&w=500' },
        { name: 'Red Velvet Cake', category: 'Cakes', description: 'Red Velvet cake.', imageUrl: 'https://images.unsplash.com/photo-1586788680434-30d324636fc2?auto=format&fit=crop&q=80&w=500' },
        { name: 'Cheese Cake', category: 'Pastries', description: 'Blueberry Cheesecake.', imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500' },
        { name: 'Chocolate Chip Cookies', category: 'Cookies', description: 'Classic cookies.', imageUrl: 'https://images.unsplash.com/photo-1499636138143-bd649043ea52?auto=format&fit=crop&q=80&w=500' }
    ];

    for (const p of products) {
        const existing = await prisma.cake.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.cake.create({
                data: {
                    name: p.name,
                    description: p.description,
                    imageUrl: p.imageUrl,
                    categoryId: categoryMap[p.category],
                    variants: {
                        create: [
                            { price: 0, sizeId: sizeMap['1kg'], shapeId: shapeMap['Round'], flavorId: flavorMap['Chocolate'] },
                            { price: 1500, sizeId: sizeMap['2kg'], shapeId: shapeMap['Square'], flavorId: flavorMap['Red Velvet'] }
                        ]
                    }
                }
            });
        }
    }

    // 4. Customers
    const customersData = [
        { displayId: 'C001', name: 'Amal Perera', email: 'amal.p@example.com', phone: '077-123-4567', loyaltyPoints: 1300 },
        { displayId: 'C002', name: 'Didul Chamikara', email: 'chamikara@example.com', phone: '071-234-5678', loyaltyPoints: 900 },
        { displayId: 'C003', name: 'Dinusha Jayathilake', email: 'dinusha.j@example.com', phone: '076-345-6789', loyaltyPoints: 600 },
        { displayId: 'C004', name: 'Thilini Rajapakse', email: 'thilini.r@example.com', phone: '070-456-7890', loyaltyPoints: 600 },
        { displayId: 'C065', name: 'Kavindi Ratnayake', email: 'kavindi@example.com', phone: '075-567-8901', loyaltyPoints: 1200 },
    ];

    for (const c of customersData) {
        await prisma.customer.upsert({ where: { email: c.email }, update: { ...c }, create: { ...c } });
    }

    const customers = await prisma.customer.findMany(); // Fetch created customers for order assignment

    // 7. Orders with Delivery Dates
    const today = new Date();
    const datePlus2 = new Date(today); datePlus2.setDate(today.getDate() + 2);
    const datePlus5 = new Date(today); datePlus5.setDate(today.getDate() + 5);

    const ordersToCreate = [
        { customerId: customers[0].id, total: 4500, status: 'CONFIRMED', deliveryDate: today, items: { create: [{ name: 'Chocolate Cake', quantity: 1, price: 4500 }] } }, // Due Today (Out for Delivery)
        { customerId: customers[1].id, total: 2500, status: 'PREPARING', deliveryDate: datePlus2, items: { create: [{ name: 'Vanilla Cupcakes', quantity: 1, price: 2500 }] } }, // Due in 2 days (Edit Order)
        { customerId: customers[2].id, total: 8000, status: 'NEW', deliveryDate: datePlus5, items: { create: [{ name: 'Wedding Cake', quantity: 1, price: 8000 }] } }, // Due in 5 days (Bulk Confirm)
        { customerId: customers[3].id, total: 1500, status: 'DELIVERED', deliveryDate: new Date(today.getTime() - 86400000), items: { create: [{ name: 'Cookies', quantity: 2, price: 750 }] } }, // Delivered yesterday (Feedback)
        { customerId: customers[0].id, total: 3000, status: 'CONFIRMED', paymentStatus: 'PENDING', paymentMethod: 'BANK_TRANSFER', deliveryDate: datePlus2, items: { create: [{ name: 'Red Velvet', quantity: 1, price: 3000 }] } } // Pending Bank Payment
    ];

    for (const o of ordersToCreate) {
        await prisma.order.create({ data: o });
    }

    const orders = await prisma.order.findMany(); // Fetch orders for feedback assignment

    // 8. Feedbacks
    const feedbacks = [
        { customerId: customers[2].id, orderId: orders[3].id, rating: 5, title: 'Superb cake', comment: 'Thank you for the cake. It was amazing.', status: 'PENDING' },
        { customerId: customers[0].id, orderId: orders[0].id, rating: 4, title: 'Good service', comment: 'Delivery was on time, cake tasted good.', status: 'APPROVED' },
    ];

    for (const f of feedbacks) {
        await prisma.feedback.create({ data: f });
    }

    // 5. Templates (Matching Screenshot)
    const templates = [
        { title: 'Request Order Confirmation', category: 'Order', body: 'Kavicakes Order #{{order_id}}: Final confirmation needed for your delivery on {{date}}.' },
        { title: 'Edit order', category: 'Order', body: 'Kavicakes Reminder: Hi {{name}}, we are getting ready to bake your order.' },
        { title: 'Out for Delivery', category: 'Order', body: 'Your order #{{order_id}} is out for delivery.' },
        { title: 'Order Delivered', category: 'Order', body: 'Your order #{{order_id}} has been delivered. Enjoy your treats!' },
        { title: 'Payment Confirmation', category: 'Payment', body: 'Your payment of {{amount}} for order #{{order_id}} has been received. Thank you!' },
        { title: 'Special Discount', category: 'Promotion', body: 'Enjoy {{discount}}% off on your next order.' },
        { title: 'Birthday Offer', category: 'Promotion', body: 'Happy Birthday! Enjoy a free cupcake with any purchase today.' },
        { title: 'Feedback Request', category: 'Customer', body: 'We hope you enjoyed your order! Please take a moment to share your feedback.' },
    ];

    for (const t of templates) {
        await prisma.notificationTemplate.create({ data: t });
    }

    // 6. Notifications (Mocking the Unread List)
    const notificationTime = new Date();

    // Bulk Order Request
    await prisma.notification.create({
        data: {
            title: 'New Bulk Order Request',
            message: 'Kavindi Ratnayake has requested a bulk order for a Corporate Event on June 5, 2023',
            type: 'ORDER',
            isRead: false,
            createdAt: new Date(notificationTime.getTime() - 15 * 60000) // 15 mins ago
        }
    });

    // Cake for Delivery
    await prisma.notification.create({
        data: {
            title: 'Cake for Delivery',
            message: 'Deliver Amal Perera for order #1082 Today!',
            type: 'DELIVERY',
            isRead: false,
            createdAt: new Date(notificationTime.getTime() - 2 * 3600000) // 2 hours ago
        }
    });

    // Payment Confirmation (The one user specifically asked for flow)
    await prisma.notification.create({
        data: {
            title: 'Payment Slip Uploaded',
            message: 'Customer Didul Chamikara attached a bank slip for Order #1095',
            type: 'PAYMENT',
            isRead: false,
            metadata: { orderId: 1095, slipUrl: 'https://via.placeholder.com/300x500?text=Bank+Slip' },
            createdAt: new Date(notificationTime.getTime() - 3 * 3600000)
        }
    });

    // 9. Manual Transactions (Cashbook)
    const transactions = [
        { type: 'EXPENSE', category: 'Rent', amount: 50000.00, description: 'Monthly Shop Rent', date: new Date() },
        { type: 'EXPENSE', category: 'Utilities', amount: 12000.50, description: 'Electricity Bill', date: new Date() },
        { type: 'EXPENSE', category: 'Salaries', amount: 85000.00, description: 'Staff Salaries', date: new Date() },
        { type: 'INCOME', category: 'Manual_Income', amount: 5000.00, description: 'Cash Sale - Walk-in', date: new Date() }
    ];

    for (const t of transactions) {
        await prisma.transaction.create({ data: t });
    }

    console.log('✅ Notifications & Transactions seeded');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
