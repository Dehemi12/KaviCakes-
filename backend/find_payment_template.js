const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.notificationtemplate.findMany({
        where: {
            OR: [
                { subject: { contains: 'Payment Received' } },
                { body: { contains: 'Remaining Balance' } }
            ]
        }
    });
    for (const t of templates) {
        console.log('='.repeat(50));
        console.log(`ID: ${t.id}, TYPE: ${t.type}`);
        console.log(`SUBJECT: ${t.subject}`);
        console.log(`BODY:\n${t.body}`);
    }
}

main().finally(() => prisma.$disconnect());
