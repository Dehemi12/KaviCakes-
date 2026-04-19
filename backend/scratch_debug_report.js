const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dayjs = require('dayjs');

async function debugReport() {
  const startDate = '2026-04-01';
  const endDate = '2026-05-31';

  const start = dayjs(startDate).startOf('day').toDate();
  const end = dayjs(endDate).endOf('day').toDate();

  console.log('Querying for range:', start.toISOString(), 'to', end.toISOString());

  const orders = await prisma.orders.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' }
    }
  });

  console.log('Total Orders Found:', orders.length);
  
  const revenueAgg = orders.reduce((acc, curr) => acc + Number(curr.total), 0);
  console.log('Revenue Aggregate:', revenueAgg);

  const now = dayjs('2026-04-18'); // Mocking today
  const daily = orders.filter(o => dayjs(o.createdAt).isSame(now, 'day'));
  console.log('Orders Today (April 18):', daily.length);
  console.log('Revenue Today:', daily.reduce((a, c) => a + Number(c.total), 0));

  await prisma.$disconnect();
}

debugReport();
