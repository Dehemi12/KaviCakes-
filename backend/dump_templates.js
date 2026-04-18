const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.notificationtemplate.findMany();
    for (const t of templates) {
        console.log('='.repeat(50));
        console.log(`TYPE: ${t.type}`);
        console.log(`SUBJECT: ${t.subject}`);
        console.log(`BODY:\n${t.body}`);
    }
}

main().finally(() => prisma.$disconnect());
