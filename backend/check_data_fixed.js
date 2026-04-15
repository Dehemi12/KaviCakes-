const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const customers = await prisma.customer.findMany();
    console.log('Total Customers:', customers.length);
    if (customers.length > 0) {
      console.log('Sample Customer:', customers[0].name);
    }
    const orders = await prisma.order.findMany();
    console.log('Total Orders:', orders.length);
    if (orders.length > 0) {
      console.log('Sample Order Total:', orders[0].total);
    }
    const products = await prisma.cake.findMany();
    console.log('Total Products:', products.length);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

check();
