const { PrismaClient } = require('@prisma/client'); 
const { generateInvoiceHTML } = require('./src/utils/invoiceGenerator'); 
const prisma = new PrismaClient(); 
async function test() { 
  try { 
    const order = await prisma.order.findUnique({ 
      where: { id: 3 }, 
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
    const html = generateInvoiceHTML(order);
    console.log('HTML GENERATION WORKED, LENGTH:', html.length); 
  } catch(e) { 
    console.error('Error:', e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
test();
