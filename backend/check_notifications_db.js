const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.notification.count();
        console.log(`Notification Count: ${count}`);
        const notifications = await prisma.notification.findMany();
        console.log('first 2 notifications:', notifications.slice(0, 2));

        const templates = await prisma.notificationTemplate.count();
        console.log(`Template Count: ${templates}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
