const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const customers = await prisma.customer.findMany();
  console.log('Total Customers:', customers.length);
  const orders = await prisma.orders.findMany(); // Assuming table is Orders
  console.log('Total Orders:', orders.length);
  process.exit(0);
}

check();
