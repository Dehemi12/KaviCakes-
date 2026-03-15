
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function audit() {
    try {
        const customers = await prisma.customer.findMany();
        const orders = await prisma.order.findMany();

        let report = "AUDIT REPORT\n";
        report += "========================================\n";
        report += `Total Customers: ${customers.length}\n`;
        report += `Total Orders: ${orders.length}\n\n`;

        report += "CUSTOMERS:\n";
        customers.forEach(c => {
            report += `[${c.id}] ${c.email} (Active: ${c.isActive})\n`;
        });

        report += "\nORDERS:\n";
        orders.forEach(o => {
            const owner = customers.find(c => c.id === o.customerId);
            report += `[Order #${o.id}] Status: ${o.status} | CustomerID: ${o.customerId} | OwnerFound: ${owner ? 'YES (' + owner.email + ')' : 'NO'}\n`;
        });

        fs.writeFileSync('.agent/audit_report.txt', report);
        console.log("Audit complete. Saved to .agent/audit_report.txt");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
