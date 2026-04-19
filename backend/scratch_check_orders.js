const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const orders = await prisma.orders.findMany({
      where: {
        id: { gte: 1, lte: 100 }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        deliveryDate: true,
        total: true
      }
    });

    console.log('--- Orders 1-100 ---');
    console.table(orders.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      deliveryDate: o.deliveryDate?.toISOString() || 'N/A'
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
